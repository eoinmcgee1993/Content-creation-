#!/usr/bin/env bash
# Session setup: install Python deps and ensure ffmpeg is present so
# yt-dlp auto-selects and merges the best-quality video+audio streams.
set -e
cd "$(dirname "$0")/.."

pip install -q -r requirements.txt

# ffmpeg is a system binary (not pip-installable). Install it only when
# missing; apt update failures on unrelated third-party repos are non-fatal.
if ! command -v ffmpeg >/dev/null 2>&1; then
  apt-get update -qq || true
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq ffmpeg || true
fi

# Higgsfield CLI — image, video, and Marketing Studio workflows from the terminal.
if ! command -v higgsfield >/dev/null 2>&1; then
  npm install -g @higgsfield/cli --quiet || true
fi
