#!/usr/bin/env bash
# Higgsfield marketplace cards for the EdgeVault and Growth Fabric Gumroad listings.
#
# Not run yet. When the brand package was built the Higgsfield account held
# 0.25 credits and this container had no CLI login. 7 cards per product at
# 1.5 credits each (nano_banana_2) is ~21 credits for both.
#
# Usage:
#   productized/brand/higgsfield-cards.sh --preview      # free: backend-enhanced prompts only, no images
#   productized/brand/higgsfield-cards.sh                # generate both (spends credits)
#   productized/brand/higgsfield-cards.sh growth-fabric  # one product
#
# Each run's output is logged to <product>/higgsfield/, with the result URLs
# collected in urls.txt. Download the keepers next to the log — generation
# URLs are not permanent.
set -euo pipefail
cd "$(dirname "$0")"

MODE=()
PRODUCTS=()
for arg in "$@"; do
  case "$arg" in
    --preview) MODE=(--enhance-only) ;;
    edgevault|growth-fabric) PRODUCTS+=("$arg") ;;
    *) echo "unknown argument: $arg" >&2; exit 2 ;;
  esac
done
[ ${#PRODUCTS[@]} -eq 0 ] && PRODUCTS=(edgevault growth-fabric)

command -v higgsfield >/dev/null || { echo "Install the CLI: npm install -g @higgsfield/cli@^1.1" >&2; exit 1; }
higgsfield account status >/dev/null 2>&1 || {
  echo "Higgsfield CLI isn't signed in: run 'higgsfield auth login' (then 'higgsfield workspace set <id>' if asked)." >&2
  exit 1
}

# These are digital products. Skip the physical-goods modules (multi_angle,
# detail_shot, aplus_ingredients, aplus_efficacy) and aplus_endorsement: there
# are no customer testimonials yet, and a generated one would be a fake review.
ASSETS=(main_image infographic whats_in_box aplus_hero_banner aplus_pain_points aplus_features aplus_how_to_use)
asset_flags=()
for a in "${ASSETS[@]}"; do asset_flags+=(--asset "$a"); done

run() { # slug prompt category product_context brand_context visual_style
  local slug=$1; shift
  mkdir -p "$slug/higgsfield"
  local log="$slug/higgsfield/run-$(date +%Y%m%d-%H%M%S).log"
  higgsfield marketplace-cards create ${MODE[@]+"${MODE[@]}"} "${asset_flags[@]}" \
    --image "$slug/keyart.png" --prompt "$1" --category "$2" \
    --product_context "$3" --brand_context "$4" --visual_style "$5" | tee "$log"
  grep -Eo 'https://[^[:space:]"]+' "$log" | sort -u > "$slug/higgsfield/urls.txt" || true
}

NO_FAKES="no people, no physical packaging props, no star ratings, reviews or testimonials"

for p in "${PRODUCTS[@]}"; do
  case "$p" in
    edgevault) run edgevault \
      "EdgeVault: downloadable developer kit, Gumroad listing images" \
      "digital download / developer tools" \
      "Stripe + Supabase fulfillment kit: 6 Supabase Edge Functions, SQL schema, 2 reference HTML pages, setup guide. Sells a digital file with no backend server to run. \$49 one-time digital download; nothing physical ships." \
      "EdgeVault. Colors: ink #0A0F1C, panel #111A2E, mint #3CF2B1, text #E8EEF9. Fonts: Space Grotesk, Inter, JetBrains Mono. Mark: vault door with a keyhole. Voice: calm, precise, security-literate." \
      "dark UI, code-editor aesthetic, clean flat graphics; $NO_FAKES" ;;
    growth-fabric) run growth-fabric \
      "Growth Fabric: n8n automation workflow pack, Gumroad listing images" \
      "digital download / automation templates" \
      "Three importable n8n workflows (newsletter engine, affiliate social, B2B outreach), 76 nodes, shared Postgres schema. In two of the three, a second AI agent must approve the output before it sends. \$39 one-time digital download; nothing physical ships." \
      "Growth Fabric. Colors: aubergine #120B1F, panel #1C1330, coral #FF7A59, violet #A58BFF, text #F4EEFF. Fonts: Space Grotesk, Inter, JetBrains Mono. Mark: two woven threads. Voice: practical, operator-level." \
      "dark UI, node-graph workflow aesthetic, clean flat graphics; $NO_FAKES" ;;
  esac
done
