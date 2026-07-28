#!/usr/bin/env python3
"""Place AgentPhone voice calls to UK/IE practices — the spoken counterpart to clearmark_outreach.py.

Reads the same lead CSVs (practices_uk_ie.csv / batch_00_live.csv), builds a per-practice
call agent from the `observation` field, and places outbound calls via the AgentPhone SDK.

Safe by default: runs a dry-run that prints what it *would* dial. Pass --live to actually call.

    export AGENTPHONE_API_KEY=ap_...
    python clearmark_voice.py --in practices_uk_ie.csv           # dry-run preview
    python clearmark_voice.py --in practices_uk_ie.csv --live     # actually dial
"""

from __future__ import annotations

import argparse
import csv
import os
import sys
from pathlib import Path

# Column names we accept for the phone number (leads CSVs may use either).
_PHONE_FIELDS = ("phone", "phone_number", "mobile", "tel")


# ---------------------------------------------------------------------------
# Call-script builders — mirror the ads/SEO angle split in clearmark_outreach.py
# ---------------------------------------------------------------------------

def _possessive(name: str) -> str:
    return f"{name}'" if name.endswith("s") else f"{name}'s"


def _system_prompt(first: str, practice: str, platform: str, observation: str) -> str:
    if platform and platform.lower() != "none":
        angle = (
            f"You noticed in {_possessive(practice)} {platform} account that {observation}. "
            f"That pattern usually means a chunk of ad spend is converting at a loss."
        )
        offer = "a free 250-point Account Health Check that scores exactly where spend is leaking"
    else:
        angle = f"You noticed on {_possessive(practice)} site that {observation}."
        offer = "a free Search Console health check that maps striking-distance keywords and CTR gaps"

    return (
        f"You are a friendly, concise outreach caller for Clearmark. You are calling {first} "
        f"at {practice}. {angle} Offer {offer}. Keep it under 60 seconds, be respectful of their "
        f"time, and if they're interested, ask for the best email to send the sample report. "
        f"If they're busy or not interested, thank them and end the call politely."
    )


def _greeting(first: str) -> str:
    return f"Hi, is this {first}? I'll keep this really quick."


# ---------------------------------------------------------------------------
# Pipeline
# ---------------------------------------------------------------------------

def _phone_for(row: dict) -> str | None:
    for field in _PHONE_FIELDS:
        val = (row.get(field) or "").strip()
        if val:
            return val
    return None


def run(in_path: Path, limit: int | None, live: bool) -> None:
    with in_path.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    if limit is not None:
        rows = rows[:limit]

    if not rows:
        print("No rows to process.", file=sys.stderr)
        sys.exit(1)

    client = None
    number = None
    if live:
        api_key = os.environ.get("AGENTPHONE_API_KEY")
        if not api_key:
            print("Error: AGENTPHONE_API_KEY is not set (required for --live).", file=sys.stderr)
            sys.exit(1)
        try:
            from agentphone import AgentPhone
        except ImportError:
            print("Error: agentphone is not installed. Run: pip install agentphone", file=sys.stderr)
            sys.exit(1)
        client = AgentPhone(api_key=api_key)

    placed = skipped = 0
    for row in rows:
        practice = row["practice_name"].strip()
        first = row["first_name"].strip()
        platform = (row.get("ad_platform") or "").strip()
        observation = row["observation"].strip()
        to_number = _phone_for(row)

        if not to_number:
            print(f"  ⨯ {practice} — no phone number, skipped", file=sys.stderr)
            skipped += 1
            continue

        prompt = _system_prompt(first, practice, platform, observation)

        if not live:
            channel = platform if platform and platform.lower() != "none" else "SEO"
            print(f"  ▶ would call {practice} ({first}) at {to_number} — {channel} angle")
            placed += 1
            continue

        agent = client.agents.create(
            name=f"Clearmark — {practice}",
            voice_mode="hosted",
            system_prompt=prompt,
            greeting=_greeting(first),
        )
        # Buy a single shared number on the first live call and reuse it.
        if number is None:
            number = client.numbers.buy(agent_id=agent.id)
        call = client.calls.create(agent_id=agent.id, to_number=to_number)
        print(f"  ✓ calling {practice} ({first}) at {to_number} — call {call.id}")
        placed += 1

    verb = "placed" if live else "previewed"
    print(f"\n{verb.capitalize()} {placed} call(s), skipped {skipped} (no number).")
    if not live:
        print("Dry-run only. Re-run with --live to actually dial.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Clearmark AgentPhone voice-outreach dialer")
    parser.add_argument("--in", dest="input", required=True, metavar="FILE",
                        help="Input practices CSV (needs a phone/phone_number column)")
    parser.add_argument("--limit", type=int, default=None, metavar="N",
                        help="Process only the first N rows")
    parser.add_argument("--live", action="store_true",
                        help="Actually place calls (default is a safe dry-run preview)")
    args = parser.parse_args()

    in_path = Path(args.input)
    if not in_path.exists():
        print(f"Error: '{in_path}' not found.", file=sys.stderr)
        sys.exit(1)

    run(in_path, args.limit, args.live)


if __name__ == "__main__":
    main()
