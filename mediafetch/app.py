"""MediaFetch — minimal backend for the reel-downloader PWA.

Serves the installable web app and exposes a single download endpoint that
runs yt-dlp server-side and streams the resulting file back to the phone.
Downloads are restricted to Instagram URLs to limit abuse and SSRF.
"""
import os
import re
import shutil
import tempfile
from urllib.parse import urlparse

import yt_dlp
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from starlette.background import BackgroundTask

app = FastAPI(title="MediaFetch")

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")

# Only these hosts may be downloaded from. Keeps the tool focused and limits
# it from being used as an open proxy to fetch arbitrary URLs.
ALLOWED_HOSTS = {"instagram.com", "www.instagram.com"}


class DownloadRequest(BaseModel):
    url: str


def _is_allowed(url: str) -> bool:
    try:
        host = urlparse(url).hostname or ""
    except ValueError:
        return False
    return host.lower() in ALLOWED_HOSTS


def _safe_filename(name: str) -> str:
    name = re.sub(r"[^\w.\-]+", "_", name).strip("_")
    return name or "video"


@app.post("/api/download")
def download(req: DownloadRequest):
    url = req.url.strip()
    if not _is_allowed(url):
        raise HTTPException(status_code=400, detail="Only Instagram URLs are supported.")

    tmpdir = tempfile.mkdtemp(prefix="mediafetch_")
    ydl_opts = {
        "outtmpl": os.path.join(tmpdir, "%(id)s.%(ext)s"),
        # Prefer a single progressive MP4 so we never need server-side ffmpeg.
        "format": "best[ext=mp4]/best",
        "noplaylist": True,
        "quiet": True,
        "no_warnings": True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            path = ydl.prepare_filename(info)
    except Exception:  # yt-dlp raises many subclasses; surface a clean message.
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


@app.get("/healthz")
def healthz():
    return JSONResponse({"ok": True})


# Serve the PWA (index.html, manifest, service worker, icons) at the root.
app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
