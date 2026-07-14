"""Vercel serverless entrypoint for the landing app.

Vercel's Python runtime bundles the repo read-only and only /tmp is writable,
so point the generated freebie report and the leads log at /tmp before the
Flask app is imported (it builds the freebie at import time).
"""

import os

os.environ.setdefault("FREEBIE_OUT", "/tmp/freebie")
os.environ.setdefault("LEADS_PATH", "/tmp/leads.csv")

from landing.app import app  # noqa: E402  (env must be set first)
