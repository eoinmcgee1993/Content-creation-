"""Tests for ContentGenerator."""

from __future__ import annotations

from unittest.mock import MagicMock

from launchwhere.generator import ContentGenerator, LaunchContent
from launchwhere.platforms import PRODUCT_HUNT, TWITTER, ALL_PLATFORMS


def _make_mock_client(tagline: str = "Great tool", body: str = "Launch post body.") -> MagicMock:
    import json
    client = MagicMock()
    message = MagicMock()
    message.content = json.dumps({"tagline": tagline, "body": body})
    client.chat.completions.create.return_value.choices = [MagicMock(message=message)]
    return client


def test_generate_returns_launch_content():
    client = _make_mock_client("Amazing CLI", "We built this because...")
    gen = ContentGenerator(client)

    result = gen.generate("A CLI for writing commit messages.", PRODUCT_HUNT)

    assert isinstance(result, LaunchContent)
    assert result.tagline == "Amazing CLI"
    assert result.body == "We built this because..."
    assert result.platform == PRODUCT_HUNT


def test_generate_passes_platform_to_prompt():
    client = _make_mock_client()
    gen = ContentGenerator(client)
    gen.generate("A product.", TWITTER)

    call_args = client.chat.completions.create.call_args
    messages = call_args.kwargs["messages"]
    user_message = next(m["content"] for m in messages if m["role"] == "user")
    assert "Twitter" in user_message


def test_generate_for_platforms_returns_one_per_platform():
    client = _make_mock_client()
    gen = ContentGenerator(client)
    platforms = [PRODUCT_HUNT, TWITTER]

    results = gen.generate_for_platforms("A product.", platforms)

    assert len(results) == 2
    assert results[0].platform == PRODUCT_HUNT
    assert results[1].platform == TWITTER


def test_render_includes_tagline_and_body():
    client = _make_mock_client("My tagline", "My body text.")
    gen = ContentGenerator(client)
    result = gen.generate("A product.", PRODUCT_HUNT)

    rendered = result.render()
    assert "Product Hunt" in rendered
    assert "My tagline" in rendered
    assert "My body text." in rendered
