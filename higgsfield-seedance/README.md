# higgsfield-seedance

Minimal example: one Seedance 2.5 text-to-video generation via the official
Higgsfield Python SDK (`higgsfield-client`), using `subscribe`.

## Setup

```bash
pip install -r higgsfield-seedance/requirements.txt
cp higgsfield-seedance/.env.example higgsfield-seedance/.env.local
# edit .env.local locally: HF_KEY=key-id:key-secret
```

`.env.local` is git-ignored. `HF_KEY` can also come from the process environment.

## Run

```bash
python higgsfield-seedance/main.py
```

**Each run is a billable generation.** Progress goes to stderr; on success the
only stdout line is the video URL. A `failed`, `nsfw` (moderated) or `canceled`
result, an API error, or missing credentials exits 1 and prints no URL.
