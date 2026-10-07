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
`phiraya/`, `phone-agent/`, and more) is a standalone script, static page, or
experiment with no shared build or test process — read its own `README.md`
before touching it.

The conventions every project shares (commits, secrets, personal data, CI,
new-project layout) are in **section 11**, after the CRF sections.

## 6. Project overview

**Note:** sections 6–10 below describe **CRF** specifically — see section 5
for how this fits into the rest of the repo. These CRF rules apply only to
`crf-builder/`; do not apply them to, or change files in, any other project
while working on CRF.

**What this is:** a static storefront selling three things to owners of a Honda
CRF250L / CRF300L — a print-ready graphics-kit SVG, custom club racewear, and a
free ECU tune template. No accounts, no server, no build step.

**Stack:** Netlify (static hosting, deployed by upload) · Supabase Postgres +
Edge Functions (Deno) · Stripe Payment Links · Resend for email, when a sending
domain exists.

**Live at:** https://crf-garage.netlify.app — `/`, `/apparel`, `/ecu`, `/mods`,
`/approve`, `/desk`. "CRF Garage" is a prototype name, not a trading name.

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
  curl -s -o /dev/null -w "$p %{http_code}\n" "https://crf-garage.netlify.app/$p"
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

**Deploying:** the site is published by uploading `crf-builder/`, and
`crf-garage` is deliberately **not** connected to this repository. The root
`netlify.toml` publishes `trading-dashboard/`, so linking the site would
make its next build serve a different project on this domain. Deploy an
explicit list of files, never the folder — `privacy.html`, `terms.html` and
`legal-details.js` sit in it and must not ship until their four facts exist.

## 11. Repo-wide conventions (every project)

These came out of the repo itself (CI, hooks, `.gitignore`, git history and
the existing projects). A project's own `README.md` overrides them where the
two disagree. The CRF rules in sections 6–10 stay scoped to `crf-builder/`.

**Starting a new project**
- Give it its own top-level directory and a `README.md` covering: what it is,
  a table of its paths, how to run it locally, and how it deploys or why it
  doesn't yet. `phiraya/` and `phone-agent/` are the template.
- Keep it standalone: no imports from sibling projects, and its own
  `requirements.txt` / `package.json` where it needs dependencies. Add to the
  root `requirements.txt` only for deps the session needs for everything.
- Static sites are plain HTML/CSS/JS, one file per page, no build step, and
  are deployed **by upload**. Never connect a Netlify site that builds from
  this repo (see section 5). Write "Not deployed" in the README until a site is.
- If a page depends on an asset that isn't committed yet (generated video,
  portrait), make it degrade visibly and gracefully (show a fallback, not a
  black box) and list the missing asset in the README.
- If a placeholder must be filled before launch (a contact URL, legal facts),
  hide the UI it drives until it's filled. Never ship a dead link.

**Python projects** (`landing/`, `offload/`, `audits/`, `voice_clone/`)
- Python 3.11 (pinned in CI and `render.yaml`).
- Flask apps use an app factory (`create_app()`), start modules with
  `from __future__ import annotations`, and read config from `os.environ.get`
  with a safe default. File paths are overridable by env var (`LEADS_PATH`,
  `SIGNUPS_PATH`, `FREEBIE_OUT`) so tests and serverless hosts can redirect them.
- Tests are pytest, run from the repo root scoped to the project
  (`pytest <project>/tests -q`), and isolate state with the `tmp_path` and
  `monkeypatch` fixtures rather than touching real files.

**JavaScript projects**
- Zero-dependency Node tools use the built-in runner: `node --test`
  (`kdp-compiler/`, `substack-os/`), with `"type": "module"` where ESM.
- Next.js projects (`degen-diaries/`, `gridstrike-core/apps/web`) ship
  `typecheck`/`lint` scripts. Run them before pushing. `degen-diaries` CI runs
  `typecheck` before `build`.
- A `PostToolUse` hook in `.claude/settings.json` runs `substack-os` tests
  after every edit to `substack-os/*.js` and blocks on failure. Fix the
  failure; don't route around the hook.

**CI** (`.github/workflows/`)
- One workflow per project, path-filtered to that project's directory plus
  the workflow file itself, so unrelated changes don't trigger it.
- Pin actions to a full commit SHA with the version as a comment
  (`actions/checkout@11bd…683 # v4.2.2`). Two workflows still use `@v4`
  tags; match the pinned style in anything new.

**Secrets and personal data**
- Secrets never enter the repo. Locally they go in `.env` / `.env.local`
  (both gitignored). On Render they're declared with `sync: false`. CRF
  is the exception: secrets live in `public.crf_config` (section 7).
- Personal data is gitignored at the source: captured leads
  (`landing/leads.csv`), signups (`offload/signups.csv`) and voice recordings
  (`voice_clone/takes/`). Any new project that captures people's data adds its
  output path to `.gitignore` in the same commit.
- Log lines carry no email addresses, user IDs or request bodies. The
  existing apps log only the provider's error detail.

**Database** (`supabase/migrations/`)
- Migrations are numbered with three zero-padded digits (`004_…`). Take the
  next free number, and prefix the file name and table names with the owning
  project (`crf_`, `mediafetch_`), because the schema is shared.

**Vendored code** (`.claude/skills/higgsfield-*`, `ai-marketing/`)
- Vendor upstream unmodified in its own commit, then make local changes in
  separate commits, so a re-vendor shows exactly what was ours. For the
  Higgsfield skills, re-vendor and bump the version in
  `.claude/skills/README.md` instead of editing them.

**Commits and PRs**
- Commit subjects are a plain imperative sentence that says what changed
  and, where it matters, why: "Fix the Clearmark dialer's live calls and have
  it say it's an AI". No `feat:`-style prefixes. A `project:` prefix is fine
  when it adds clarity.
- Work on a branch and open a PR. PRs are merged with merge commits.

**Claude tooling in this repo**
- `scripts/setup.sh` runs on every session start (Python deps, `ffmpeg`,
  Higgsfield CLI). Keep it idempotent and non-fatal for optional tools.
- Project subagents live in `.claude/agents/` (`code-reviewer`,
  `bug-investigator`, `architecture-validator`, `doc-writer`). Project skills
  live in `.claude/skills/` (see its README).
