"""Flask landing page: captures leads and delivers the freebie audit report."""

from __future__ import annotations

import csv
import os
import re
from datetime import datetime, timezone

from flask import (
    Flask,
    abort,
    redirect,
    render_template,
    request,
    send_from_directory,
    url_for,
)

from .email_sync import provider_name, sync_subscriber
from .freebie import build_freebie

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
# Where the generated freebie report is written. Defaults to STATIC_DIR so
# container/VM hosts are unaffected; serverless hosts (read-only app dir) set
# FREEBIE_OUT to a writable path such as /tmp.
GEN_DIR = os.environ.get("FREEBIE_OUT", STATIC_DIR)
LEADS_PATH = os.environ.get("LEADS_PATH", os.path.join(BASE_DIR, "leads.csv"))
LEADS_FIELDS = [
    "timestamp",
    "email",
    "website",
    "monthly_ad_spend",
    "source",
    "provider",
    "provider_synced",
]

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _record_lead(row: dict[str, str]) -> None:
    new_file = not os.path.exists(LEADS_PATH)
    os.makedirs(os.path.dirname(LEADS_PATH) or ".", exist_ok=True)
    with open(LEADS_PATH, "a", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=LEADS_FIELDS)
        if new_file:
            writer.writeheader()
        writer.writerow(row)


def create_app() -> Flask:
    app = Flask(__name__, static_folder=None)
    freebie_formats = build_freebie(GEN_DIR)

    @app.route("/")
    def index():
        return render_template("index.html", error=None)

    @app.route("/subscribe", methods=["POST"])
    def subscribe():
        email = (request.form.get("email") or "").strip().lower()
        website = (request.form.get("website") or "").strip()[:200]
        spend = (request.form.get("monthly_ad_spend") or "").strip()[:50]

        if not EMAIL_RE.match(email) or len(email) > 254:
            return render_template(
                "index.html", error="Please enter a valid email address."
            ), 400

        synced, detail = sync_subscriber(
            email, {"website": website, "monthly_ad_spend": spend}
        )
        if not synced and detail not in ("disabled",):
            app.logger.warning("email provider sync failed: %s", detail)

        _record_lead(
            {
                "timestamp": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                "email": email,
                "website": website,
                "monthly_ad_spend": spend,
                "source": request.form.get("source", "landing") or "landing",
                "provider": provider_name() or "none",
                "provider_synced": "yes" if synced else detail,
            }
        )
        return redirect(url_for("thanks"))

    @app.route("/thanks")
    def thanks():
        return render_template("thanks.html", formats=freebie_formats)

    @app.route("/download/<path:name>")
    def download(name: str):
        if name not in freebie_formats.values():
            abort(404)
        return send_from_directory(GEN_DIR, name, as_attachment=True)

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
