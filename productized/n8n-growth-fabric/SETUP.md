# Setup

Every value below was checked against the actual node parameters in the
JSON files, not guessed from the workflow names. Three kinds of value show
up, and n8n treats them differently — knowing which is which up front saves
you a re-import:

- **Credential** — created once in n8n's Credentials manager, then attached
  to a specific node.
- **Variable** — created once in n8n Settings → Variables, referenced in
  nodes as `{{ $vars.NAME }}`. Visible in plain text to anyone with instance
  access, so don't use this for anything you wouldn't put in a shared config
  file.
- **Inline placeholder** — a literal string baked into a node's parameters
  (e.g. `YOUR_LOOPS_TRANSACTIONAL_ID`) that you edit by hand after import.

## 1. Database first

Run `database-schema.sql` once against your Postgres instance:

```bash
psql "$DATABASE_URL" -f database-schema.sql
```

Creates `system_execution_logs` plus one table per pipeline, the indexes
each pipeline's dedup query needs, and two dashboard views. Safe to re-run —
everything is `CREATE TABLE IF NOT EXISTS`.

Then create one n8n **Postgres credential** pointing at this database — all
three workflows use a node literally named to match (`postgres`), and every
`postgres` node in all three pipelines uses the same one.

## 2. Import the workflows

n8n → Workflows → Import from File, once per JSON file. Do this before
touching credentials — n8n will show you every node with a missing
credential or unresolved variable, which is a useful checklist on its own.

## 3. Credentials, variables, and placeholders — by pipeline

### Common to all three

| What | Kind | Notes |
|---|---|---|
| OpenAI API key | Credential (`openAiApi`) | Every `lmChatOpenAi` node in all three pipelines. One key, attach it everywhere. |
| Postgres | Credential (`postgres`) | Same one from step 1. |
| Error logging endpoint | Inline placeholder | Every pipeline's `Send Error to Webhook Log` node has the URL hardcoded as `https://YOUR_ERROR_LOGGING_WEBHOOK_URL`. Point it at a Slack webhook, a second n8n workflow, whatever you actually watch. It won't error if you skip it — it'll just POST to a URL that doesn't exist. |

### Pipeline 1 — Newsletter Engine

| What | Kind | Notes |
|---|---|---|
| Loops.so API key | Credential (`httpHeaderAuth`, named "Loops.so API Key" in the node) | For the `Send Newsletter via Loops.so` node. Get it from Loops.so → Settings → API. |
| Transactional email ID | Inline placeholder | The node's JSON body has `"transactionalId": "YOUR_LOOPS_TRANSACTIONAL_ID"` — create a transactional email in your Loops.so account first, then paste its id in here. |
| Schedule | Node parameter | `Daily 6 AM Trigger` ships as `0 6 * * *`. Edit the cron expression node directly to change it. |

No RSS credentials needed — the three `rssFeedRead` nodes and the Hacker
News `httpRequest` are all public, unauthenticated feeds.

### Pipeline 2 — Affiliate Social Fabric

| What | Kind | Notes |
|---|---|---|
| Google Sheets OAuth2 | Credential (`googleSheetsOAuth2Api`) | For the trigger (`Product Queue - Row Added`) and the `Mark Row LIVE` node. Both need to point at the same sheet — your product queue, one row per product, with a status column the trigger watches. |
| Rainforest API key | **Variable** `RAINFOREST_API_KEY` | Sent as a query param, not a stored credential. rainforestapi.com issues the key. |
| Fal.ai API key | Credential (`httpHeaderAuth`, named "Fal.ai API Key" in the node) | For the `Fal.ai - Generate Product Image` node — set the header value to `Key <your-fal-key>` per Fal's auth docs. |
| Telegram bot token | Credential (`telegramApi`) | For `Telegram - Send Photo Post`. Create a bot via @BotFather, add it to your channel/group. |
| Instagram access token | **Variable** `INSTAGRAM_ACCESS_TOKEN` | Long-lived Page/Instagram access token via Meta's Graph API Explorer or a System User. Passed as a query param on both Instagram nodes. |
| Instagram Business account id | **Variable** `INSTAGRAM_USER_ID` | The Instagram Business Account id linked to your Facebook Page. |
| Facebook Page access token | **Variable** `FACEBOOK_PAGE_ACCESS_TOKEN` | For `Facebook Page - Post Photo`. |
| Facebook Page id | **Variable** `FACEBOOK_PAGE_ID` | — |

**On the Meta tokens specifically:** a token you generate in the Graph API
Explorer expires in ~60 days unless you exchange it for a long-lived token
or use a System User token. This workflow does not refresh tokens for you —
that's on you to manage, same as it would be for any direct Graph API
integration. Read Meta's Platform Terms before pointing this at a real
Page; auto-posting is a policy-sensitive surface.

### Pipeline 3 — B2B Outreach Fabric

| What | Kind | Notes |
|---|---|---|
| Apollo.io API key | **Variable** `APOLLO_API_KEY` | Sent in the JSON body, not a stored credential. |
| Apollo industry tag | Inline placeholder | The request body has `"organization_industry_tag_ids": ["YOUR_SAAS_INDUSTRY_TAG_ID"]` — Apollo's API needs a real tag id for your target industry; look it up via Apollo's own tag-search endpoint or dashboard. |
| Lead targeting | Node parameter | The same request body hardcodes `person_titles` (Founder/CEO/Co-Founder/Managing Director) and `person_locations` (`["Thailand", "Southeast Asia"]`) — this is sample targeting, not a placeholder that breaks if left alone, but you'll want to point it at your own ICP before running it for real. |
| Google Sheets OAuth2 | Credential (`googleSheetsOAuth2Api`) | For `Mark CONTACTED` — logs delivery status to a sheet alongside the Postgres row. |
| Gmail OAuth2 | Credential (`gmailOAuth2`) | For `Gmail - Send Personalized Email`. Sends from whatever account you authenticate. |
| Schedule | Node parameter | `Weekday 9 AM Trigger` ships as `0 9 * * 1-5`. |

**Read `Email Validity & Blacklist Filter` and `Agent B - Compliance
Guardrail` before you activate this one.** The filter node and the
compliance agent are there on purpose — outreach automation is the pipeline
in this pack with the most real-world downside (spam complaints, CAN-SPAM /
GDPR exposure) if it's misconfigured. Don't disable either gate to "get more
sends through."

## 4. Activate and test each pipeline

Do this one pipeline at a time, not all three at once:

1. Toggle the workflow active.
2. Trigger it manually once (n8n's "Execute Workflow" button uses the same
   nodes without waiting for the cron/webhook).
3. Watch it run node-by-node in the n8n editor — this is where a missing
   credential or an unresolved `$vars` reference shows up immediately as a
   red node, before it's live on a schedule.
4. Check `system_execution_logs` for the row it wrote.
5. Query `v_daily_pipeline_summary` — you should see one row for today with
   your pipeline's name.

Only move to the next pipeline once one full run is clean.

## Troubleshooting

- **A node is red with "credentials not found."** You imported before
  creating the credential, or the credential name in n8n doesn't match what
  the node expects. Re-open the node and reselect the credential — n8n
  doesn't auto-relink across imports.
- **`$vars.SOMETHING` renders as empty string / literal text.** The
  Variable wasn't created, or was created with a different name than the
  node references. Variable names are case-sensitive and must match exactly.
- **Pipeline 2 publishes to Telegram but not Instagram/Facebook.** Those two
  fail independently and don't block Telegram — check
  `Log Asset Generation Failure` in Postgres for the specific Graph API
  error (expired token is the most common one).
- **Pipeline 3 sends nothing, ever.** Check `Compliance Status Router` —
  if `Agent B` is rejecting every draft, the compliance prompt may be
  miscalibrated for your industry/tone. Read a few rows in
  `b2b_outreach_leads.compliance_status` for the actual rejection reasons
  before assuming the pipeline is broken.
