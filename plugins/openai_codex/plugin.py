"""OpenAI Codex plugin for content creation."""

from __future__ import annotations

import os
from typing import Optional

try:
    from openai import OpenAI
except ImportError as e:
    raise ImportError(
        "openai package is required. Install it with: pip install openai"
    ) from e


class OpenAICodexPlugin:
    """Plugin that uses OpenAI API to generate and enhance content."""

    DEFAULT_MODEL = "gpt-4o"
    DEFAULT_MAX_TOKENS = 2048
    DEFAULT_TEMPERATURE = 0.7

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = DEFAULT_MODEL,
        max_tokens: int = DEFAULT_MAX_TOKENS,
        temperature: float = DEFAULT_TEMPERATURE,
    ) -> None:
        """
        Initialize the OpenAI Codex plugin.

        Args:
            api_key: OpenAI API key. Falls back to OPENAI_API_KEY env variable.
            model: OpenAI model to use.
            max_tokens: Maximum tokens in the response.
            temperature: Sampling temperature (0.0 - 2.0).
        """
        resolved_key = api_key or os.environ.get("OPENAI_API_KEY")
        if not resolved_key:
            raise ValueError(
                "OpenAI API key must be provided or set via OPENAI_API_KEY environment variable."
            )

        self.client = OpenAI(api_key=resolved_key)
        self.model = model
        self.max_tokens = max_tokens
        self.temperature = temperature

    def generate(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """
        Generate content from a prompt.

        Args:
            prompt: The user prompt describing the content to generate.
            system_prompt: Optional system-level instructions.

        Returns:
            Generated content as a string.
        """
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            max_tokens=self.max_tokens,
            temperature=self.temperature,
        )
        return response.choices[0].message.content or ""

    def generate_article(
        self,
        topic: str,
        tone: str = "informative",
        word_count: int = 500,
    ) -> str:
        """
        Generate a full article on a given topic.

        Args:
            topic: The topic to write about.
            tone: Writing tone (e.g. 'informative', 'casual', 'persuasive').
            word_count: Approximate target word count.

        Returns:
            Generated article as a string.
        """
        system_prompt = (
            "You are an expert content writer. "
            "Write well-structured, engaging articles optimized for readability."
        )
        prompt = (
            f"Write a {tone} article about: {topic}\n"
            f"Target length: approximately {word_count} words.\n"
            "Include a title, introduction, body sections with headers, and a conclusion."
        )
        return self.generate(prompt, system_prompt=system_prompt)

    def improve(self, content: str, instructions: str = "Improve clarity and engagement") -> str:
        """
        Improve or rewrite existing content.

        Args:
            content: The existing content to improve.
            instructions: Specific improvement instructions.

        Returns:
            Improved content as a string.
        """
        system_prompt = (
            "You are an expert editor. Improve the provided content while preserving "
            "the author's intent and core message."
        )
        prompt = f"{instructions}:\n\n{content}"
        return self.generate(prompt, system_prompt=system_prompt)

    def summarize(self, content: str, max_sentences: int = 3) -> str:
        """
        Summarize content in a given number of sentences.

        Args:
            content: Content to summarize.
            max_sentences: Maximum number of sentences in the summary.

        Returns:
            Summary as a string.
        """
        system_prompt = "You are a concise summarizer. Return only the summary, no preamble."
        prompt = f"Summarize the following in at most {max_sentences} sentences:\n\n{content}"
        return self.generate(prompt, system_prompt=system_prompt)

    def generate_social_posts(self, topic: str, platforms: list[str] | None = None) -> dict[str, str]:
        """
        Generate social media posts for multiple platforms.

        Args:
            topic: The topic or content to create posts about.
            platforms: List of platforms (e.g. ['twitter', 'linkedin', 'instagram']).
                       Defaults to ['twitter', 'linkedin', 'instagram'].

        Returns:
            Dictionary mapping platform name to generated post.
        """
        if platforms is None:
            platforms = ["twitter", "linkedin", "instagram"]

        system_prompt = (
            "You are a social media content specialist. "
            "Write platform-appropriate posts that maximize engagement."
        )
        results: dict[str, str] = {}
        for platform in platforms:
            prompt = (
                f"Write a {platform} post about: {topic}\n"
                f"Follow {platform}'s best practices and character limits."
            )
            results[platform] = self.generate(prompt, system_prompt=system_prompt)
        return results
