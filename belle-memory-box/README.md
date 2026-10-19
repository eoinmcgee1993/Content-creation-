# Belle's Memory Box (belle-memory-box)

A small mobile-first memorial app for Belle, the family dog. It opens in three
steps: swipe through three tribute cards, tap a wooden keepsake box to open its
lid, then browse a gallery of memories with category filters, a photo lightbox,
a tribute poem, a family journal, and a form for adding a new memory.

| Path | What it is |
|---|---|
| `BelleMemoryBox.jsx` | The whole app as one React component, with its CSS inline. It can be dropped into any React 18 project as is. |
| `index.html` | A no-build loader: React from esm.sh through an import map, with the JSX compiled in the browser by Babel standalone. |

## Run locally
```bash
python3 -m http.server 8000 --directory belle-memory-box
# open http://localhost:8000/
```
It has to be served, not opened as a file, because `index.html` fetches the
`.jsx`. It also needs a network connection for React, Babel, Google Fonts and the
photos.

## Before it is ready to share
- **The photos are not Belle.** Every image URL is an Unsplash stock photo used
  as a placeholder, and the captions ("Planting her ashes…", "The beautiful
  memorial urn…") describe photos that aren't there yet. Replace the `media`
  URLs in `BELLE_MEMORIES` with real photos of Belle.
- **Added memories are not saved.** The "+" form keeps new memories in React
  state only, so they disappear when the page reloads. It also doesn't accept
  photos.
- The gold "A" on the box lid and in the header is from the original design;
  its meaning isn't written down anywhere.
- This repository is public. Family photos committed here are public too, so
  host them somewhere private if they shouldn't be.

## Deployment
Not deployed. Like the other static pages in this repo, deploy it by upload.
Don't connect a Netlify site that builds from this repo, because the root
`netlify.toml` publishes `trading-dashboard/`.

## Verification so far
Driven in headless Chromium at 390×844 with touch enabled: swipe cards → box →
lid opens → app is visible. The category filter, the add-memory form, the
lightbox, and the Tribute and Journal tabs all work, with no console errors.
Not yet checked on a real phone.
