import os

from audits.ads_audit import run_ads_audit
from audits.metrics import map_headers, read_csv, to_number
from audits.report import render_markdown
from audits.seo_audit import run_seo_audit

SAMPLES = os.path.join(os.path.dirname(__file__), "..", "sample_data")


def test_to_number_handles_messy_values():
    assert to_number("1,234") == 1234.0
    assert to_number("$2.5k") == 2500.0
    assert to_number("3.4%") == 3.4
    assert to_number("") == 0.0
    assert to_number(None) == 0.0
    assert to_number(42) == 42.0


def test_map_headers_fuzzy():
    cols = map_headers(
        ["Campaign Name", "Amount spent (USD)", "Impr."],
        {"campaign": ["campaign"], "cost": ["amount spent"], "impressions": ["impr"]},
    )
    assert cols["campaign"] == "Campaign Name"
    assert cols["cost"] == "Amount spent (USD)"
    assert cols["impressions"] == "Impr."


def test_ads_audit_flags_zero_conversion_waste():
    fields, rows = read_csv(os.path.join(SAMPLES, "sample_ads.csv"))
    result = run_ads_audit(fields, rows)
    assert result.kind == "ads"
    titles = " ".join(f.title for f in result.findings)
    assert "zero conversions" in titles
    # Display + Video spend (4100 + 3100) is wasted.
    leak = next(f for f in result.findings if "zero conversions" in f.title)
    assert leak.estimated_monthly_leakage == 7200
    assert 0 <= result.score <= 100


def test_ads_audit_requires_cost_column():
    try:
        run_ads_audit(["foo", "bar"], [{"foo": "1", "bar": "2"}])
        raise AssertionError("expected ValueError")
    except ValueError as e:
        assert "cost" in str(e).lower()


def test_seo_audit_finds_striking_distance_and_cannibalization():
    fields, rows = read_csv(os.path.join(SAMPLES, "sample_gsc.csv"))
    result = run_seo_audit(fields, rows, brand="acme")
    titles = " ".join(f.title for f in result.findings)
    assert "striking-distance" in titles
    assert result.summary["queries"] == 10


def test_seo_compare_detects_ranking_drops():
    fields, rows = read_csv(os.path.join(SAMPLES, "sample_gsc.csv"))
    prev = [{"Query": "best crm for startups", "Clicks": "900", "Impressions": "5600",
             "CTR": "16%", "Position": "5.0"},
            {"Query": "sales pipeline software", "Clicks": "300", "Impressions": "9200",
             "CTR": "3%", "Position": "3.0"}]
    result = run_seo_audit(
        fields, rows, compare=prev,
        compare_fields=["Query", "Clicks", "Impressions", "CTR", "Position"],
    )
    assert any("ranking drop" in f.title for f in result.findings)


def test_render_markdown_includes_disclaimer():
    fields, rows = read_csv(os.path.join(SAMPLES, "sample_ads.csv"))
    md = render_markdown([run_ads_audit(fields, rows)], client="Acme Co")
    assert "Acme Co" in md
    assert "Methodology & Limitations" in md
    assert "Executive Summary" in md
