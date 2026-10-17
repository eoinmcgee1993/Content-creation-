# Skills

Project-level Claude Code skills, auto-discovered from this directory.

## productize-code-asset

Audit a repo for sellable code, package it (README, setup, Gumroad listing,
pricing), render the Gumroad and Instagram brand pack, and write the launch
blueprint — with every claim verified against source. Built from the session
that produced `productized/`, which is its reference implementation.
`evals/evals.json` holds three test prompts that haven't been run yet.

## retro

User-invoked (`/retro`) retrospective on a coding session: suggests changes to
the agent's environment (navigation pointers, automated checks, steering
files) ranked by severity. Vendored unmodified from
[`mattpocock/skills`](https://github.com/mattpocock/skills); update with
`npx skills update retro`. Its first step calls a `writing-for-agents` skill
from the same repo, which isn't installed here, so that step is skipped.

## Higgsfield (`higgsfield-*`)

Five skills for Higgsfield AI generation, vendored from
[`higgsfield-ai/skills`](https://github.com/higgsfield-ai/skills).

- **higgsfield-generate** — image/video/3D/audio generation (30+ models), Marketing Studio, Virality Predictor
- **higgsfield-soul-id** — train a face-faithful Soul Character (returns a Soul ID that `higgsfield-generate` consumes)
- **higgsfield-product-photoshoot** — brand-quality product imagery with mode-specific prompt enhancement
- **higgsfield-marketplace-cards** — marketplace main/secondary/A+ product cards with backend prompt enhancement
- **higgsfield-websites** — build, edit, and deploy full-stack websites (React 19 + TanStack Start on Cloudflare)

Vendored version: **0.12.0** (source commit `4f3537e`).

### Prerequisites

The skills wrap the Higgsfield CLI. In an interactive session:

```bash
curl -fsSL https://raw.githubusercontent.com/higgsfield-ai/cli/main/install.sh | sh
higgsfield auth login
```

`higgsfield-websites` also uses `git` and `bun` locally.

### Updating

Re-vendor the five `higgsfield-*` directories from the source repo and bump the
version noted above:

```bash
git clone --depth 1 https://github.com/higgsfield-ai/skills.git /tmp/hf-skills
cp -R /tmp/hf-skills/higgsfield-* .claude/skills/
```
