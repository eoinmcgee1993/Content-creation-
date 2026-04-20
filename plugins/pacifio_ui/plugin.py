"""Pacifio UI plugin for content creation — terminal and web interface components."""

from __future__ import annotations

from typing import Any, Optional


class PacifioUIPlugin:
    """Plugin providing UI rendering utilities for the content creation platform."""

    THEMES = ("default", "dark", "light", "minimal")

    def __init__(self, theme: str = "default", width: int = 80) -> None:
        if theme not in self.THEMES:
            raise ValueError(f"Unknown theme '{theme}'. Choose from: {', '.join(self.THEMES)}")
        self.theme = theme
        self.width = width

    # ------------------------------------------------------------------
    # Terminal / CLI rendering
    # ------------------------------------------------------------------

    def render_header(self, title: str, subtitle: Optional[str] = None) -> str:
        border = "=" * self.width
        lines = [border, title.center(self.width)]
        if subtitle:
            lines.append(subtitle.center(self.width))
        lines.append(border)
        return "\n".join(lines)

    def render_card(self, title: str, body: str, footer: Optional[str] = None) -> str:
        border = "-" * self.width
        lines = [border, f"  {title}", border, body]
        if footer:
            lines += [border, f"  {footer}"]
        lines.append(border)
        return "\n".join(lines)

    def render_table(self, headers: list[str], rows: list[list[Any]]) -> str:
        col_widths = [
            max(len(str(h)), max((len(str(r[i])) for r in rows), default=0))
            for i, h in enumerate(headers)
        ]
        sep = "+" + "+".join("-" * (w + 2) for w in col_widths) + "+"

        def fmt_row(cells: list[Any]) -> str:
            return "|" + "|".join(f" {str(c):<{w}} " for c, w in zip(cells, col_widths)) + "|"

        lines = [sep, fmt_row(headers), sep]
        for row in rows:
            lines.append(fmt_row(row))
        lines.append(sep)
        return "\n".join(lines)

    def render_progress(self, current: int, total: int, label: str = "") -> str:
        ratio = max(0.0, min(1.0, current / total if total else 0))
        filled = int(ratio * (self.width - 10))
        bar = "[" + "#" * filled + "-" * (self.width - 10 - filled) + "]"
        pct = f"{ratio * 100:5.1f}%"
        return f"{label:10} {bar} {pct}"

    # ------------------------------------------------------------------
    # HTML / web rendering
    # ------------------------------------------------------------------

    def render_html_card(self, title: str, body: str, footer: Optional[str] = None) -> str:
        footer_html = f"<footer>{footer}</footer>" if footer else ""
        return (
            f'<article class="pacifio-card" data-theme="{self.theme}">'
            f"<h2>{title}</h2><p>{body}</p>{footer_html}</article>"
        )

    def render_html_table(self, headers: list[str], rows: list[list[Any]]) -> str:
        th = "".join(f"<th>{h}</th>" for h in headers)
        tbody = "".join(
            "<tr>" + "".join(f"<td>{c}</td>" for c in row) + "</tr>" for row in rows
        )
        return (
            f'<table class="pacifio-table" data-theme="{self.theme}">'
            f"<thead><tr>{th}</tr></thead><tbody>{tbody}</tbody></table>"
        )

    def render_html_badge(self, label: str, value: str, color: str = "blue") -> str:
        return (
            f'<span class="pacifio-badge" style="background:{color}">'
            f"{label}: <strong>{value}</strong></span>"
        )
