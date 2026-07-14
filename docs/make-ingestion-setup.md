# Phase 2 — Make.com Ingestion Module

Configure a Make.com scenario with the three modules below. This is the only
manual setup step in the entire pipeline; once saved and activated the scenario
runs on its own schedule.

---

## Module 1 — Trigger: Apify Webhook Listener

| Field | Value |
|---|---|
| Type | Webhooks → Custom Webhook (or Apify → Watch Actor Run) |
| Filter queries | `how to template`, `looking for checklist`, `need prompt setup`, `excel sheet guide` |
| Schedule | Every 15 minutes (or on Apify actor completion) |

Connect the Apify actor that scrapes your target community boards (Reddit,
Indie Hackers, Product Hunt discussions, etc.) and configure it to POST results
to this Make.com webhook endpoint.

---

## Module 2 — Data Transform: HTML → Plain Text

| Field | Value |
|---|---|
| Type | Tools → Text Parser (or a custom Function module) |
| Operation | Strip all HTML tags, encode entities, remove image/script URLs |
| Output variable | `cleaned_body_text` |

Use the built-in **Text Parser → HTML to Text** transformer.  
Map the actor's `body` output field to the input.

---

## Module 3 — Action: HTTP POST to Supabase

| Field | Value |
|---|---|
| Type | HTTP → Make an API Key Request |
| Method | POST |
| URL | `https://<YOUR_SUPABASE_PROJECT_ID>.supabase.co/rest/v1/scraped_signals` |

**Headers:**

```
apikey:        <YOUR_SUPABASE_ANON_KEY>
Authorization: Bearer <YOUR_SUPABASE_SERVICE_ROLE_KEY>
Content-Type:  application/json
Prefer:        return=representation
```

**Body (JSON):**

```json
{
  "source_platform": "{{item.source}}",
  "raw_text":        "{{cleaned_body_text}}",
  "processing_status": "pending"
}
```

---

## Wiring the Database Trigger → Edge Function

After the HTTP POST inserts a row, Supabase's Database Webhook (or a
pg_net-based trigger) must call `build-digital-asset`. Configure this in
**Supabase Dashboard → Database → Webhooks → Create a new hook**:

| Field | Value |
|---|---|
| Table | `scraped_signals` |
| Events | INSERT |
| URL | `https://<YOUR_SUPABASE_PROJECT_ID>.supabase.co/functions/v1/build-digital-asset` |
| HTTP method | POST |
| Headers | `Authorization: Bearer <YOUR_SUPABASE_SERVICE_ROLE_KEY>` |

Supabase will forward the full `record` payload automatically.

---

## Environment Variables to Set in Supabase Dashboard

Navigate to **Project Settings → Edge Functions → Secrets** and add:

| Key | Value |
|---|---|
| `GEMINI_API_KEY` | Your Google AI Studio API key |
| `RESEND_API_KEY` | Your Resend.com API key |
| `CHECKOUT_BASE_URL` | e.g. `https://checkout.lemon.dev/buy` |
| `FROM_EMAIL` | e.g. `fulfillment@yourdomain.com` |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically by
the Supabase runtime.
