"""Best-effort sync of waitlist signups to an email platform.

Email-only by design — the waitlist just needs an address and a tag/group
the platform automation can react to. Configured entirely via environment
variables; if nothing is configured the app keeps the local CSV as the
source of truth and never blocks a signup on a provider outage.

Env:
  EMAIL_PROVIDER       "mailchimp" | "mailerlite" | "" (default: off)
  MAILCHIMP_API_KEY    Mailchimp API key (datacenter taken from its suffix)
  MAILCHIMP_LIST_ID    Mailchimp audience/list id
  MAILCHIMP_TAG        Tag applied to new members (default "offload-waitlist")
  MAILERLITE_API_KEY   MailerLite API token
  MAILERLITE_GROUP_ID  Optional MailerLite group id to assign
"""

from __future__ import annotations

import base64
import json
import os
import urllib.error
import urllib.request

TIMEOUT = 10
DEFAULT_TAG = "offload-waitlist"


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


def _mailchimp(email: str) -> tuple[bool, str]:
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
        "tags": [os.environ.get("MAILCHIMP_TAG", DEFAULT_TAG)],
    }
    return _post(
        url,
        {"Authorization": f"Basic {auth}", "Content-Type": "application/json"},
        payload,
    )


def _mailerlite(email: str) -> tuple[bool, str]:
    api_key = os.environ.get("MAILERLITE_API_KEY", "")
    if not api_key:
        return False, "mailerlite not configured"
    payload: dict = {"email": email}
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


def sync_subscriber(email: str) -> tuple[bool, str]:
    """Best-effort push to the configured provider. Never raises."""
    provider = provider_name()
    if not provider:
        return False, "disabled"
    try:
        if provider == "mailchimp":
            return _mailchimp(email)
        if provider == "mailerlite":
            return _mailerlite(email)
        return False, f"unknown provider '{provider}'"
    except Exception as e:  # defensive: capture must never fail on sync
        return False, f"error: {e.__class__.__name__}"
