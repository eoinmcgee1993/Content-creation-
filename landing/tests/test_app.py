import csv
import os

import pytest

from landing import app as app_module
from landing import email_sync


@pytest.fixture()
def client(tmp_path, monkeypatch):
    leads = tmp_path / "leads.csv"
    monkeypatch.setattr(app_module, "LEADS_PATH", str(leads))
    application = app_module.create_app()
    application.config.update(TESTING=True)
    with application.test_client() as c:
        c._leads_path = str(leads)
        yield c


def test_index_renders(client):
    r = client.get("/")
    assert r.status_code == 200
    assert b"Verify Your Answer Engine Presence" in r.data


def test_valid_subscribe_records_lead_and_redirects(client):
    r = client.post(
        "/subscribe",
        data={"email": "Buyer@Company.com", "website": "company.com",
              "monthly_ad_spend": "$5k–$25k"},
    )
    assert r.status_code == 302
    assert "/thanks" in r.headers["Location"]
    with open(client._leads_path, newline="", encoding="utf-8") as fh:
        rows = list(csv.DictReader(fh))
    assert len(rows) == 1
    assert rows[0]["email"] == "buyer@company.com"
    assert rows[0]["website"] == "company.com"


def test_invalid_email_rejected(client):
    r = client.post("/subscribe", data={"email": "not-an-email"})
    assert r.status_code == 400
    assert b"valid email" in r.data
    assert not os.path.exists(client._leads_path)


def test_thanks_offers_downloads(client):
    r = client.get("/thanks")
    assert r.status_code == 200
    assert b"sample-audit-report" in r.data


def test_freebie_pdf_downloadable(client):
    r = client.get("/download/sample-audit-report.pdf")
    assert r.status_code == 200
    assert r.data[:4] == b"%PDF"


def test_download_rejects_arbitrary_paths(client):
    r = client.get("/download/..%2f..%2fapp.py")
    assert r.status_code == 404


def test_healthz(client):
    assert client.get("/healthz").get_json() == {"status": "ok"}


def test_lead_records_provider_disabled_by_default(client):
    client.post("/subscribe", data={"email": "a@b.com"})
    with open(client._leads_path, newline="", encoding="utf-8") as fh:
        row = next(csv.DictReader(fh))
    assert row["provider"] == "none"
    assert row["provider_synced"] == "disabled"


def test_successful_provider_sync_is_recorded(client, monkeypatch):
    monkeypatch.setattr(app_module, "sync_subscriber",
                        lambda e, f: (True, "http 200"))
    monkeypatch.setattr(app_module, "provider_name", lambda: "mailerlite")
    client.post("/subscribe", data={"email": "lead@co.com", "website": "co.com"})
    with open(client._leads_path, newline="", encoding="utf-8") as fh:
        row = next(csv.DictReader(fh))
    assert row["provider"] == "mailerlite"
    assert row["provider_synced"] == "yes"


def test_provider_failure_does_not_block_capture(client, monkeypatch):
    monkeypatch.setattr(app_module, "sync_subscriber",
                        lambda e, f: (False, "network error: URLError"))
    monkeypatch.setattr(app_module, "provider_name", lambda: "mailchimp")
    r = client.post("/subscribe", data={"email": "lead@co.com"})
    assert r.status_code == 302
    with open(client._leads_path, newline="", encoding="utf-8") as fh:
        row = next(csv.DictReader(fh))
    assert row["email"] == "lead@co.com"
    assert row["provider_synced"] == "network error: URLError"


def test_email_sync_disabled_without_env(monkeypatch):
    monkeypatch.delenv("EMAIL_PROVIDER", raising=False)
    assert email_sync.sync_subscriber("x@y.com", {}) == (False, "disabled")


def test_mailchimp_requires_config(monkeypatch):
    monkeypatch.setenv("EMAIL_PROVIDER", "mailchimp")
    monkeypatch.delenv("MAILCHIMP_API_KEY", raising=False)
    monkeypatch.delenv("MAILCHIMP_LIST_ID", raising=False)
    ok, detail = email_sync.sync_subscriber("x@y.com", {})
    assert ok is False
    assert "not configured" in detail
