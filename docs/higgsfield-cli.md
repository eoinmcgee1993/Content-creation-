# Higgsfield CLI

`higgsfield` (aliases: `higgs`, `hf`) is installed automatically each session via `scripts/setup.sh`.

---

## Setup

```bash
higgsfield auth login      # opens browser OAuth — do this once
higgsfield auth token      # print current token
higgsfield auth logout     # remove stored credentials
```

Check your credit balance:

```bash
higgsfield account
```

---

## Core workflow: generate anything

### 1. Find a model

```bash
higgsfield model list              # all models
higgsfield model list --image      # image models only
higgsfield model list --video      # video models only
higgsfield model get <job_type>    # inspect params for a model
```

### 2. Upload local media (if needed)

```bash
higgsfield upload create ./photo.png        # returns an upload_id
higgsfield upload list --image              # see previous uploads
higgsfield upload list --video --size 50
```

### 3. Generate

```bash
# Image from prompt
higgsfield generate create nano_banana_2 \
  --prompt "studio product photo on white background"

# Image with a reference photo (local path auto-uploads)
higgsfield generate create seedance_2_0 \
  --prompt "cinematic product shot" \
  --image-references ./product.png

# Video with a reference video
higgsfield generate create <video_model> \
  --prompt "slow push-in" \
  --video-references ./clip.mp4 \
  --wait --wait-timeout 20m --wait-interval 5s

# Estimate cost before generating
higgsfield generate cost nano_banana_2 --prompt "studio product photo"
```

`--wait` blocks until the job finishes and prints the result URL(s).

### 4. Check job status

```bash
higgsfield generate list            # recent jobs
higgsfield generate get <job_id>    # one job
higgsfield generate wait <job_id>   # poll until done
```

---

## Workflows (multi-step transforms)

Workflows run edits on existing assets (reframe, draw-to-video, etc.).

```bash
higgsfield workflow list                   # see all workflows
higgsfield workflow get reframe            # inspect params

higgsfield generate workflow reframe \
  --video ./source.mp4 \
  --aspect-ratio 9:16
```

---

## Product Photoshoot

High-quality brand images from a product photo + intent:

```bash
higgsfield product-photoshoot create \
  --mode lifestyle_scene \
  --prompt "bottle for IG" \
  --image ./bottle.jpg \
  --count 3
```

---

## Soul ID (custom character refs)

Train a consistent character from 5+ photos, then use the soul ID in generations:

```bash
# Train (Soul 2 — general use)
higgsfield soul-id create \
  --name "Alice" \
  --soul-2 \
  --image ./alice1.png \
  --image ./alice2.jpg \
  --image ./alice3.png \
  --image ./alice4.jpg \
  --image ./alice5.png

higgsfield soul-id wait <soul_id>   # blocks until training finishes
higgsfield soul-id list             # list all trained refs
higgsfield soul-id get <soul_id>    # inspect one ref
```

---

## Marketing Studio

Manage avatars, products, hooks, and brand kits for workflow automation:

```bash
higgsfield marketing-studio avatars list
higgsfield marketing-studio products create --title "Sneaker" --image <upload_id>
higgsfield marketing-studio webproducts fetch --url https://example.com --wait
higgsfield marketing-studio hooks list
higgsfield marketing-studio brand-kits
higgsfield marketing-studio dtc-ads       # DTC Ads Engine
```

---

## Websites

Build and deploy full-stack websites with a git-backed repo:

```bash
higgsfield website create               # create site + git repo
higgsfield website list                 # your sites
higgsfield website deploy <website_id>  # build and ship
higgsfield website status <website_id>  # live URLs + deploy state
higgsfield website repo-access <id>     # git clone URL + token
higgsfield website secrets <id>         # manage env vars
higgsfield website db <id>              # read-only DB access
higgsfield website rename <id>          # change subdomain
higgsfield website publish <id>         # post to community feed
```

---

## Games

```bash
higgsfield game --help
higgsfield game deploy <game_id>
higgsfield game publish <game_id>
```

---

## Global flags

| Flag | Effect |
|------|--------|
| `--json` | Raw JSON output (good for scripting) |
| `--no-color` | Disable colour output |
| `--wait` | Block until job completes (on `generate create`) |
| `--wait-timeout` | Max wait time, e.g. `20m` |
| `--wait-interval` | Poll interval, e.g. `5s` |

---

## Quick reference

```bash
hf model list --video                      # what video models exist?
hf generate cost <model> --prompt "..."    # how much will this cost?
hf upload create ./file.png                # upload and get an ID
hf generate create <model> --prompt "..." --image ./file.png --wait
hf generate list                           # see recent jobs
```
