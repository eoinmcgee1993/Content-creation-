#!/usr/bin/env bash
# Download a list of specific Instagram reel/post URLs.
#
# These are individual public posts, so NO login is needed (yt-dlp fetches
# them directly). Use this to grab specific videos without the whole profile.
#
# Usage:
#   ./batch_download.sh urls.txt            # a file with one URL per line
#   ./batch_download.sh URL1 URL2 URL3      # URLs as arguments
#
# Setup (once):   pip install yt-dlp
set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <urls.txt | URL [URL ...]>" >&2
  exit 1
fi

OUT="downloads/batch"
mkdir -p "$OUT"

# Single existing file -> treat as a URL list; otherwise treat args as URLs.
if [ "$#" -eq 1 ] && [ -f "$1" ]; then
  yt-dlp -a "$1" -o "$OUT/%(id)s.%(ext)s" -f "best[ext=mp4]/best" --no-warnings
else
  yt-dlp "$@" -o "$OUT/%(id)s.%(ext)s" -f "best[ext=mp4]/best" --no-warnings
fi

echo "Done. Files in $OUT/"
