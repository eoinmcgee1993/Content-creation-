# Render

Hosts three unrelated Python web services from this repo's single
`render.yaml` blueprint: the audit landing page, the Offload waitlist and
MediaFetch.

| Service | Project | Persistent data | Optional extras |
|---|---|---|---|
| `audit-landing` | [[entities/landing]] | leads CSV on a 1 GB disk at `/data` | Mailchimp or MailerLite sync |
| `offload-waitlist` | `offload/`, a waitlist landing page | signups CSV on a 1 GB disk at `/data` | the same email sync |
| `mediafetch` | `mediafetch/`, an installable reel-downloader PWA | none | Stripe paywall; accounts through Supabase |

Sources: [[sources/deploy-config#Render blueprint]] and
[[sources/root-claude-md#Deploy targets and traps]].

- All three use the `starter` plan and deploy automatically. Their secrets are
  `sync: false`, which means they are set in the Render dashboard, not in the
  file [[sources/deploy-config#Render blueprint]].
- MediaFetch's accounts tier needs the Supabase URL, anon key, JWT secret and
  service-role key [[sources/deploy-config#Render blueprint]]. That tier puts
  it in the Supabase project it shares with CRF
  [[sources/root-claude-md#Deploy targets and traps]]. See
  [[entities/supabase]] and [[entities/stripe]].
- One file provisions three separate products
  [[sources/root-claude-md#Deploy targets and traps]], a small instance of
  [[concepts/monorepo-shared-singletons]].
