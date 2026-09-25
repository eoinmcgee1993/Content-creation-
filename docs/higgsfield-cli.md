# Higgsfield CLI

`higgsfield` (alias: `higgs`) is installed automatically each session via `scripts/setup.sh`.

> The package ships only these two commands. It does **not** provide `hf` — that
> name belongs to the Hugging Face CLI, so avoid it here even as a shell alias.

---

## Setup

```bash
higgsfield auth login      # opens browser OAuth — do this once
higgsfield auth token      # print current token
higgsfield auth logout     # remove stored credentials
```

Check your credit balance:

```bash
higgsfield account status
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
higgsfield generate create nano_banana_2 \
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

Train a consistent character from 5–20 photos, then use the soul ID in generations:

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
higgsfield marketing-studio brand-kits list
higgsfield marketing-studio brand-kits fetch --url https://example.com --wait
higgsfield marketing-studio dtc-ads generate --prompt "hero shot" --format-id <format_id> --brand-kit-id <brand_kit_id>
```

---

## Websites

Build and deploy full-stack websites with a git-backed repo.

`--type` and `--category` are both required on create. `--type app` additionally
requires `--template` (`app-detail` | `preset` | `studio` | `custom`); for
`--type website` the template is optional (`scroll-scrub` for an animated site).
Run `higgsfield website categories` for the valid category slugs.

```bash
# standalone site (no Higgsfield integration)
higgsfield website create --type website --category cinematic --subdomain my-site

# Higgsfield-integrated app (Sign in + SDK) — --template is required
higgsfield website create --type app --category other --template studio --subdomain my-app

higgsfield website list                  # your sites
higgsfield website categories            # valid --category slugs
higgsfield website deploy <website_id>   # build and ship
higgsfield website status <website_id>   # live URLs + deploy state
higgsfield website repo-access <id>                        # git clone URL + token
higgsfield website secrets list <id>                       # list env vars
higgsfield website secrets set <id> --name KEY             # set an env var (prompts for value)
higgsfield website secrets set <id> --name KEY --value-stdin < secret.txt
higgsfield website secrets delete <id> --name KEY          # remove an env var
higgsfield website db tables <id>                          # list DB tables
higgsfield website db rows <id> --table users --limit 20    # read table rows
higgsfield website db schema <id> --table users             # show table columns
higgsfield website db query <id> --sql "SELECT count(*) FROM users"
higgsfield website rename <id> --subdomain new-slug  # change subdomain (old URL stops working)
higgsfield website publish <id>                     # post to community feed
```

Secrets are staged and applied on the next deploy; a deleted secret likewise
only disappears once you redeploy.

---

## Games

```bash
# Deploy a new game from a ZIP
higgsfield game deploy ./game.zip --title "Space Runner" --description "Arcade game"

# Update an existing game
higgsfield game deploy ./game.zip --title "Space Runner" --description "Arcade game" --game-id <game_id>

# Publish to the marketplace
higgsfield game publish <game_id> --name "Space Runner"
```

---

## Global flags

Only these two are genuinely global (plus `--help` / `--version`):

| Flag | Effect |
|------|--------|
| `--json` | Raw JSON output (good for scripting) |
| `--no-color` | Disable colour output |

### Waiting on jobs

`--wait` is per-command, not global, and the timeout flags are spelled
differently depending on the command:

| Command | Wait flags |
|---------|-----------|
| `generate create`, `generate workflow` | `--wait`, `--wait-timeout 20m`, `--wait-interval 5s` |
| `marketing-studio dtc-ads generate` | `--wait`, `--timeout 5m` (no interval flag) |

Commands not listed here — `product-photoshoot generate`, `soul-id create`,
`website deploy` — take no wait flags; poll their status command instead.

---

## Quick reference

```bash
higgs model list --video                      # what video models exist?
higgs generate cost <model> --prompt "..."    # how much will this cost?
higgs upload create ./file.png                # upload and get an ID
higgs generate create <model> --prompt "..." --image ./file.png --wait
higgs generate list                           # see recent jobs
```
