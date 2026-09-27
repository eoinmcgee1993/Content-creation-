# Data Sources: read before any SEO, traffic, or competitor figure

Upstream, this suite presented LLM judgement as measurement: SEO scores,
competitor lists, and revenue figures all came out as confident numbers with
nothing behind them. These rules make every number say where it came from.

## Order of preference

1. **Semrush MCP** (`mcp__Semrush__*`) when the account has API units.
2. **A Semrush export the user supplied** (PDF/CSV from the Semrush web app,
   e.g. a Site Audit "Issues" report). The web app keeps working when the API
   has no units, so ask for one if Semrush is unavailable and the user has it.
   Quote its figures as-is and cite the export's generation date.
3. **On-page analysis**: `python3 ~/.claude/skills/market/scripts/analyze_page.py <url>`.
   Its `scores.seo` and `seo_deductions` are the only computed SEO figures
   available without Semrush; quote the deductions, not just the number.

## Calling Semrush

The flow is: discovery tool → `get_report_schema(report)` → `execute_report(report, params)`.
Default `database` is `us` unless the business clearly targets another market.

| Need | Discovery tool |
|------|----------------|
| Authority, keyword and traffic totals | `domain_overview` |
| Keywords and pages the domain ranks for | `organic_research` |
| Visits, channels, engagement | `traffic_overview` |
| Organic/paid competitors | `competitors_research` |
| Technical crawl issues (needs a Semrush project) | `projects` then `site_audit` |

**Probe once per run.** Make one cheap call first (the `domain_overview` report
for the target). If it returns an error object (`code` is `no_api_units`,
`no_subscription`, `rate_limit`, `validation_failed`, `internal`, …):

- Do not call Semrush again in this run. `retryable: false` means a retry
  fails identically and still costs time.
- Put this line in the report header, verbatim apart from the code:
  `Data source: on-page analysis only (Semrush unavailable: <code>)`
- If the code is `no_api_units` or `no_subscription`, tell the user once, with
  the error's `url` field.
- Continue with source 2 or 3. An unavailable data source is not a failed audit.

In `/market audit`, the orchestrator runs the probe and passes the result to
every subagent. Subagents do not probe again.

## Labelling

Every figure in a report carries one of these labels, and a table cell never
mixes two of them:

- **Semrush estimate**: from the MCP or a supplied export. Semrush traffic is
  modelled too, so say "estimate", never "actual".
- **Computed**: from `analyze_page.py` or `competitor_scanner.py` output.
- **Judgement**: Claude's assessment against a rubric. Content, copy, brand and
  conversion scores are always judgement. That's fine, as long as it's labelled.
- **Assumed**: an input nobody measured, such as conversion lift or ARPU.

## Revenue impact

Never present one confident dollar figure. Show the inputs:

| Input | Value | Source |
|-------|-------|--------|
| Monthly visits | e.g. 12,400 | Semrush estimate (`traffic_overview`), or **Assumed** |
| Conversion-rate lift | low / mid / high, e.g. 0.2% / 0.5% / 1.0% | Assumed |
| Value per conversion | e.g. $99 | From the user, or Assumed |

Then give the low/mid/high range of `visits × lift × value`. If traffic is
assumed, say so in the executive summary, not just in the table.
