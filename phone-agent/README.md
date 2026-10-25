# Phiraya (phone-agent)

Marketing pages for Phiraya, an AI phone agent that answers clinic calls in Thai
and English, books appointments, and follows up on LINE.

This folder is a standalone project with no build step and no tests: plain
HTML/CSS/JS, one file per page.

| Path | What it is |
|---|---|
| `landing.html` | One-page site: hero with call demo, how it works, features, LINE follow-up, contact. |
| `phiraya-video-preview.html` | Preview page: phone mockup playing the call demo, a "Hear Phiraya" greeting (browser Thai TTS), LINE chat mockup. |
| `assets/portraits/phiraya-portrait.jpg` | Phiraya's portrait, cropped from her reference headshot. Caller avatar on both pages. |
| `assets/video/phiraya-call-demo-v2.mp4` | 10 s, 768×768 H.264, silent call demo. Autoplays muted on `landing.html`; if it can't play, they fall back to a transcript / animated call screen. |
| `assets/portraits/phiraya-vertical-first-frame.jpg` | 720×1280 crop of her half-length reference image; the start frame for the vertical demo. |
| `assets/video/phiraya-call-demo-vertical.mp4` | 10 s, 768×1344 H.264, silent. Made with MiniMax H3 Max (via ElevenLabs) from the first frame above. Fills the phone screen on `phiraya-video-preview.html`. |

## Run locally
```bash
python3 -m http.server 8000 --directory phone-agent
# open http://localhost:8000/landing.html
```

## Before going public
- Set `CONTACT_URL` in both `landing.html` and `phiraya-video-preview.html` (same value). The demo buttons stay hidden while it is empty.
- ~~Have a native speaker check the Thai copy.~~ Done: the owner reports the native-speaker review in `THAI_REVIEW.md` came back with no changes.
- The "Hear Phiraya" button uses the visitor's browser voice, not the production voice. Replace it with a recorded clip once one exists.

## Deploying
Live at **https://phiraya-k26cvg.v2.appdeploy.ai** (AppDeploy app
`phiraya-k26cvg`, free plan, which adds AppDeploy's small share/badge overlay).
On AppDeploy the pages live in `public/` and the images and videos in
`public/resources/`, so the deployed copies use `resources/...` paths instead
of `assets/...`; the root `index.html` redirects to `landing.html`. It does not
update when `main` changes: redeploy through AppDeploy.

A second copy was uploaded to Netlify (`phiraya.netlify.app`, Netlify Drop), but
that Netlify team is currently restricted, so every site on it answers 404/429
until the account is sorted out.

The root `netlify.toml` publishes `trading-dashboard/`, so don't connect a
Netlify site that builds from this repo for these pages. `vercel.json` here is
only for a Vercel project with Root Directory `phone-agent`, if one is set up
later.
