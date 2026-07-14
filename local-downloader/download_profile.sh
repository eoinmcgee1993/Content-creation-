#!/usr/bin/env bash
# Download an Instagram profile locally, using YOUR OWN login.
#
# Run this on your own computer — not a server. Instagram flags datacenter IPs
# and bulk activity, so running it from a cloud host risks your account.
#
# Usage:
#   ./download_profile.sh <your_ig_username> <target_profile> [--all]
#
#   <your_ig_username>  the account you log in as (yours)
#   <target_profile>    the profile to download (without @)
#   --all               download every post (default: videos/reels only)
#
# First run prompts for your password (and 2FA code if enabled) and caches a
# session, so later runs don't ask again. --fast-update stops at the first
# already-downloaded post, so re-running only fetches what's new.
set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <your_ig_username> <target_profile> [--all]" >&2
  exit 1
fi

LOGIN="$1"
TARGET="$2"
MODE="${3:-}"

# Videos/reels only by default; pass --all to include image posts too.
FILTER=(--post-filter="is_video")
if [ "$MODE" = "--all" ]; then
  FILTER=()
fi

instaloader \
  --login="$LOGIN" \
  --dirname-pattern="downloads/{target}" \
  --fast-update \
  --no-metadata-json \
  --no-captions \
  "${FILTER[@]}" \
  profile "$TARGET"

echo "Done. Files are in downloads/$TARGET/"
