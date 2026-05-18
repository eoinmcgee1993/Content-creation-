"""Optional best-effort sync of captured leads to an email platform.

Configured entirely via environment variables. If nothing is configured
the app simply skips this step and keeps the local CSV as the source of
truth — provider outages never block lead capture.

Env:
  EMAIL_PROVIDER      "mailchimp" | "mailerlite" | "" (default: off)
  MAILCHIMP_API_KEY   Mailchimp API key (datacenter taken from its suffix)
  MAILCHIMP_LIST_ID   Mailchimp audience/list id
  MAILCHIMP_TAG       Optional tag applied to new members (default "audit-lead")
  MAILERLITE_API_KEY  MailerLite API token
  MAILERLITE_GROUP_ID Optional MailerLite group id to assign

The actual freebie email + follow-up sequence is owned by an automation
you configure in the platform, triggered by the tag/group set here.
"""

from __future__ import annotations

import base64
import json
import os
import urllib.error
import urllib.request

TIMEOUT = 10


def provider_name() -> str:
    return (os.environ.get("EMAIL_PROVIDER") or "").strip().lower()


def _post(url: str, headers: dict[str, str], payload: dict) -> tuple[bool, str]:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            return 200 <= resp.status < 300, f"http {resp.status}"
    except urllib.error.HTTPError as e:
        body = ""
        try:
            body = e.read().decode("utf-8", "replace")
        except Exception:
            pass
        # An already-subscribed contact is a success for our purposes.
        if e.code in (400, 409) and (
            "Member Exists" in body or "already" in body.lower()
        ):
            return True, "already subscribed"
        return False, f"http {e.code}"
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        return False, f"network error: {e.__class__.__name__}"


def _mailchimp(email: str, fields: dict[str, str]) -> tuple[bool, str]:
    api_key = os.environ.get("MAILCHIMP_API_KEY", "")
    list_id = os.environ.get("MAILCHIMP_LIST_ID", "")
    if not api_key or not list_id or "-" not in api_key:
        return False, "mailchimp not configured"
    dc = api_key.rsplit("-", 1)[-1]
    url = f"https://{dc}.api.mailchimp.com/3.0/lists/{list_id}/members"
    auth = base64.b64encode(f"anystring:{api_key}".encode()).decode()
    payload = {
        "email_address": email,
        "status": "subscribed",
        "merge_fields": {
            "WEBSITE": fields.get("website", ""),
            "ADSPEND": fields.get("monthly_ad_spend", ""),
        },
        "tags": [os.environ.get("MAILCHIMP_TAG", "audit-lead")],
    }
    return _post(
        url,
        {"Authorization": f"Basic {auth}", "Content-Type": "application/json"},
        payload,
    )


def _mailerlite(email: str, fields: dict[str, str]) -> tuple[bool, str]:
    api_key = os.environ.get("MAILERLITE_API_KEY", "")
    if not api_key:
        return False, "mailerlite not configured"
    payload: dict = {
        "email": email,
        "fields": {
            "website": fields.get("website", ""),
            "monthly_ad_spend": fields.get("monthly_ad_spend", ""),
        },
    }
    group_id = os.environ.get("MAILERLITE_GROUP_ID", "").strip()
    if group_id:
        payload["groups"] = [group_id]
    return _post(
        "https://connect.mailerlite.com/api/subscribers",
        {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        payload,
    )


def sync_subscriber(email: str, fields: dict[str, str]) -> tuple[bool, str]:
    """Best-effort push to the configured provider. Never raises."""
    provider = provider_name()
    if not provider:
        return False, "disabled"
    try:
        if provider == "mailchimp":
            return _mailchimp(email, fields)
        if provider == "mailerlite":
            return _mailerlite(email, fields)
        return False, f"unknown provider '{provider}'"
    except Exception as e:  # defensive: capture must never fail on sync
        return False, f"error: {e.__class__.__name__}"
