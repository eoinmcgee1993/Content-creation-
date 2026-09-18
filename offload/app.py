"""Flask waitlist site for the Offload landing page.

Serves the single-page landing at ``/`` and captures waitlist signups at
``/subscribe``. Signups are appended to a local CSV (the source of truth)
and, if an email provider is configured, best-effort synced there too.

Rename the product in ONE place: the ``BRAND`` constant below (or set the
``OFFLOAD_BRAND`` environment variable). It flows into every template.
"""

from __future__ import annotations

import csv
import fcntl
import os
import re
from datetime import datetime, timezone

from flask import (
    Flask,
    jsonify,
    redirect,
    render_template,
    request,
    send_from_directory,
    url_for,
)

from .subscribers import provider_name, sync_subscriber

# --- product identity -------------------------------------------------------
BRAND = os.environ.get("OFFLOAD_BRAND", "Offload")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
SIGNUPS_PATH = os.environ.get("SIGNUPS_PATH", os.path.join(BASE_DIR, "signups.csv"))
SIGNUP_FIELDS = ["timestamp", "email", "source", "provider", "provider_synced"]

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _record_signup(row: dict[str, str]) -> None:
    os.makedirs(os.path.dirname(SIGNUPS_PATH) or ".", exist_ok=True)
    with open(SIGNUPS_PATH, "a", newline="", encoding="utf-8") as fh:
        fcntl.flock(fh.fileno(), fcntl.LOCK_EX)
        try:
            writer = csv.DictWriter(fh, fieldnames=SIGNUP_FIELDS)
            if os.fstat(fh.fileno()).st_size == 0:
                writer.writeheader()
            writer.writerow(row)
        finally:
            fcntl.flock(fh.fileno(), fcntl.LOCK_UN)


def _wants_json() -> bool:
    return (
        request.headers.get("X-Requested-With") == "fetch"
        or "application/json" in (request.headers.get("Accept") or "")
    )


def create_app() -> Flask:
    app = Flask(__name__, static_folder=None)

    @app.context_processor
    def inject_brand() -> dict[str, str]:
        return {"brand": BRAND}

    @app.route("/")
    def index():
        return render_template("index.html")

    @app.route("/subscribe", methods=["POST"])
    def subscribe():
        email = (request.form.get("email") or "").strip().lower()

        if not EMAIL_RE.match(email) or len(email) > 254:
            if _wants_json():
                return jsonify(ok=False, error="Please enter a valid email address."), 400
            return render_template("index.html", error="Please enter a valid email address."), 400

        synced, detail = sync_subscriber(email)
        if not synced and detail not in ("disabled",):
            app.logger.warning("email provider sync failed: %s", detail)

        _record_signup(
            {
                "timestamp": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                "email": email,
                "source": request.form.get("source", "landing") or "landing",
                "provider": provider_name() or "none",
                "provider_synced": "yes" if synced else detail,
            }
        )

        if _wants_json():
            return jsonify(ok=True)
        return redirect(url_for("thanks"))

    @app.route("/thanks")
    def thanks():
        return render_template("thanks.html")

    @app.route("/static/<path:name>")
    def static_files(name: str):
        return send_from_directory(STATIC_DIR, name)

    @app.route("/healthz")
    def healthz():
        return {"status": "ok"}

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    app.run(host="0.0.0.0", port=port)
