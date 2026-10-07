# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

## 5. Repository structure

This repo hosts many small, independent projects and prototypes, not one
application — most share no code, stack, or deploy target. Before working in
a subdirectory, check for its own `README.md`; when one exists it is
authoritative for that project's purpose and commands. Session setup
(`scripts/setup.sh`) installs the root `requirements.txt` — a shared
grab-bag of Python deps spanning several unrelated projects, not scoped to
any one of them — plus `ffmpeg` and the Higgsfield CLI.

**Projects with a test suite, run scoped to their own directory** (there is
no root `pytest.ini`/`conftest.py`):
- `landing/` — Flask lead-capture app: `pytest landing/tests -q`
- `offload/` — Flask waitlist app: `pytest offload/tests -q`
- `audits/` — ads/SEO audit report generator: `pytest audits/tests -q`
- `kdp-compiler/` — Node PDF interior compiler: `npm test` (from inside the directory)
- `substack-os/` — Substack analytics engine: `npm test` (from inside the directory).
  No install step and no dependencies; `package.json` exists only to name the
  command and mark the directory as ESM.
- `thai-id/` — PHP generator of checksum-valid Thai citizen IDs, for test data:
  `php thai-id/tests/run.php`. No PHPUnit and no Composer install; `composer.json`
  only maps the `ThaiId\` autoload for projects that require it.
- `voice_clone/` — recording kit for an ElevenLabs Professional Voice Clone; its
  checker grades takes against ElevenLabs' audio targets:
  `pytest voice_clone/tests -q` (needs `pip install -r voice_clone/requirements.txt`).

The first three also run in CI (`.github/workflows/{landing,offload,audits}.yml`,
path-filtered to their own directory) — `kdp-compiler/`, `substack-os/`,
`thai-id/` and `voice_clone/` do not yet.

**Projects with a build step rather than tests:**
- `trading-dashboard/` — React 19 + Vite: `npm ci && npm run build`, `npm run lint`
  (from inside the directory). Deployed by `.github/workflows/netlify-deploy.yml`
  using its own `NETLIFY_TRADING_DASHBOARD_SITE_ID` secret — never reuse the
  shared `NETLIFY_SITE_ID`, which belongs to a different site.
- `degen-diaries/` — Next.js + Drizzle (Postgres): `npm run typecheck` and
  `npm run build` are the CI gates (`degen-diaries-build.yml`). It carries its
  own `ARCHITECTURE.md`, `DEPLOYMENT.md`, `PRODUCT.md` and `STRIPE.md`; read
  those first.
- `phiraya/` — no build, no tests; see "Phiraya" below.

**Stale CI to be aware of:** `.github/workflows/deploy-ecu-app.yml` ("Deploy CRF
Builder site to Netlify") is `workflow_dispatch`-only — its push trigger is
commented out because the Netlify token was revoked, and CRF has since moved to
Vercel. Do not re-enable it without checking `docs/crf/DEPLOYMENT.md`.

**Deploy targets, and the cross-cutting traps to know about:**
- `render.yaml` is one Render blueprint provisioning `landing/` (service
  `audit-landing`), `offload/` (`offload-waitlist`), and `mediafetch/`
  (`mediafetch`) as separate services.
- `landing/` *also* deploys to Vercel independently, via `api/index.py` +
  root `vercel.json` — two live deploy targets for one app.
- The root `netlify.toml` builds and publishes **`trading-dashboard/`**. Any
  other static project connected to a Netlify site that builds from this repo
  (rather than deployed by its own upload/GitHub Action) would be silently
  overridden by that config — this has already shaped how `crf-builder/`
  deploys (see its own docs).
- The Digital Renaissance site (digital-renaissance.tech) no longer lives here:
  it is its own repository, `eoinmcgee1993/DigitalRenaissanceNew`, which the
  Netlify project `digitalrenaissancearchitect` builds from.
- A single `supabase/` project's migrations serve multiple unrelated apps
  (`crf-builder/`'s racewear/ECU tables, `mediafetch/`'s subscriptions) in
  one shared Postgres schema — check existing migration numbering and table
  names before adding a new one, to avoid collisions.

Everything else in the repo (`digikim/`, `gates-unbound/`, `launchwhere/`,
`local-downloader/`, `sales/`, `plugins/`, `trading/`, `gridstrike-core/`,
and more) is a standalone script, static page, or experiment with no shared
build or test process — read its own `README.md` before touching it. Roughly
half of the top-level directories have no README at all; when you add or
substantially change one, give it a README rather than relying on this file.

### Repo-wide conventions (outside CRF, which has its own rules below)

- **This repository is public.** Anything committed is world-readable. Never
  commit secrets, personal data, or documents marked confidential. Internal
  material belongs in a private repository.
- **Secrets come from environment variables, never files or arguments.**
  `.env` and `.env.local` are git-ignored; `.env.example` files hold
  placeholders only (`sk_live_...`). `scripts/create_stripe_account.py` is the
  reference pattern: config files hold non-secret details, the key is read from
  `STRIPE_SECRET_KEY`. (CRF is the exception: it keeps secrets in
  `public.crf_config`, see section 7.)
- **Personal data and recordings stay out of git.** `landing/leads.csv`,
  `offload/signups.csv`, `downloads/` and `voice_clone/takes/` are ignored on
  purpose — a voice recording is enough to clone the voice. Add new data
  artifacts to `.gitignore` in the same change that creates them.
- **Claims are verified against source, not asserted.** Recent history fixes
  copy that overstated what a system had done ("Stop claiming EdgeVault's
  source system has taken live payments") and made the Clearmark dialer
  disclose that it is an AI. Don't write "live", "24/7", "verified" or
  "discreet" into customer-facing copy unless the code or a document in the
  repo supports it; put unsupported claims in the project's gaps list instead.
- **Match each project's own stack and idiom.** Python projects are
  Flask (`landing/`, `offload/`) or FastAPI (`mediafetch/`) with `pytest`;
  `substack-os/` and `trading-dashboard/` are ESM, `kdp-compiler/` is not;
  static pages are single-file HTML/CSS/JS with no bundler. Don't add a
  framework or build tool to a static project, and don't add a root-level
  config that assumes one shared runtime.
- **Pin third-party GitHub Actions by commit SHA with a version comment**, as
  `landing.yml` and `netlify-deploy.yml` do (`degen-diaries-build.yml` uses
  floating `@v4` tags — don't copy that), and path-filter each workflow to its
  own directory.
- **Commits and PRs:** imperative, sentence-case subject with no
  conventional-commit prefix ("Add a Thai citizen ID generator for test data").
  Work lands through pull requests from `claude/<slug>` or `ccr-*` branches,
  merged with merge commits. Netlify deploy previews run on every PR, even for
  unrelated projects, and only some projects have real checks — a green preview
  is not a passing test suite.
- **Shared state:** the Supabase `supabase/` migrations, the root
  `requirements.txt` and root `netlify.toml`/`vercel.json` affect unrelated
  projects. Change them only when the task is about them, and say so.

### Claude Code setup in this repo

- `.claude/settings.json` runs `scripts/setup.sh` on session start (Python deps,
  `ffmpeg`, Higgsfield CLI) and, after any `Write`/`Edit` of a
  `substack-os/*.js` file, runs `npm test` there and blocks on failure.
  Editing other projects triggers no automatic check — run their tests yourself.
- `.claude/agents/` holds `architecture-validator` (checks changes against the
  rules in this file), `bug-investigator`, `code-reviewer` (read-only) and
  `doc-writer`.
- `.claude/skills/` holds `productize-code-asset` and five `higgsfield-*` skills
  vendored from `higgsfield-ai/skills` (v0.12.0). Don't hand-edit the vendored
  ones; update them from upstream.
- MCP servers declared in `settings.json`: `notebooklm`, `muapi`, `open-video`,
  `open-video-upload`.

### Phiraya (`phiraya/`)

Cross-cultural agent and secretary service bridging Thailand and Western
markets. Tagline **"Every Client Connection, Handled."** Read `phiraya/README.md`
and `phiraya/REVIEW.md` first. Layout: `training/` (merged internal guide and
proposed additions), `site/` (plain-HTML one-pager plus the brand intro video),
`social/` (content kit).

- **Spelling is "Phiraya".** The brand video's captions read "Firaya"; that is
  an unresolved discrepancy, not a variant. Don't copy it.
- **No invented facts.** Contact details are deliberately empty (`CONTACT` in
  `site/index.html`); pricing, coverage hours and privacy practice don't exist
  in any source document. Leave them blank or marked `[Added]` / "owner to fill
  in" rather than guessing.
- **Don't publish the open claims.** "24/7", "discreet" for clinics and the
  cross-border cold-calling scripts are listed as blockers in `REVIEW.md`
  section A. Resolve those before the site goes live.
- **The merged guide is the source of truth**, not the PDF/DOCX digest, which
  has dropped several scripts. Mark anything that reconciles two sources
  `[Reconciled]` and anything new `[Added]`; proposals live in
  `training/PROPOSED_ADDITIONS.md` until approved.
- **No Thai-language copy exists.** Don't machine-write Thai scripts for live
  calls without review by a native speaker.
- **Plain HTML/CSS/JS only, one file per page, no bundler.** Palette from the
  brand video: background `#F1EEE7`, terracotta accent, near-black serif
  headings; tone is warm, capable, discreet, responsive, internationally minded.
- **Not deployed anywhere, and the training material is currently public.**
  `training/` and `REVIEW.md` were merged into this public repo (PR #125); the
  decision to move them to a private repo is still open with the owner. Don't
  add more internal or confidential Phiraya material here until it is settled.
  The root `netlify.toml` publishes `trading-dashboard/`, so deploy
  `phiraya/site/` by upload or from its own site.

## 6. Project overview

**Note:** sections 6–10 below describe **CRF** specifically — see section 5
for how this fits into the rest of the repo. These CRF rules apply only to
`crf-builder/`; do not apply them to, or change files in, any other project
while working on CRF.

**What this is:** a static storefront selling three things to owners of a Honda
CRF250L / CRF300L — a print-ready graphics-kit SVG, custom club racewear, and a
free ECU tune template. No accounts, no server, no build step.

**Stack:** Vercel (hosting) · Supabase Postgres + Edge Functions (Deno) ·
Stripe Payment Links · Resend for email, when a sending domain exists.

**Live at:** https://crf-eoins-projects-99ff5888.vercel.app — `/`, `/apparel`,
`/ecu`, `/mods`, `/approve`, `/desk`. "CRF Garage" is a prototype name, not a
trading name. The old `crf-garage.netlify.app` now answers 404 everywhere; that
is expected, not an outage. Hosting facts come from `docs/crf/DEPLOYMENT.md`
(Phase 3) — if this section and that file disagree, that file wins.

**Current focus:** the trading name. It blocks the domain, the legal pages, the
email sending domain, and the Stripe merchant name a buyer sees at checkout.

**Read `docs/crf/` before changing anything here** — `SYSTEM.md` for how it
works, `DEPLOYMENT.md` for what is left, `BLUEPRINT.md` for the contracts.

## 7. Architecture rules

- **The browser can create, and can do nothing else.** It holds only the
  publishable key, and `anon` has `INSERT` and no other grant on any `crf_`
  table. If a task appears to need `SELECT` for `anon`, the task is wrong, not
  the rule — put the read in an Edge Function under the service-role key.
- **Database reads live in `supabase/functions/`.** Pages write directly to
  PostgREST and never read back.
- **Money and approval state are server-owned.** `payment_status` is written
  only by `stripe-webhook` after signature verification; `artwork_status` only
  by the customer through `apparel-approval`. `BEFORE INSERT` triggers
  overwrite both on every insert, so a crafted request cannot self-declare.
- **Every customer-facing read is keyed on `(id, token)`**, and a wrong token
  returns the same 404 as a wrong id — otherwise the endpoint becomes an
  order-id oracle.
- **Secrets live in one place: `public.crf_config`.** RLS on, zero policies,
  grants revoked — only a service-role client inside a function can read it.
  Never an environment variable, never a file, never the repository.
- **Anything emailed goes to an address read from the order row**, and links
  inside it are built from configured values. Never from the request.
- Schema changes are additive. Ship the code that stops using a column before
  the migration that removes it.

## 8. Coding standards

- **Plain HTML, CSS and JavaScript in one file per page.** No framework, no
  bundler, no build step — that is a deliberate constraint, not an oversight.
  Do not introduce one.
- Edge Functions are TypeScript on Deno, `verify_jwt = false` with their own
  authentication in the body. That is correct here: Stripe cannot present a
  Supabase JWT and customers are not signed in.
- Escape anything user-supplied before it reaches `innerHTML`. Both builders
  have an `escapeHTML` helper; use it.
- Money is integer minor units (satang, cents). Never floats.
- Comments explain why, not what — especially where the reason is a defect
  that was already paid for once. Several comments here exist because someone
  nearly shipped a lean fuel map or an open mail relay.

## 9. Validation (must pass before any task is complete)

**There is no lint, test, or build command in this project.** Saying so is the
honest answer, not a gap to paper over — there is nothing to compile. What
replaces them:

```bash
# 1. Every page still parses and renders, with no console errors.
#    Serve crf-builder/ and drive it; do not just eyeball the diff.

# 2. Every live route answers.
for p in "" apparel ecu mods approve desk; do
  curl -s -o /dev/null -w "$p %{http_code}\n" "https://crf-eoins-projects-99ff5888.vercel.app/$p"
done   # privacy and terms must stay 404 until their four facts exist

# 3. anon holds INSERT and nothing else.
#    select table_name, privilege_type from information_schema.role_table_grants
#     where table_schema='public' and grantee='anon' and table_name like 'crf%';
```

Three database invariants must return zero rows: no order `paid` without a
Stripe session id; no artwork `approved` without a review timestamp; no paid
order missing its file. They are written out in `docs/crf/DEPLOYMENT.md`.

**Changing an Edge Function means driving it over HTTPS** — the happy path and
the refusals. Reading the diff is not verification.

## 10. Task handling

Work toward one milestone at a time.

1. Restate the milestone and its success condition in one line before starting.
2. Implement the smallest complete version that meets that condition.
3. Run the validation list in section 9.
4. Stop, summarize what changed, and wait for review before the next milestone.

Governing rule: ship before build. A working, shipped, smaller version beats an
unshipped larger one.

**Deploying:** per `docs/crf/DEPLOYMENT.md`, the live site deploys
automatically on push to `main` of a *separate* repository,
`eoinmcgee1993/crf-builder` — merging here does not publish it. The root
`netlify.toml` publishes `trading-dashboard/`, so never link a Netlify site
that builds from this repo for CRF. The legal drafts (`privacy.html`,
`terms.html`, `legal-details.js`) live in `docs/crf/legal-drafts/`, outside any
publish root; moving them into a served `public/` directory is the deliberate
act that publishes them, and must not happen until their four facts exist.
Never copy them back into `crf-builder/`.
