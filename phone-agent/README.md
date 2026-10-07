# Phitara (phone-agent)

Marketing pages for Phitara, an AI phone agent that answers clinic calls in Thai
and English, books appointments, and follows up on LINE.

This folder is a standalone project with no build step and no tests: plain
HTML/CSS/JS, one file per page.

| Path | What it is |
|---|---|
| `landing.html` | One-page site: hero with call demo, how it works, features, LINE follow-up, contact. |
| `phitara-video-preview.html` | Preview page: phone mockup playing the call demo, a "Hear Phitara" greeting (browser Thai TTS), LINE chat mockup. |
| `assets/video/phitara-call-demo-v2.mp4` | **Not committed yet.** Both pages play it when present and fall back to a transcript / animated call screen when it is missing. |

## Run locally
```bash
python3 -m http.server 8000 --directory phone-agent
# open http://localhost:8000/landing.html
```

## Before going public
- Add `assets/video/phitara-call-demo-v2.mp4` (the original was generated outside this repo and never committed).
- Set `CONTACT_URL` in `landing.html`. The demo button stays hidden while it is empty.
- Have a native speaker check the Thai copy, including the Thai spelling of the name.
- The "Hear Phitara" button uses the visitor's browser voice, not the production voice. Replace it with a recorded clip once one exists.

## Deploying
Not deployed. The root `netlify.toml` publishes `trading-dashboard/`, so don't
connect a Netlify site that builds from this repo. Deploy `phone-agent/` by upload.
