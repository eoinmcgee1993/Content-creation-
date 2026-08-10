# Offload — waitlist landing

A single-page waitlist site for **Offload**, a calm braindump app whose AI sorts
captured thoughts into what to *do*, what to *reframe*, and what to *let go*.

The page is a self-contained Flask app: it serves the landing at `/` and captures
signups at `/subscribe` (stored in a local CSV, and best-effort synced to Mailchimp
or MailerLite if configured). Signups never fail because of a provider outage — the
CSV is always the source of truth.

## Rename the product

The brand name lives in **one place**: the `BRAND` constant in `offload/app.py`
(or set the `OFFLOAD_BRAND` env var). It flows into every template. Change it there
and the whole site updates.

## Run locally

```bash
pip install -r offload/requirements.txt
python -m offload.app          # http://localhost:5000
```

## Test

```bash
pip install pytest
pytest offload/tests
```

## Deploy (Render)

The root `render.yaml` defines an `offload-waitlist` web service. In Render:
**New → Blueprint → point at this repo**, then set the email-provider secrets in the
dashboard (they are `sync: false` in the blueprint). To collect real signups, set:

| Env var | Value |
| --- | --- |
| `EMAIL_PROVIDER` | `mailchimp` or `mailerlite` |
| `MAILCHIMP_API_KEY` / `MAILCHIMP_LIST_ID` | your Mailchimp audience (tag: `offload-waitlist`) |
| `MAILERLITE_API_KEY` / `MAILERLITE_GROUP_ID` | your MailerLite token + group |

Leave `EMAIL_PROVIDER` empty to run in CSV-only mode (signups still captured).

The AI clear-out engine described on the page is the next milestone — this repo is
the waitlist front door only.
