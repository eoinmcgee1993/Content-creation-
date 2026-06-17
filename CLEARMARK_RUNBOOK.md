# Clearmark Outreach Runbook

The scan does the personalisation, not the name fields. Every email opens with
the prospect's real AEO finding, so it reads as written for them even though the
list is role inboxes.

---

## 1. What the pipeline produces

`clearmark_outreach.py` reads any CSV with these columns:

```
email, first_name, last_name, company, city, vertical
```

and writes an Instantly ready CSV with these custom variables per row:

```
{{finding}}      two sentence opener naming the company and city
{{competitor}}   one competitor that appears in AI answers
{{score}}        0 to 100 AEO visibility score
{{company}}, {{city}}, {{vertical}}
```

The greeting is set to a neutral "Hi there" on purpose. These are reception and
info inboxes, so the body leads with the finding, never with a name.

---

## 2. Run it

```
pip install anthropic pandas requests
export ANTHROPIC_API_KEY=sk-ant-...
```

Prove the plumbing first, no API spend:

```
python3 clearmark_outreach.py --in clearmark_batch_00.csv --out batch_00_ready.csv --dry-run
```

Then the real scan (verify emails first, recommended):

```
export MILLIONVERIFIER_API_KEY=...
python3 clearmark_outreach.py --in clearmark_batch_00.csv --out batch_00_ready.csv --verify
```

It is resumable. If it stops, rerun the exact same command and it skips rows
already in the output file. Cost is roughly 2 to 5 cents per prospect, so about
5 to 12 dollars per 250 batch on Sonnet. Switch MODEL to `claude-haiku-4-5-20251001`
in the script to roughly halve that.

Run any of your other CSVs the same way, one output file each.

---

## 3. Instantly setup

1. Upload `batch_00_ready.csv` to a campaign.
2. Map the columns to custom variables (Instantly turns each header into one).
3. Paste the four touches below into the sequence.
4. Sending: low and slow until domains are warm. 5 per inbox per day on day 8,
   ramp by 4 daily, full volume around day 18.

Bounce guard: keep bounce rate under 3 percent. This is why you verify first.

---

## 4. The four touch sequence

Spacing: day 1, day 4, day 8, day 12. Four touches, no more.

### Touch 1 (day 1): the finding

Subject: {{company}} and AI search

Hi there,

{{finding}}

We run a tool called Clearmark that measures exactly how a practice shows up
when people ask ChatGPT, Perplexity, and Gemini for a provider in their area.
Your current visibility score is {{score}} out of 100.

Worth me sending the full breakdown for {{company}}?

Eoin

---

### Touch 2 (day 4): the full report offer

Subject: the {{company}} breakdown

Hi there,

Following up with the detail. The full Clearmark report for {{company}} shows
which buyer questions you are missing, which competitors answer them instead,
and the specific gaps on your site that keep you out of AI answers.

It takes me a few minutes to send. Want it?

Eoin

---

### Touch 3 (day 8): the cost angle

Subject: where those enquiries go

Hi there,

When {{company}} does not appear and {{competitor}} does, the patient or client
asking that question never sees you. They book the practice the AI named.

That is happening quietly every day, and it does not show up in any report you
currently look at. Clearmark is the report that shows it. Happy to walk you
through yours.

Eoin

---

### Touch 4 (day 12): the close out

Subject: closing the loop

Hi there,

I will leave it here so I am not cluttering your inbox. If AI visibility for
{{company}} is worth a look at any point, the breakdown is ready whenever you
reply to this thread.

Either way, all the best with the practice.

Eoin

---

## 5. When replies come in

Use `clearmark_replies.py` to triage and draft responses:

```
# Triage a reply
python3 clearmark_replies.py triage --text "how much does this cost?" \
    --company "Bright Smile Dental" --city Dublin --vertical Dentist

# Generate the full report on demand
python3 clearmark_replies.py report --company "Bright Smile Dental" \
    --city Dublin --vertical Dentist --domain brightsmiledental.ie
```

Add `--dry-run` to either command for no API spend.

You only appear at this stage. First reply gets the full report and a short
call offer. On the call: lead with the diagnostic tier, then the managed
monthly. Four retained managed clients clears the 2,000 per month target.
