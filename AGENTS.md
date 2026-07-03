# AGENTS.md

Behavioral guidelines for AI coding agents (OpenAI Codex and compatible tools).

## Project Overview

Multi-project content-creation monorepo. Contains games, landing pages, outreach pipelines, and game scaffolds. Serves indie game dev and sales automation use cases.

Stack: Python (FastAPI/Flask), Next.js, plain HTML/CSS/JS. Hosted on Render/Netlify. No shared database across projects — each project owns its own data layer.

## Repository Structure

```
/landing          — Python FastAPI lead-capture landing page
/gridstrike-core  — Next.js scaffold for the GRIDSTRIKE game
/gates-unbound    — Terminal-style HTML landing funnel
/games            — Standalone HTML games
/prompts          — AI prompt templates
/sales            — Outreach and sales scripts
/audits           — Audit outputs
/docs             — Project documentation
/supabase         — Supabase config/migrations
```

## Coding Standards

- Python: follow PEP 8. Keep functions small and single-purpose. No type hints required but preferred on public interfaces.
- JavaScript/TypeScript: match the style of the file being edited. Prefer `const`/`let`, no `var`.
- HTML: semantic tags where possible. Inline styles only for one-off overrides.
- Comments explain WHY, not what. Avoid restating what the code already says.
- No speculative features — implement only what was asked.

## Working Rules

1. Read existing code before writing new code. Match the style of the file.
2. Touch only what the task requires. Do not refactor adjacent code.
3. Remove any imports or variables that your changes make unused.
4. Do not add error handling for scenarios that cannot happen.
5. Do not add configuration flags, feature toggles, or abstractions for single-use code.

## Validation

No global test/lint commands exist across the monorepo. Per-project checks:

- `/landing`: `cd landing && python -m pytest tests/ -q` (if tests exist)
- `/gridstrike-core/apps/web`: `npm run build` confirms the Next.js scaffold compiles

State explicitly if a validation command does not exist rather than skipping it.

## Secrets

- Environment variables and API keys never go in committed files.
- Use `.env` files locally (already in `.gitignore`).
- Server-side secrets stay server-side — never in client JS or HTML.
