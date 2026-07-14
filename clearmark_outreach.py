#!/usr/bin/env python3
"""Generate personalised cold-outreach emails for UK/IE practices from the Clearmark template."""

from __future__ import annotations

import argparse
import csv
import sys
import textwrap
from pathlib import Path

_REPO_ROOT = Path(__file__).parent
_TEMPLATE_PATH = _REPO_ROOT / "sales" / "cold-outreach.md"


# ---------------------------------------------------------------------------
# Email builders — paid-ads angle and SEO/organic angle
# ---------------------------------------------------------------------------

def _subject_ads(practice: str, platform: str) -> str:
    # Avoid "Google Ads ads" — use "account" when platform already ends in "Ads"
    label = "account" if platform.lower().endswith("ads") else "ads"
    return f"{practice} — quick thing I noticed in your {platform} {label}"


def _subject_seo(practice: str) -> str:
    return f"{practice}'s striking-distance keywords (quick win)"


def _possessive(name: str) -> str:
    return f"{name}'" if name.endswith("s") else f"{name}'s"


def _email_ads(first: str, practice: str, platform: str, observation: str) -> str:
    return textwrap.dedent(f"""\
        Hi {first},

        Was looking at {_possessive(practice)} ads — {observation}. \
That pattern usually means a chunk of spend is converting at a loss.

        I run a free 250-point Account Health Check that scores exactly where spend \
is leaking (zero-conversion campaigns, sub-break-even ROAS, CPA outliers) \
with a modelled monthly recovery number.

        Sample of the exact report you'd get: [LANDING_PAGE_URL]

        Worth a 15-min look at yours?

        [Your name]""")


def _email_seo(first: str, practice: str, observation: str) -> str:  # noqa: ARG001
    return textwrap.dedent(f"""\
        Hi {first},

        {observation}. \
I usually see a few of these per site, plus keyword cannibalisation quietly splitting authority.

        I'll run a free Search Console health check that maps striking-distance keywords, \
cannibalisation, and CTR gaps. Here's the exact report format: [LANDING_PAGE_URL]

        Want me to run yours?

        [Your name]""")


def _linkedin(first: str, practice: str, channel: str, observation: str) -> str:
    # Truncate observation to first clause for brevity
    short_obs = observation.split("—")[0].split(".")[0].strip().lower()
    return (
        f"Hi {first} — noticed {short_obs} on {_possessive(practice)} {channel}. "
        f"I run a free 250-point Health Check that scores where revenue's leaking. "
        f"Sample: [LANDING_PAGE_URL]. Want me to run yours?"
    )


def _follow_up_day3(first: str, practice: str) -> str:
    return (
        f"Re: {practice} ads — still happy to send the breakdown. Want it?"
    )


def _follow_up_day7(first: str) -> str:
    return (
        f"Hi {first}, forwarding the sanitised sample PDF directly — "
        f"here's what the output looks like. Took 15 min. Yours would be specific to your account."
    )


# ---------------------------------------------------------------------------
# Row processing
# ---------------------------------------------------------------------------

def _build_outreach(row: dict) -> dict:
    name = row["practice_name"].strip()
    first = row["first_name"].strip()
    platform = (row.get("ad_platform") or "").strip()
    obs = row["observation"].strip()

    if platform and platform.lower() != "none":
        subject = _subject_ads(name, platform)
        email = _email_ads(first, name, platform, obs)
        channel = "ads"
    else:
        subject = _subject_seo(name)
        email = _email_seo(first, name, obs)
        channel = "SEO"

    return {
        "subject_line": subject,
        "email_body": email,
        "linkedin_dm": _linkedin(first, name, channel, obs),
        "follow_up_day3": _follow_up_day3(first, name),
        "follow_up_day7": _follow_up_day7(first),
        "outreach_status": "ready",
    }


# ---------------------------------------------------------------------------
# Pipeline
# ---------------------------------------------------------------------------

def run(in_path: Path, out_path: Path, limit: int | None) -> None:
    with in_path.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    if limit is not None:
        rows = rows[:limit]

    if not rows:
        print("No rows to process.", file=sys.stderr)
        sys.exit(1)

    out_rows: list[dict] = []
    for row in rows:
        outreach = _build_outreach(row)
        out_row = {**row, **outreach}
        out_rows.append(out_row)
        channel = row.get("ad_platform") or "SEO"
        print(f"  ✓ {row['practice_name']} ({row.get('location', '?')}) — {channel} angle")

    fieldnames = list(out_rows[0].keys())
    with out_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(out_rows)

    print(f"\nGenerated {len(out_rows)} outreach emails → {out_path}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Clearmark cold-outreach generator")
    parser.add_argument("--in", dest="input", required=True, metavar="FILE",
                        help="Input practices CSV")
    parser.add_argument("--out", required=True, metavar="FILE",
                        help="Output CSV path")
    parser.add_argument("--limit", type=int, default=None, metavar="N",
                        help="Process only the first N rows")
    args = parser.parse_args()

    in_path = Path(args.input)
    if not in_path.exists():
        print(f"Error: '{in_path}' not found.", file=sys.stderr)
        sys.exit(1)

    run(in_path, Path(args.out), args.limit)


if __name__ == "__main__":
    main()
