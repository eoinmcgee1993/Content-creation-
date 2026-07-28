"""Tests for AtlasUIPlugin."""

import pytest
from plugins.atlas_ui import AtlasUIPlugin


def test_init_default():
    ui = AtlasUIPlugin()
    assert ui.layout == "dashboard"
    assert ui.title == "Atlas"


def test_init_invalid_layout():
    with pytest.raises(ValueError, match="Unknown layout"):
        AtlasUIPlugin(layout="grid")


def test_render_metric():
    ui = AtlasUIPlugin()
    ui.add_metric("Articles", 42, "posts")
    out = ui.render()
    assert "Articles" in out
    assert "42" in out
    assert "posts" in out


def test_render_alert():
    ui = AtlasUIPlugin()
    ui.add_alert("Low quota", level="warning")
    out = ui.render()
    assert "WARNING" in out
    assert "Low quota" in out


def test_render_chart():
    ui = AtlasUIPlugin()
    ui.add_chart("Views", {"Mon": 5.0, "Tue": 3.0})
    out = ui.render()
    assert "Views" in out
    assert "Mon" in out


def test_clear():
    ui = AtlasUIPlugin()
    ui.add_metric("X", 1)
    ui.clear()
    assert ui._widgets == []


def test_render_html_metric():
    ui = AtlasUIPlugin()
    ui.add_metric("Score", 99)
    out = ui.render_html()
    assert 'class="atlas-metric"' in out
    assert "Score" in out
    assert "99" in out


def test_render_html_alert():
    ui = AtlasUIPlugin()
    ui.add_alert("All good", level="info")
    out = ui.render_html()
    assert "atlas-alert--info" in out
    assert "All good" in out


def test_render_html_layout():
    ui = AtlasUIPlugin(layout="sidebar", title="My Dashboard")
    out = ui.render_html()
    assert 'data-layout="sidebar"' in out
    assert "My Dashboard" in out
