"""Tests for the PacifioUIPlugin."""

import pytest
from plugins.pacifio_ui import PacifioUIPlugin


def test_init_default():
    ui = PacifioUIPlugin()
    assert ui.theme == "default"
    assert ui.width == 80


def test_init_invalid_theme():
    with pytest.raises(ValueError, match="Unknown theme"):
        PacifioUIPlugin(theme="neon")


def test_render_header():
    ui = PacifioUIPlugin(width=40)
    out = ui.render_header("Hello", subtitle="World")
    assert "Hello" in out
    assert "World" in out
    assert "=" * 40 in out


def test_render_card():
    ui = PacifioUIPlugin()
    out = ui.render_card("Title", "Body text", footer="Footer")
    assert "Title" in out
    assert "Body text" in out
    assert "Footer" in out


def test_render_table():
    ui = PacifioUIPlugin()
    out = ui.render_table(["Name", "Score"], [["Alice", 95], ["Bob", 87]])
    assert "Name" in out
    assert "Alice" in out
    assert "95" in out


def test_render_progress():
    ui = PacifioUIPlugin()
    out = ui.render_progress(50, 100, label="Upload")
    assert "50.0%" in out
    assert "#" in out


def test_render_progress_zero_total():
    ui = PacifioUIPlugin()
    out = ui.render_progress(0, 0)
    assert "0.0%" in out


def test_render_html_card():
    ui = PacifioUIPlugin(theme="dark")
    out = ui.render_html_card("My Title", "Some body")
    assert 'data-theme="dark"' in out
    assert "<h2>My Title</h2>" in out
    assert "<footer>" not in out


def test_render_html_card_with_footer():
    ui = PacifioUIPlugin()
    out = ui.render_html_card("T", "B", footer="F")
    assert "<footer>F</footer>" in out


def test_render_html_table():
    ui = PacifioUIPlugin()
    out = ui.render_html_table(["A", "B"], [["x", "y"]])
    assert "<th>A</th>" in out
    assert "<td>x</td>" in out


def test_render_html_badge():
    ui = PacifioUIPlugin()
    out = ui.render_html_badge("Status", "OK", color="green")
    assert "background:green" in out
    assert "Status" in out
    assert "<strong>OK</strong>" in out
