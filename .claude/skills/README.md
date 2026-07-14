# Skills

Project-level Claude Code skills, auto-discovered from this directory.

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
