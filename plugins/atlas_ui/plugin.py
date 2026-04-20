"""Atlas UI plugin — dashboard, metrics, and structured layout components."""

from __future__ import annotations

from typing import Any, Optional


class AtlasUIPlugin:
    """Plugin providing Atlas-style dashboard and metrics UI for content workflows."""

    LAYOUTS = ("dashboard", "sidebar", "fullwidth")

    def __init__(self, layout: str = "dashboard", title: str = "Atlas") -> None:
        if layout not in self.LAYOUTS:
            raise ValueError(f"Unknown layout '{layout}'. Choose from: {', '.join(self.LAYOUTS)}")
        self.layout = layout
        self.title = title
        self._widgets: list[dict[str, Any]] = []

    # ------------------------------------------------------------------
    # Widget registration
    # ------------------------------------------------------------------

    def add_metric(self, label: str, value: Any, unit: str = "") -> None:
        self._widgets.append({"type": "metric", "label": label, "value": value, "unit": unit})

    def add_chart(self, name: str, data: dict[str, float]) -> None:
        self._widgets.append({"type": "chart", "name": name, "data": data})

    def add_alert(self, message: str, level: str = "info") -> None:
        self._widgets.append({"type": "alert", "message": message, "level": level})

    # ------------------------------------------------------------------
    # Terminal rendering
    # ------------------------------------------------------------------

    def render(self) -> str:
        lines = [f"=== {self.title} [{self.layout}] ==="]
        for w in self._widgets:
            if w["type"] == "metric":
                lines.append(f"  [{w['label']}]  {w['value']} {w['unit']}".rstrip())
            elif w["type"] == "chart":
                lines.append(f"  Chart: {w['name']}")
                for k, v in w["data"].items():
                    bar = "#" * int(v)
                    lines.append(f"    {k:<15} {bar} ({v})")
            elif w["type"] == "alert":
                lines.append(f"  [{w['level'].upper()}] {w['message']}")
        lines.append("=" * 40)
        return "\n".join(lines)

    def clear(self) -> None:
        self._widgets.clear()

    # ------------------------------------------------------------------
    # HTML rendering
    # ------------------------------------------------------------------

    def render_html(self) -> str:
        widget_html = ""
        for w in self._widgets:
            if w["type"] == "metric":
                widget_html += (
                    f'<div class="atlas-metric">'
                    f'<span class="label">{w["label"]}</span>'
                    f'<span class="value">{w["value"]} {w["unit"]}</span></div>'
                )
            elif w["type"] == "chart":
                bars = "".join(
                    f'<div class="bar" style="height:{v}px" title="{k}">{k}</div>'
                    for k, v in w["data"].items()
                )
                widget_html += f'<div class="atlas-chart"><h4>{w["name"]}</h4>{bars}</div>'
            elif w["type"] == "alert":
                widget_html += (
                    f'<div class="atlas-alert atlas-alert--{w["level"]}">{w["message"]}</div>'
                )
        return (
            f'<div class="atlas-dashboard" data-layout="{self.layout}">'
            f"<h1>{self.title}</h1>{widget_html}</div>"
        )
