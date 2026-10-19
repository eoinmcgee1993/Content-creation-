# Landing (audit lead capture)

A Flask lead-capture page in `landing/` that offers a sample ads/SEO audit
report in exchange for an email address. It deploys to both Render and
Vercel.

## What it is

- A "Flask lead-capture app", tested with `pytest landing/tests -q` and run in
  CI [[sources/root-claude-md#Test suites and CI]].
- The freebie is a sample audit report. CI checks that `build_freebie`
  produces `landing/static/sample-audit-report.pdf`
  [[sources/deploy-config#CI workflows]].
- Its CI also runs on changes under `audits/**`
  [[sources/deploy-config#CI workflows]], although root `CLAUDE.md` describes
  each CI workflow as "path-filtered to their own directory"
  [[sources/root-claude-md#Test suites and CI]]. **Inference:** the freebie
  is built with the `audits/` report generator, which is why a change there
  can break it.
- The audit rates it "real but thin", a commodity lead-capture app
  [[sources/productized-audit#Rejected candidates]].

## Two deploy targets

Root `CLAUDE.md` calls these "two live deploy targets for one app"
[[sources/root-claude-md#Deploy targets and traps]].

| | Render | Vercel |
|---|---|---|
| Config | service `audit-landing` in `render.yaml` | root `vercel.json`, which sends every path to `api/index.py` |
| Leads CSV | `/data/leads.csv`, on a 1 GB persistent disk | `/tmp/leads.csv` |
| Deploys | `autoDeploy: true` | not recorded in the repo |

Sources: [[sources/deploy-config#Render blueprint]],
[[sources/deploy-config#Vercel config]].

Leads can also be synced to Mailchimp or MailerLite, but that is off unless
`EMAIL_PROVIDER` is set [[sources/deploy-config#Render blueprint]]. Both
hosts are covered in [[entities/render]] and [[entities/vercel]].

> [!NOTE]
> **Gap.** On Vercel, the leads log is `/tmp/leads.csv`
> [[sources/deploy-config#Vercel config]]. **Inference**, from how the
> platform behaves rather than from any source here: Vercel doesn't keep
> `/tmp` between function instances. So on that target a lead survives only
> if the email-provider sync is on. The sync is off by default in the Render
> config [[sources/deploy-config#Render blueprint]], and the Vercel project's
> settings aren't in the repo. Check them before relying on Vercel to capture
> leads.
