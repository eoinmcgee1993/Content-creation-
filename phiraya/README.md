# Phiraya

Professional agent and secretary support bridging Thailand and Western markets, for clinics, premium services and growing businesses. Tagline: **Every Client Connection, Handled.**

This folder is a standalone project, separate from the rest of the repo. It has no build step and no tests.

| Path | What it is |
|---|---|
| `training/PHIRAYA_TRAINING_GUIDE.md` | One merged internal guide (principles, sales approach, scripts). Internal only. |
| `site/index.html` | Public one-page website: plain HTML/CSS/JS. Copy and palette come from the source documents and brand video. |
| `site/assets/` | `phiraya-intro.mp4` (34 s brand intro) and `poster.jpg` (its last frame). |
| `training/PROPOSED_ADDITIONS.md` | Draft follow-up cadence, booking brief, escalation, contact log. Proposals only, needing owner approval. |
| `social/CONTENT_KIT.md` | The four posts, video caption, and carousel/clip ideas. |
| `REVIEW.md` | Contradictions and gaps found in the source documents, with the blockers to fix before going public. |

## Run the site locally
```bash
python3 -m http.server 8000 --directory phiraya/site
```

## Deploying
Not deployed. The root `netlify.toml` publishes `trading-dashboard/`, so do not connect a Netlify site that builds from this repo for Phiraya. Deploy `phiraya/site/` by upload or from its own site. Resolve `REVIEW.md` section A first. The site's contact buttons stay empty until `CONTACT` in `index.html` is filled in.
