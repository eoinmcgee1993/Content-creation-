# B2B Audit Toolkit

Self-contained, dependency-light generator for client-ready **paid-ads
leakage** and **SEO / Google Search Console** health audits. No external
plugins or third-party repos required.

## Usage

```bash
# Ads + SEO in one report (Markdown always, PDF if reportlab is installed)
python -m audits \
  --ads path/to/ads_export.csv \
  --seo path/to/gsc_queries.csv \
  --brand acme \
  --client "Prospect Inc" \
  --out reports/prospect

# Optional: prior-period GSC export to detect ranking drops
python -m audits --seo current.csv --seo-compare last_quarter.csv --out reports/x
```

Run against the bundled samples to see a full report:

```bash
python -m audits --ads audits/sample_data/sample_ads.csv \
  --seo audits/sample_data/sample_gsc.csv --brand acme --client "Demo"
```

## Input formats

Headers are matched fuzzily, so standard Google Ads / Meta Ads and GSC
exports work without renaming columns.

- **Ads CSV:** campaign, impressions, clicks, cost/spend, conversions,
  conversion value (cost column is required).
- **GSC CSV:** query, clicks, impressions, ctr, position (query +
  impressions required).

## PDF output

PDF is optional. `pip install -r audits/requirements.txt` enables it;
without `reportlab`, the tool still writes the full Markdown report and
notes that PDF was skipped.

## What it checks

**Ads:** zero-conversion spend, sub-break-even ROAS, CPA outliers vs.
account median, below-benchmark CTR, budget over-concentration, missing
conversion tracking — with a directional monthly-leakage model.

**SEO:** striking-distance queries (pos 11–20), top-10 queries with
below-curve CTR, high-impression zero-click queries, keyword
cannibalization clusters, brand-dependent visibility, and ranking drops
when a comparison export is supplied.

Every report includes a methodology/limitations section — leakage figures
are directional models from the supplied data, not guaranteed savings.
