#!/usr/bin/env python3
"""
Clearmark outreach pipeline.

Takes a CSV of practices (email, first_name, last_name, company, city, vertical),
runs an AEO visibility scan on each one, has Claude write a personalised opener
keyed on company and city (never on first name, because the name fields are
placeholders), and writes an Instantly ready CSV with custom variables.

Designed to run unattended overnight on any batch with the same schema.
Resumable: if it crashes or you stop it, rerun the same command and it skips
rows already done.

Run:
    pip install anthropic pandas requests
    export ANTHROPIC_API_KEY=sk-ant-...
    python3 clearmark_outreach.py --in clearmark_batch_00.csv --out batch_00_ready.csv

Dry run first (no API spend, proves the plumbing):
    python3 clearmark_outreach.py --in clearmark_batch_00.csv --out batch_00_ready.csv --dry-run

Optional email verification before scanning (recommended, protects domains):
    export MILLIONVERIFIER_API_KEY=...
    add --verify to the command
"""

import argparse
import csv
import json
import os
import sys
import time
from datetime import datetime, timezone

import pandas as pd

REQUIRED_COLUMNS = ["email", "first_name", "last_name", "company", "city", "vertical"]

# Switch to claude-haiku-4-5-20251001 to cut cost roughly in half if quality holds.
MODEL = "claude-sonnet-4-6"
WEB_SEARCH_TOOL = {"type": "web_search_20260209", "name": "web_search", "max_uses": 3}

# Eoin's copy rules are baked into the scan prompt so generated findings comply.
SCAN_SYSTEM = """You are the scanning engine for Clearmark, a tool that measures whether a
local business appears when people ask AI assistants (ChatGPT, Perplexity, Gemini)
for a service in their city. This is Answer Engine Optimization (AEO).

For the practice given, judge whether it is likely to surface in AI answers for a
buyer query in its city and vertical, name real competitors that do tend to surface,
and write a short personalised opening line for a cold email.

Writing rules for the finding text, follow exactly:
- Plain professional English. No hype, no exclamation marks.
- Standard punctuation only: commas, colons, parentheses, semicolons.
- Do not use em dashes or en dashes. Do not use hyphens to connect ideas.
- Never use the word "lad".
- Anchor on the company name and city. Never use a personal first name.
- Two sentences maximum. State the gap, name one competitor that appears instead.

Respond with ONLY a JSON object, no markdown, no preamble, in this exact shape:
{"appears_in_ai": true|false, "score": 0-100, "competitor": "one competitor name or empty string", "finding": "two sentence opener"}"""

SCAN_USER_TEMPLATE = """Practice: {company}
City: {city}
Vertical: {vertical}
Website domain: {domain}

Search how this practice and its competitors surface for AI buyer queries such as
"best {vertical_lower} in {city}", then return the JSON."""


def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)


def load_and_prepare(path):
    df = pd.read_csv(path, dtype=str).fillna("")
    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        sys.exit(f"ERROR: input is missing required columns: {missing}")
    df["email"] = df["email"].str.strip().str.lower()
    df = df[df["email"] != ""]
    df["domain"] = df["email"].str.split("@").str[1]
    before = len(df)
    df = df.drop_duplicates(subset="email").drop_duplicates(subset="domain")
    if len(df) < before:
        log(f"dropped {before - len(df)} duplicate email/domain rows")
    return df.reset_index(drop=True)


def verify_emails(df):
    """Optional MillionVerifier pass. Keeps only deliverable + catch-all, drops dead."""
    key = os.environ.get("MILLIONVERIFIER_API_KEY")
    if not key:
        log("no MILLIONVERIFIER_API_KEY set, skipping verification")
        return df
    import requests
    keep = []
    for _, row in df.iterrows():
        try:
            r = requests.get(
                "https://api.millionverifier.com/api/v3/",
                params={"api": key, "email": row["email"], "timeout": 10},
                timeout=20,
            ).json()
            result = r.get("result", "unknown")
            if result in ("ok", "catch_all"):
                keep.append(True)
            else:
                keep.append(False)
        except Exception as e:
            log(f"verify error for {row['email']}: {e}, keeping it")
            keep.append(True)
        time.sleep(0.2)
    out = df[pd.Series(keep, index=df.index)].reset_index(drop=True)
    log(f"verification kept {len(out)} of {len(df)}")
    return out


def mock_scan(row):
    """Deterministic fake result for --dry-run. No API spend."""
    return {
        "appears_in_ai": False,
        "score": 28,
        "competitor": f"a larger {row['vertical'].lower()} group nearby",
        "finding": (
            f"When someone in {row['city']} asks ChatGPT for a "
            f"{row['vertical'].lower()} provider, {row['company']} does not come up. "
            f"A competitor does, which means those enquiries are going elsewhere."
        ),
    }


def extract_json(text):
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError(f"no JSON found in response: {text[:200]}")
    return json.loads(text[start : end + 1])


def real_scan(row, client, retries=3):
    user = SCAN_USER_TEMPLATE.format(
        company=row["company"],
        city=row["city"],
        vertical=row["vertical"],
        vertical_lower=row["vertical"].lower(),
        domain=row["domain"],
    )
    for attempt in range(retries):
        try:
            resp = client.messages.create(
                model=MODEL,
                max_tokens=1024,
                system=SCAN_SYSTEM,
                tools=[WEB_SEARCH_TOOL],
                messages=[{"role": "user", "content": user}],
            )
            text = "".join(
                block.text for block in resp.content if getattr(block, "type", "") == "text"
            )
            data = extract_json(text)
            # normalise
            return {
                "appears_in_ai": bool(data.get("appears_in_ai", False)),
                "score": int(data.get("score", 0)),
                "competitor": str(data.get("competitor", "")).strip(),
                "finding": str(data.get("finding", "")).strip(),
            }
        except Exception as e:
            wait = 2 ** attempt
            log(f"scan attempt {attempt + 1} failed for {row['company']}: {e}, retry in {wait}s")
            time.sleep(wait)
    return None


def load_done(out_path):
    if not os.path.exists(out_path):
        return set()
    try:
        done = pd.read_csv(out_path, dtype=str)
        return set(done["email"].str.lower())
    except Exception:
        return set()


OUTPUT_COLUMNS = [
    "email", "greeting", "company", "city", "vertical",
    "score", "finding", "competitor", "scanned_at",
]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="infile", required=True)
    ap.add_argument("--out", dest="outfile", required=True)
    ap.add_argument("--dry-run", action="store_true", help="mock scan, no API spend")
    ap.add_argument("--verify", action="store_true", help="MillionVerifier pass first")
    ap.add_argument("--delay", type=float, default=1.5, help="seconds between scans")
    ap.add_argument("--limit", type=int, default=0, help="cap rows this run (0 = all)")
    args = ap.parse_args()

    df = load_and_prepare(args.infile)
    log(f"loaded {len(df)} prospects")
    by_vert = df["vertical"].value_counts().to_dict()
    log(f"verticals: {by_vert}")

    if args.verify:
        df = verify_emails(df)

    client = None
    if not args.dry_run:
        try:
            from anthropic import Anthropic
        except ImportError:
            sys.exit("ERROR: pip install anthropic")
        if not os.environ.get("ANTHROPIC_API_KEY"):
            sys.exit("ERROR: set ANTHROPIC_API_KEY (or use --dry-run)")
        client = Anthropic()

    done = load_done(args.outfile)
    if done:
        log(f"resuming, {len(done)} rows already done will be skipped")

    new_file = not os.path.exists(args.outfile)
    processed = 0
    with open(args.outfile, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=OUTPUT_COLUMNS)
        if new_file:
            writer.writeheader()

        for _, row in df.iterrows():
            if args.limit and processed >= args.limit:
                break
            if row["email"] in done:
                continue

            result = mock_scan(row) if args.dry_run else real_scan(row, client)
            if result is None:
                log(f"giving up on {row['company']}, skipping")
                continue

            writer.writerow({
                "email": row["email"],
                "greeting": "Hi there",  # role inboxes: no name, body leads with finding
                "company": row["company"],
                "city": row["city"],
                "vertical": row["vertical"],
                "score": result["score"],
                "finding": result["finding"],
                "competitor": result["competitor"],
                "scanned_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            })
            f.flush()
            processed += 1
            if processed % 10 == 0:
                log(f"{processed} scanned")
            if not args.dry_run:
                time.sleep(args.delay)

    log(f"done. {processed} new rows written to {args.outfile}")
    log("next: import the output CSV into Instantly, map columns to custom variables")


if __name__ == "__main__":
    main()
