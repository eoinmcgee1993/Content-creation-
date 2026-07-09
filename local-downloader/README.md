# Local Instagram profile downloader

Downloads a whole Instagram profile's videos/reels to your computer, using
**your own login**. Whole-profile downloads require an authenticated Instagram
session — anonymous access is blocked — so this runs locally under your account.

> ⚠️ **Run this on your own machine, not a server.** Instagram flags datacenter
> IPs and bulk/scraping activity and can rate-limit or ban accounts that do it.
> Keep volumes modest, and only download content you have the right to use.

## Setup (once)

```bash
pip install instaloader
```

## Usage

```bash
cd local-downloader

# Videos / reels only (default):
./download_profile.sh  YOUR_IG_USERNAME  sneaker_showcase1

# Everything, including image posts:
./download_profile.sh  YOUR_IG_USERNAME  sneaker_showcase1  --all
```

- The **first run** asks for your password (and a 2FA code if you have it on),
  then caches a session file — later runs won't ask again.
- `--fast-update` means re-running only downloads posts you don't already have.
- Files land in `local-downloader/downloads/<profile>/`.

## Batch download specific reels/posts (no login)

To grab a handful of specific videos instead of a whole profile, use
`batch_download.sh`. Individual public posts don't require a login.

```bash
pip install yt-dlp   # once

# URLs as arguments:
./batch_download.sh \
  https://www.instagram.com/reel/AAAA/ \
  https://www.instagram.com/reel/BBBB/

# ...or one URL per line in a file:
./batch_download.sh urls.txt
```

Files land in `local-downloader/downloads/batch/`. Already-downloaded videos
are skipped, so you can re-run a growing list safely.

## Notes

- Your password is entered locally and is **not** stored — instaloader saves a
  session cookie, not your password.
- If you hit "Please wait a few minutes" errors, you're being rate-limited —
  slow down and try again later.
- This is separate from the MediaFetch web app (`../mediafetch`), which handles
  single reels/posts without login.

## Equivalent one-liner (without the script)

```bash
instaloader --login=YOUR_IG_USERNAME --fast-update \
  --no-metadata-json --no-captions --post-filter="is_video" \
  profile sneaker_showcase1
```
