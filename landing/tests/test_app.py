import csv
import os
import tempfile

import pytest

from landing import app as app_module


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
    assert b"AI Account Health Check" in r.data


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
