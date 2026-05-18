"""Build the lead-magnet sample audit report from the bundled sample data.

Reuses the in-repo `audits` toolkit so the freebie is a real, sanitized
example of the paid deliverable.
"""

from __future__ import annotations

import os
import sys

_REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

from audits.ads_audit import run_ads_audit  # noqa: E402
from audits.metrics import read_csv  # noqa: E402
from audits.report import render_markdown, render_pdf  # noqa: E402
from audits.seo_audit import run_seo_audit  # noqa: E402

_SAMPLES = os.path.join(_REPO_ROOT, "audits", "sample_data")
SAMPLE_CLIENT = "Sample Brand (anonymized)"


def build_freebie(static_dir: str) -> dict[str, str]:
    """Generate the sample report into *static_dir*.

    Returns a map of available formats to their filenames.
    """
    os.makedirs(static_dir, exist_ok=True)

    ads_fields, ads_rows = read_csv(os.path.join(_SAMPLES, "sample_ads.csv"))
    seo_fields, seo_rows = read_csv(os.path.join(_SAMPLES, "sample_gsc.csv"))
    results = [
        run_ads_audit(ads_fields, ads_rows),
        run_seo_audit(seo_fields, seo_rows, brand="acme"),
    ]

    md = render_markdown(results, client=SAMPLE_CLIENT)
    md_name = "sample-audit-report.md"
    with open(os.path.join(static_dir, md_name), "w", encoding="utf-8") as fh:
        fh.write(md)

    formats = {"md": md_name}
    pdf_name = "sample-audit-report.pdf"
    if render_pdf(md, os.path.join(static_dir, pdf_name)):
        formats["pdf"] = pdf_name
    return formats
