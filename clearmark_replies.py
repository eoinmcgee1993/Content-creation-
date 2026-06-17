#!/usr/bin/env python3
"""
Clearmark reply handling.

Two jobs, both keyed to the actual bottleneck: turning replies into calls.

1. triage  - classify an incoming reply into one of four human buckets (plus an
             automated bucket that needs no reply), flag urgency, and draft a
             response in Eoin's voice. Honours removal requests immediately.

2. report  - generate the full one page AEO breakdown for a prospect on demand,
             so when someone says "send it" the report is ready in seconds.

Run:
    pip install anthropic
    export ANTHROPIC_API_KEY=sk-ant-...

    # triage a reply
    python3 clearmark_replies.py triage --text "how much does this cost?" \
        --company "Harley Street Dental" --city London --vertical Dental

    # or from a file
    python3 clearmark_replies.py triage --file reply.txt --company "..." --city "..." --vertical "..."

    # generate the full report
    python3 clearmark_replies.py report --company "Harley Street Dental" \
        --city London --vertical Dental --domain harleystreetdental.co.uk

Add --dry-run to either to see the shape with no API spend.
"""

import argparse
import json
import os
import sys
import time
from datetime import datetime

MODEL = "claude-sonnet-4-6"
WEB_SEARCH_TOOL = {"type": "web_search_20260209", "name": "web_search", "max_uses": 3}

VOICE_RULES = """Writing rules, follow exactly:
- Plain professional English. No hype, no exclamation marks.
- Standard punctuation only: commas, colons, parentheses, semicolons.
- Do not use em dashes or en dashes. Do not use hyphens to connect ideas.
- Never use the word "lad".
- Warm, direct, no filler. Sign off as Eoin."""

TRIAGE_SYSTEM = f"""You triage replies to a cold outreach campaign for Clearmark, a tool that
measures whether a local practice appears when people ask AI assistants for a
provider in their city (Answer Engine Optimization).

Classify the reply into exactly one category:
- "interested": wants the report, a call, pricing to buy, or says yes.
- "question": has a question or objection but is engaging (cost, who are you,
  is this automated, how does it work).
- "soft_no": not now, maybe later, we are fine, polite brush off.
- "hard_no": remove me, stop, unsubscribe, do not contact, or hostile.
- "automated": out of office, bounce, autoresponder, wrong person. No human intent.

Rules:
- If category is "hard_no", the only action is immediate removal from all lists.
  Draft a one line courteous acknowledgement of removal, nothing more.
- If category is "automated", no reply is needed and it must not be counted as a
  real reply.
- For "interested" and "question", draft a reply that moves toward sending the
  full report and booking a short call. Keep it to four sentences or fewer.

{VOICE_RULES}

Respond with ONLY a JSON object, no markdown:
{{"category": "...", "urgency": "now|today|low|none", "summary": "one line", "suggested_action": "...", "draft_reply": "..."}}"""

REPORT_SYSTEM = f"""You generate a one page AEO (Answer Engine Optimization) breakdown for a local
practice, used as the deliverable Clearmark sends when a prospect asks for the
report. Use web search to check how the practice and its competitors actually
surface for buyer queries in its city.

Structure the report in markdown with these sections, in order:
1. A header line with the practice name, city, and an AEO visibility score out of 100.
2. "What we checked": the buyer queries an AI would be asked for this vertical and city.
3. "Where you stand": whether the practice surfaces, and which competitors do.
4. "The four gaps": exactly four specific gaps, chosen from schema markup, FAQ and
   question content, local and review signals, and site structure. One short
   paragraph each.
5. "What closing them does": the outcome in plain terms.
6. "Next step": invite a short call to walk through it.

{VOICE_RULES}
Keep the whole report under 400 words. Output only the markdown report."""


def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}", file=sys.stderr, flush=True)


def extract_json(text):
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError(f"no JSON in response: {text[:200]}")
    return json.loads(text[start : end + 1])


def get_client():
    try:
        from anthropic import Anthropic
    except ImportError:
        sys.exit("ERROR: pip install anthropic")
    if not os.environ.get("ANTHROPIC_API_KEY"):
        sys.exit("ERROR: set ANTHROPIC_API_KEY (or use --dry-run)")
    return Anthropic()


def call(client, system, user, tools=None, retries=3):
    for attempt in range(retries):
        try:
            kwargs = dict(model=MODEL, max_tokens=1500, system=system,
                          messages=[{"role": "user", "content": user}])
            if tools:
                kwargs["tools"] = tools
            resp = client.messages.create(**kwargs)
            return "".join(b.text for b in resp.content if getattr(b, "type", "") == "text")
        except Exception as e:
            wait = 2 ** attempt
            log(f"attempt {attempt+1} failed: {e}, retry in {wait}s")
            time.sleep(wait)
    sys.exit("ERROR: API call failed after retries")


def mock_triage(text):
    t = text.lower()
    if any(w in t for w in ("remove", "stop", "unsubscribe", "do not contact")):
        cat, urg = "hard_no", "now"
        action = "Remove from ALL lists immediately. Legal and deliverability requirement."
        draft = "Understood, I have removed you from the list. Apologies for the intrusion. Eoin"
    elif any(w in t for w in ("out of office", "on leave", "auto", "bounce")):
        cat, urg, action, draft = "automated", "none", "No reply. Do not count as a real reply.", ""
    elif any(w in t for w in ("send", "yes", "interested", "call", "report")):
        cat, urg = "interested", "now"
        action = "Send the full report now, offer two call slots."
        draft = ("Glad to hear it. I will send the full breakdown for your practice "
                 "today. Would a short call this week suit, Tuesday or Thursday "
                 "morning your time? Eoin")
    elif "?" in t or any(w in t for w in ("how much", "cost", "price", "who are you")):
        cat, urg = "question", "today"
        action = "Answer plainly, then offer the report and a call."
        draft = ("Fair question. Clearmark measures how your practice shows up in AI "
                 "search, and the breakdown is free; the paid work is fixing the gaps "
                 "it finds. Want me to send your report so you can see it first? Eoin")
    else:
        cat, urg = "soft_no", "low"
        action = "Log it, leave the door open, no chasing."
        draft = ("No problem at all. The breakdown is there whenever AI visibility "
                 "moves up your list. All the best with the practice. Eoin")
    return {"category": cat, "urgency": urg, "summary": f"mock classification of: {text[:60]}",
            "suggested_action": action, "draft_reply": draft}


def mock_report(company, city, vertical):
    return f"""# {company}, {city}: AEO Visibility 31 / 100

## What we checked
Buyer queries an AI gets asked for {vertical.lower()} in {city}, such as
"best {vertical.lower()} near me" and "recommended {vertical.lower()} in {city}".

## Where you stand
{company} does not surface in those answers. Two larger competitors do, so the
enquiry is captured before the patient ever sees your name.

## The four gaps
**Schema markup:** your site has no structured data telling AI what you do and where.

**FAQ and question content:** the questions buyers ask are not answered on the site,
so there is nothing for an AI to quote.

**Local and review signals:** thin or inconsistent listings weaken the trust an
AI uses to choose who to name.

**Site structure:** key service and location pages are not laid out for machine reading.

## What closing them does
Each gap closed raises the chance an AI names {company} when someone in {city}
asks. That is enquiries you currently never see.

## Next step
A short call to walk through this, fifteen minutes. Tuesday or Thursday morning?

Eoin
"""


def do_triage(args):
    text = args.text or (open(args.file).read() if args.file else "")
    if not text.strip():
        sys.exit("ERROR: provide --text or --file")
    if args.dry_run:
        result = mock_triage(text)
    else:
        ctx = f"Practice: {args.company}, City: {args.city}, Vertical: {args.vertical}\n\nReply:\n{text}"
        result = extract_json(call(get_client(), TRIAGE_SYSTEM, ctx))
    print(json.dumps(result, indent=2))
    if result["category"] == "hard_no":
        log("ACTION REQUIRED: remove this contact from every list now.")


def do_report(args):
    if args.dry_run:
        print(mock_report(args.company, args.city, args.vertical))
        return
    user = (f"Practice: {args.company}\nCity: {args.city}\nVertical: {args.vertical}\n"
            f"Domain: {args.domain}\n\nGenerate the report.")
    print(call(get_client(), REPORT_SYSTEM, user, tools=[WEB_SEARCH_TOOL]))


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)

    t = sub.add_parser("triage")
    t.add_argument("--text")
    t.add_argument("--file")
    t.add_argument("--company", default="")
    t.add_argument("--city", default="")
    t.add_argument("--vertical", default="")
    t.add_argument("--dry-run", action="store_true")
    t.set_defaults(func=do_triage)

    r = sub.add_parser("report")
    r.add_argument("--company", required=True)
    r.add_argument("--city", required=True)
    r.add_argument("--vertical", required=True)
    r.add_argument("--domain", default="")
    r.add_argument("--dry-run", action="store_true")
    r.set_defaults(func=do_report)

    args = ap.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
