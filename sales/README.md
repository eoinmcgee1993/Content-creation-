# Sales Assets

Ready-to-use go-to-market collateral for the audit offer.

- **`cold-outreach.md`** — subject lines, two cold-email angles (ads /
  SEO), a follow-up sequence, a LinkedIn DM, a Loom script, and honesty
  guardrails. Replace every `[BRACKET]`.
- **`sales-sheet.md`** — one-page overview to attach or link.
- **`build_sales_sheet.py`** — renders the sheet to a sendable PDF using
  the in-repo `audits` renderer:

```bash
pip install reportlab
python sales/build_sales_sheet.py https://your-landing-url.com
# -> sales/sales-sheet.pdf
```

The generated `sales/sales-sheet.pdf` is git-ignored; rebuild it per
campaign with the right landing URL. Use only the sanitized sample audit
report as a "blind example" — never rebrand a real client's report.
