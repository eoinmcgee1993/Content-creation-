"""Tests for the Offload waitlist app. No network: email provider stays off."""

import csv
import os
import tempfile

import pytest

os.environ.setdefault("EMAIL_PROVIDER", "")  # keep provider sync disabled in tests


@pytest.fixture()
def client(tmp_path, monkeypatch):
    signups = tmp_path / "signups.csv"
    monkeypatch.setenv("SIGNUPS_PATH", str(signups))
    # import after env is set so module-level paths pick it up
    import importlib

    import offload.app as appmod

    importlib.reload(appmod)
    appmod.SIGNUPS_PATH = str(signups)
    app = appmod.create_app()
    app.config.update(TESTING=True)
    return app.test_client(), signups


def test_index_renders_brand(client):
    c, _ = client
    resp = c.get("/")
    assert resp.status_code == 200
    body = resp.get_data(as_text=True)
    assert "Offload" in body
    assert "Join the waitlist" in body


def test_healthz(client):
    c, _ = client
    assert c.get("/healthz").get_json() == {"status": "ok"}


def test_subscribe_records_signup_and_redirects(client):
    c, signups = client
    resp = c.post("/subscribe", data={"email": "Person@Example.com", "source": "hero"})
    assert resp.status_code == 302
    assert resp.headers["Location"].endswith("/thanks")
    rows = list(csv.DictReader(open(signups, encoding="utf-8")))
    assert len(rows) == 1
    assert rows[0]["email"] == "person@example.com"  # normalised to lowercase
    assert rows[0]["source"] == "hero"


def test_subscribe_json_returns_ok(client):
    c, _ = client
    resp = c.post(
        "/subscribe",
        data={"email": "a@b.com"},
        headers={"X-Requested-With": "fetch"},
    )
    assert resp.status_code == 200
    assert resp.get_json() == {"ok": True}


def test_subscribe_rejects_bad_email(client):
    c, signups = client
    resp = c.post(
        "/subscribe",
        data={"email": "not-an-email"},
        headers={"X-Requested-With": "fetch"},
    )
    assert resp.status_code == 400
    assert resp.get_json()["ok"] is False
    assert not os.path.exists(signups)
