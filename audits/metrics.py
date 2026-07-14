"""Parsing helpers: tolerant number coercion and fuzzy header mapping."""

from __future__ import annotations

import csv
import re

_NUM_RE = re.compile(r"[-+]?\d*\.?\d+")


def to_number(value: object) -> float:
    """Coerce '1,234', '$1.2k', '3.4%', '' into a float (0.0 on failure)."""
    if value is None:
        return 0.0
    if isinstance(value, (int, float)):
        return float(value)
    s = str(value).strip().lower().replace(",", "").replace("$", "").replace("%", "")
    if not s:
        return 0.0
    mult = 1.0
    if s.endswith("k"):
        mult, s = 1_000.0, s[:-1]
    elif s.endswith("m"):
        mult, s = 1_000_000.0, s[:-1]
    m = _NUM_RE.search(s)
    return float(m.group()) * mult if m else 0.0


def safe_div(numerator: float, denominator: float) -> float:
    return numerator / denominator if denominator else 0.0


def _normalize(header: str) -> str:
    return re.sub(r"[^a-z0-9]", "", header.strip().lower())


def map_headers(fieldnames: list[str], aliases: dict[str, list[str]]) -> dict[str, str]:
    """Map a logical field name to the actual CSV column via alias matching."""
    norm = {_normalize(h): h for h in fieldnames}
    resolved: dict[str, str] = {}
    for logical, options in aliases.items():
        for opt in options:
            key = _normalize(opt)
            if key in norm:
                resolved[logical] = norm[key]
                break
            hit = next((orig for n, orig in norm.items() if key and key in n), None)
            if hit:
                resolved[logical] = hit
                break
    return resolved


def read_csv(path: str) -> tuple[list[str], list[dict[str, str]]]:
    with open(path, newline="", encoding="utf-8-sig") as fh:
        reader = csv.DictReader(fh)
        rows = [r for r in reader]
        return (reader.fieldnames or []), rows
