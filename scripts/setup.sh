#!/usr/bin/env bash
# Session setup: install Python deps and ensure ffmpeg is present so
# yt-dlp auto-selects and merges the best-quality video+audio streams.
set -e
cd "$(dirname "$0")/.."

pip install -q -r requirements.txt

# pytest plus each Python project's own deps, so the PostToolUse hook in
# .claude/settings.json can run a project's tests after it is edited.
if ! pip install -q pytest -r landing/requirements.txt -r offload/requirements.txt \
    -r audits/requirements.txt -r voice_clone/requirements.txt; then
  echo "WARNING: test deps install failed — the Python test hook will skip until pytest is importable." >&2
fi

# ffmpeg is a system binary (not pip-installable). Install it only when
# missing; apt update failures on unrelated third-party repos are non-fatal.
if ! command -v ffmpeg >/dev/null 2>&1; then
  apt-get update -qq || true
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq ffmpeg || true
fi

# Higgsfield CLI — image, video, and Marketing Studio workflows from the terminal.
if ! command -v higgsfield >/dev/null 2>&1; then
  if ! npm install -g "@higgsfield/cli@^1.1" --quiet; then
    echo "WARNING: Higgsfield CLI install failed — 'higgsfield' will not be available this session." >&2
  fi
fi
