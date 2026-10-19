# AgentPhone voice outreach

The spoken counterpart to the cold-email pipeline. `clearmark_voice.py` reads the same
lead CSVs and places outbound calls through [AgentPhone](https://agentphone.dev), using
each lead's `observation` to brief a per-practice voice agent.

## Setup

1. Register the MCP server (already wired in `.mcp.json`):

   ```
   claude mcp add agentphone
   ```

2. Set your API key:

   ```
   export AGENTPHONE_API_KEY=ap_...
   ```

3. Install the SDK (also in `requirements.txt`):

   ```
   pip install agentphone
   ```

## Usage

The dialer needs a phone column in the input CSV — one of `phone`, `phone_number`,
`mobile`, or `tel`. Rows without a number are skipped. It defaults to a **dry-run**
that prints what it would dial; pass `--live` to actually place calls.

```
python clearmark_voice.py --in practices_uk_ie.csv            # preview only
python clearmark_voice.py --in practices_uk_ie.csv --live      # actually dial
python clearmark_voice.py --in practices_uk_ie.csv --limit 5   # cap the batch
```

Each call gets a system prompt built from the practice's ads/SEO angle (same split as
`clearmark_outreach.py`): a Google Ads observation drives the Account Health Check pitch,
everything else drives the Search Console pitch. One hosted agent and one number are set up
once per `--live` run and reused across calls, with each practice's prompt and greeting sent
along with its call. The greeting says the caller is an AI, as the EU AI Act (Article 50)
requires for calls to Irish practices.
