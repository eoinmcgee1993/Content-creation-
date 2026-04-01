"""Tests for the OpenAI Codex plugin."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from plugins.openai_codex import OpenAICodexPlugin


@pytest.fixture
def mock_openai_client():
    with patch("plugins.openai_codex.plugin.OpenAI") as MockOpenAI:
        instance = MockOpenAI.return_value
        choice = MagicMock()
        choice.message.content = "Generated content."
        instance.chat.completions.create.return_value = MagicMock(choices=[choice])
        yield instance


@pytest.fixture
def plugin(mock_openai_client):
    return OpenAICodexPlugin(api_key="test-key")


class TestOpenAICodexPluginInit:
    def test_raises_without_api_key(self, monkeypatch):
        monkeypatch.delenv("OPENAI_API_KEY", raising=False)
        with pytest.raises(ValueError, match="API key"):
            OpenAICodexPlugin()

    def test_uses_env_api_key(self, monkeypatch, mock_openai_client):
        monkeypatch.setenv("OPENAI_API_KEY", "env-key")
        p = OpenAICodexPlugin()
        assert p.model == OpenAICodexPlugin.DEFAULT_MODEL

    def test_custom_model(self, mock_openai_client):
        p = OpenAICodexPlugin(api_key="key", model="gpt-3.5-turbo")
        assert p.model == "gpt-3.5-turbo"


class TestGenerate:
    def test_returns_content(self, plugin, mock_openai_client):
        result = plugin.generate("Write something.")
        assert result == "Generated content."

    def test_includes_system_prompt(self, plugin, mock_openai_client):
        plugin.generate("prompt", system_prompt="Be helpful.")
        call_args = mock_openai_client.chat.completions.create.call_args
        messages = call_args.kwargs["messages"]
        assert messages[0] == {"role": "system", "content": "Be helpful."}
        assert messages[1] == {"role": "user", "content": "prompt"}

    def test_no_system_prompt(self, plugin, mock_openai_client):
        plugin.generate("prompt")
        call_args = mock_openai_client.chat.completions.create.call_args
        messages = call_args.kwargs["messages"]
        assert len(messages) == 1
        assert messages[0]["role"] == "user"


class TestGenerateArticle:
    def test_returns_string(self, plugin):
        result = plugin.generate_article("AI trends")
        assert isinstance(result, str)
        assert len(result) > 0

    def test_includes_topic_in_prompt(self, plugin, mock_openai_client):
        plugin.generate_article("AI trends", tone="casual", word_count=300)
        call_args = mock_openai_client.chat.completions.create.call_args
        messages = call_args.kwargs["messages"]
        user_message = next(m for m in messages if m["role"] == "user")
        assert "AI trends" in user_message["content"]
        assert "casual" in user_message["content"]
        assert "300" in user_message["content"]


class TestImprove:
    def test_returns_improved_content(self, plugin):
        result = plugin.improve("Original content.")
        assert result == "Generated content."

    def test_includes_content_in_prompt(self, plugin, mock_openai_client):
        plugin.improve("My draft.", instructions="Make it snappier")
        call_args = mock_openai_client.chat.completions.create.call_args
        messages = call_args.kwargs["messages"]
        user_message = next(m for m in messages if m["role"] == "user")
        assert "My draft." in user_message["content"]
        assert "Make it snappier" in user_message["content"]


class TestSummarize:
    def test_returns_summary(self, plugin):
        result = plugin.summarize("Long content here.")
        assert result == "Generated content."

    def test_max_sentences_in_prompt(self, plugin, mock_openai_client):
        plugin.summarize("Some long text.", max_sentences=5)
        call_args = mock_openai_client.chat.completions.create.call_args
        messages = call_args.kwargs["messages"]
        user_message = next(m for m in messages if m["role"] == "user")
        assert "5" in user_message["content"]


class TestGenerateSocialPosts:
    def test_default_platforms(self, plugin):
        results = plugin.generate_social_posts("My topic")
        assert set(results.keys()) == {"twitter", "linkedin", "instagram"}

    def test_custom_platforms(self, plugin):
        results = plugin.generate_social_posts("My topic", platforms=["twitter"])
        assert list(results.keys()) == ["twitter"]

    def test_all_values_are_strings(self, plugin):
        results = plugin.generate_social_posts("My topic")
        for value in results.values():
            assert isinstance(value, str)
