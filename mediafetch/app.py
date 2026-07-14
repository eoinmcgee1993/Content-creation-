"""MediaFetch — backend for the reel-downloader PWA.

Serves the installable web app and exposes a download endpoint that runs
yt-dlp server-side and streams the file back to the phone. Downloads are
restricted to Instagram URLs to limit abuse and SSRF.

Access tiers (auto-selected from env vars, most capable first):

  accounts  SUPABASE_URL + SUPABASE_JWT_SECRET + SUPABASE_SERVICE_ROLE_KEY
            + Stripe set. Users log in (Supabase magic link) and downloads
            require an active per-user subscription. Works across devices.
  paywall   Only Stripe set. Downloads require a completed Checkout, tracked
            by a short HMAC-signed cookie (per device, no database).
  open      Nothing set. Downloads are unrestricted (local development).

Environment variables:
  STRIPE_SECRET_KEY          Stripe secret key
  STRIPE_PRICE_ID            recurring price id for the subscription
  STRIPE_WEBHOOK_SECRET      signing secret for /api/stripe/webhook (accounts)
  APP_SECRET                 signs access cookies (paywall tier)
  ACCESS_DAYS                cookie access days, default 31 (paywall tier)
  APP_BASE_URL               public base url for Checkout redirects
  SUPABASE_URL               Supabase project URL (accounts tier)
  SUPABASE_ANON_KEY          public anon key, sent to the browser (accounts)
  SUPABASE_JWT_SECRET        verifies user access tokens (accounts)
  SUPABASE_SERVICE_ROLE_KEY  writes subscription rows from the webhook (accounts)
"""
import base64
import hashlib
import hmac
import os
import re
import shutil
import tempfile
import time
from datetime import datetime, timezone
from urllib.parse import urlparse

import httpx
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
ACTIVE_STATUSES = {"active", "trialing"}


# ---------------------------------------------------------------------------
# Tier selection
# ---------------------------------------------------------------------------
def _stripe_configured() -> bool:
    return bool(os.getenv("STRIPE_SECRET_KEY") and os.getenv("STRIPE_PRICE_ID"))


def _accounts_configured() -> bool:
    return bool(
        _stripe_configured()
        and os.getenv("SUPABASE_URL")
        and os.getenv("SUPABASE_JWT_SECRET")
        and os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    )


def auth_mode() -> str:
    if _accounts_configured():
        return "accounts"
    if _stripe_configured():
        return "paywall"
    return "open"


# ---------------------------------------------------------------------------
# Paywall tier: signed cookie
# ---------------------------------------------------------------------------
def _sign(exp: int) -> str:
    secret = os.environ["APP_SECRET"].encode()
    sig = hmac.new(secret, str(exp).encode(), hashlib.sha256).digest()
    return f"{exp}.{base64.urlsafe_b64encode(sig).decode().rstrip('=')}"


def _cookie_valid(token: str) -> bool:
    if not token or "." not in token:
        return False
    exp_str, _ = token.split(".", 1)
    try:
        exp = int(exp_str)
    except ValueError:
        return False
    return exp >= time.time() and hmac.compare_digest(token, _sign(exp))


# ---------------------------------------------------------------------------
# Accounts tier: Supabase JWT + subscription lookup
# ---------------------------------------------------------------------------
def _verify_user(request: Request) -> dict | None:
    """Return the Supabase JWT claims for a valid Bearer token, else None."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    import jwt

    try:
        return jwt.decode(
            auth[7:],
            os.environ["SUPABASE_JWT_SECRET"],
            algorithms=["HS256"],
            audience="authenticated",
        )
    except Exception:
        return None


def _has_active_subscription(user_id: str) -> bool:
    base = os.environ["SUPABASE_URL"].rstrip("/")
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    try:
        r = httpx.get(
            f"{base}/rest/v1/mediafetch_subscriptions",
            headers={"apikey": key, "Authorization": f"Bearer {key}"},
            params={"user_id": f"eq.{user_id}", "select": "status,current_period_end"},
            timeout=10,
        )
        r.raise_for_status()
        rows = r.json()
    except Exception:
        return False
    if not rows:
        return False
    row = rows[0]
    if row.get("status") not in ACTIVE_STATUSES:
        return False
    end = row.get("current_period_end")
    if not end:
        return True
    try:
        return datetime.fromisoformat(end.replace("Z", "+00:00")) > datetime.now(timezone.utc)
    except ValueError:
        return True


def _upsert_subscription(user_id: str, **fields) -> None:
    base = os.environ["SUPABASE_URL"].rstrip("/")
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    payload = {"user_id": user_id, "updated_at": datetime.now(timezone.utc).isoformat(), **fields}
    httpx.post(
        f"{base}/rest/v1/mediafetch_subscriptions",
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates",
        },
        params={"on_conflict": "user_id"},
        json=payload,
        timeout=10,
    ).raise_for_status()


# ---------------------------------------------------------------------------
# Shared gate
# ---------------------------------------------------------------------------
def _has_access(request: Request) -> bool:
    mode = auth_mode()
    if mode == "open":
        return True
    if mode == "paywall":
        return _cookie_valid(request.cookies.get(ACCESS_COOKIE, ""))
    claims = _verify_user(request)
    return bool(claims and _has_active_subscription(claims["sub"]))


def _require_access(request: Request) -> None:
    if _has_access(request):
        return
    if auth_mode() == "accounts" and not _verify_user(request):
        raise HTTPException(status_code=401, detail="Sign in to continue.")
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
# Config / payments
# ---------------------------------------------------------------------------
@app.get("/api/config")
def config(request: Request):
    mode = auth_mode()
    out = {
        "mode": mode,
        "paymentsEnabled": mode != "open",
        "hasAccess": _has_access(request),
    }
    if mode == "accounts":
        out["supabaseUrl"] = os.getenv("SUPABASE_URL")
        out["supabaseAnonKey"] = os.getenv("SUPABASE_ANON_KEY")
    return out


@app.post("/api/checkout")
def checkout(request: Request):
    mode = auth_mode()
    if mode == "open":
        raise HTTPException(status_code=400, detail="Payments are not configured.")
    import stripe

    stripe.api_key = os.environ["STRIPE_SECRET_KEY"]
    base = (os.getenv("APP_BASE_URL") or str(request.base_url)).rstrip("/")
    params = dict(
        mode="subscription",
        line_items=[{"price": os.environ["STRIPE_PRICE_ID"], "quantity": 1}],
        success_url=f"{base}/?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{base}/",
    )

    if mode == "accounts":
        claims = _verify_user(request)
        if not claims:
            raise HTTPException(status_code=401, detail="Sign in to subscribe.")
        # Tie the subscription to the user so webhook events can map back to them.
        params["client_reference_id"] = claims["sub"]
        params["subscription_data"] = {"metadata": {"user_id": claims["sub"]}}
        if claims.get("email"):
            params["customer_email"] = claims["email"]

    session = stripe.checkout.Session.create(**params)
    return {"url": session.url}


@app.post("/api/activate")
def activate(body: ActivateRequest):
    # Paywall (cookie) tier only. Accounts tier is synced by the webhook.
    if auth_mode() != "paywall":
        raise HTTPException(status_code=400, detail="Not applicable in this mode.")
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


@app.post("/api/stripe/webhook")
async def stripe_webhook(request: Request):
    # Accounts tier: keep each user's subscription row in sync with Stripe.
    if auth_mode() != "accounts":
        raise HTTPException(status_code=400, detail="Webhook not enabled.")
    import stripe

    stripe.api_key = os.environ["STRIPE_SECRET_KEY"]
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    secret = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig, secret)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid signature.")

    obj = event["data"]["object"]
    etype = event["type"]

    if etype == "checkout.session.completed":
        user_id = obj.get("client_reference_id")
        sub_id = obj.get("subscription")
        if user_id and sub_id:
            sub = stripe.Subscription.retrieve(sub_id)
            _upsert_subscription(
                user_id,
                stripe_customer_id=obj.get("customer"),
                stripe_subscription_id=sub_id,
                status=sub.get("status", "active"),
                current_period_end=datetime.fromtimestamp(
                    sub["current_period_end"], timezone.utc
                ).isoformat(),
            )
    elif etype in ("customer.subscription.updated", "customer.subscription.deleted"):
        user_id = (obj.get("metadata") or {}).get("user_id")
        if user_id:
            _upsert_subscription(
                user_id,
                stripe_subscription_id=obj.get("id"),
                status=obj.get("status", "canceled"),
                current_period_end=datetime.fromtimestamp(
                    obj["current_period_end"], timezone.utc
                ).isoformat() if obj.get("current_period_end") else None,
            )

    return JSONResponse({"received": True})


@app.get("/healthz")
def healthz():
    return JSONResponse({"ok": True})


# Serve the PWA at the root.
app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
