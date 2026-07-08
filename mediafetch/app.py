"""MediaFetch — backend for the reel-downloader PWA.

Serves the installable web app and exposes a download endpoint that runs
yt-dlp server-side and streams the file back to the phone. Downloads are
restricted to Instagram URLs to limit abuse and SSRF.

Selling / paywall:
  If STRIPE_SECRET_KEY and STRIPE_PRICE_ID are set, downloads are gated behind
  a Stripe Checkout subscription. A completed checkout mints a short, HMAC-signed
  access cookie (no database required). With those env vars unset the app runs
  open (useful for local development).

Environment variables:
  STRIPE_SECRET_KEY  Stripe secret key (enables the paywall when set with PRICE)
  STRIPE_PRICE_ID    Stripe recurring price id for the subscription
  APP_SECRET         random string used to sign access cookies (required if paid)
  ACCESS_DAYS        access granted per activation, default 31
  APP_BASE_URL       public base url for Checkout redirects (else request origin)
"""
import base64
import hashlib
import hmac
import os
import re
import shutil
import tempfile
import time
from urllib.parse import urlparse

import yt_dlp
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from starlette.background import BackgroundTask

app = FastAPI(title="MediaFetch")

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
ALLOWED_HOSTS = {"instagram.com", "www.instagram.com"}
ACCESS_DAYS = int(os.getenv("ACCESS_DAYS", "31"))
ACCESS_COOKIE = "mf_access"


# ---------------------------------------------------------------------------
# Paywall helpers
# ---------------------------------------------------------------------------
def payments_enabled() -> bool:
    return bool(os.getenv("STRIPE_SECRET_KEY") and os.getenv("STRIPE_PRICE_ID"))


def _sign(exp: int) -> str:
    secret = os.environ["APP_SECRET"].encode()
    sig = hmac.new(secret, str(exp).encode(), hashlib.sha256).digest()
    return f"{exp}.{base64.urlsafe_b64encode(sig).decode().rstrip('=')}"


def _access_valid(token: str) -> bool:
    if not token or "." not in token:
        return False
    exp_str, _ = token.split(".", 1)
    try:
        exp = int(exp_str)
    except ValueError:
        return False
    if exp < time.time():
        return False
    return hmac.compare_digest(token, _sign(exp))


def _require_access(request: Request) -> None:
    if payments_enabled() and not _access_valid(request.cookies.get(ACCESS_COOKIE, "")):
        raise HTTPException(status_code=402, detail="Subscribe to download.")


# ---------------------------------------------------------------------------
# Download
# ---------------------------------------------------------------------------
class DownloadRequest(BaseModel):
    url: str


class ActivateRequest(BaseModel):
    session_id: str


def _is_allowed(url: str) -> bool:
    try:
        host = urlparse(url).hostname or ""
    except ValueError:
        return False
    return host.lower() in ALLOWED_HOSTS


def _safe_filename(name: str) -> str:
    return re.sub(r"[^\w.\-]+", "_", name).strip("_") or "video"


@app.post("/api/download")
def download(req: DownloadRequest, request: Request):
    _require_access(request)

    url = req.url.strip()
    if not _is_allowed(url):
        raise HTTPException(status_code=400, detail="Only Instagram URLs are supported.")

    tmpdir = tempfile.mkdtemp(prefix="mediafetch_")
    ydl_opts = {
        "outtmpl": os.path.join(tmpdir, "%(id)s.%(ext)s"),
        "format": "best[ext=mp4]/best",  # single progressive file, no ffmpeg needed
        "noplaylist": True,
        "quiet": True,
        "no_warnings": True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            path = ydl.prepare_filename(info)
    except Exception:
        shutil.rmtree(tmpdir, ignore_errors=True)
        raise HTTPException(status_code=502, detail="Couldn't fetch that video. It may be private or unavailable.")

    if not os.path.exists(path):
        shutil.rmtree(tmpdir, ignore_errors=True)
        raise HTTPException(status_code=502, detail="Download produced no file.")

    filename = _safe_filename(f"{info.get('id', 'video')}.{info.get('ext', 'mp4')}")
    return FileResponse(
        path,
        media_type="video/mp4",
        filename=filename,
        background=BackgroundTask(shutil.rmtree, tmpdir, ignore_errors=True),
    )


# ---------------------------------------------------------------------------
# Payments
# ---------------------------------------------------------------------------
@app.get("/api/config")
def config(request: Request):
    return {
        "paymentsEnabled": payments_enabled(),
        "hasAccess": (not payments_enabled()) or _access_valid(request.cookies.get(ACCESS_COOKIE, "")),
    }


@app.post("/api/checkout")
def checkout(request: Request):
    if not payments_enabled():
        raise HTTPException(status_code=400, detail="Payments are not configured.")
    import stripe

    stripe.api_key = os.environ["STRIPE_SECRET_KEY"]
    base = (os.getenv("APP_BASE_URL") or str(request.base_url)).rstrip("/")
    session = stripe.checkout.Session.create(
        mode="subscription",
        line_items=[{"price": os.environ["STRIPE_PRICE_ID"], "quantity": 1}],
        success_url=f"{base}/?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{base}/",
    )
    return {"url": session.url}


@app.post("/api/activate")
def activate(body: ActivateRequest):
    if not payments_enabled():
        raise HTTPException(status_code=400, detail="Payments are not configured.")
    import stripe

    stripe.api_key = os.environ["STRIPE_SECRET_KEY"]
    session = stripe.checkout.Session.retrieve(body.session_id)
    if session.get("status") != "complete" or session.get("payment_status") not in ("paid", "no_payment_required"):
        raise HTTPException(status_code=402, detail="Payment not completed.")

    exp = int(time.time()) + ACCESS_DAYS * 86400
    resp = JSONResponse({"activated": True})
    resp.set_cookie(
        ACCESS_COOKIE, _sign(exp),
        httponly=True, secure=True, samesite="lax", max_age=ACCESS_DAYS * 86400,
    )
    return resp


@app.get("/healthz")
def healthz():
    return JSONResponse({"ok": True})


# Serve the PWA at the root.
app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
