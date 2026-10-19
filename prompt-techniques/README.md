# Prompt techniques (from one video)

Content, an interactive explainer, reusable prompts and a fact-check, all built
from a summary of the YouTube video "Unlock AI Mastery with ASDSTE-100: The
Aerospace Trick That Transforms" (Felix Reed | AI News & Chips, 1:33,
https://www.youtube.com/watch?v=g_pnwXpvzI8).

The video's four techniques: write with ASD-STE100, ask for diagrams, ask for
interactive HTML pages, ask for explainer videos with TTS narration.

Standalone folder, no build step, no tests. Plain HTML/CSS/JS, one file per page.

| Path | What it is |
|---|---|
| `content/post.md` | Short social post (LinkedIn / X thread version). |
| `content/carousel.md` | 7-slide carousel copy, slide by slide. |
| `content/video-script.md` | ~60 s explainer script with scene notes. |
| `content/newsletter.md` | Longer newsletter piece. |
| `site/index.html` | Interactive explainer: STE before/after, diagram, SIP calculator, video storyboard. |
| `prompts/four-techniques.md` | Copy-paste prompt templates for each technique, plus a combined one. |
| `FACTCHECK.md` | What is verified, what is not, and where the sources are. |

## Run locally
```bash
python3 -m http.server 8000 --directory prompt-techniques/site
# open http://localhost:8000/
```

## Source limits
All video claims come from a pasted summary with timestamps, not from the video
itself. The video's own wording, examples and any results it showed are unseen.
See `FACTCHECK.md` before publishing anything under a name.

## Before going public
- Replace the `[Your name]` placeholders in `content/`.
- Check the sentence-length limits in `FACTCHECK.md` against the official
  ASD-STE100 text. They are marked unverified.
- Credit the video's author if you post any of this.

## Deploying
Not deployed. The root `netlify.toml` publishes `trading-dashboard/`, so don't
connect a Netlify site that builds from this repo. Deploy `site/` by upload.
