"""Tests for the LaunchAdvisor."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from launchwhere.advisor import LaunchAdvisor, PlatformScore
from launchwhere.platforms import ALL_PLATFORMS, PRODUCT_HUNT


def _make_mock_client(json_response: str) -> MagicMock:
    client = MagicMock()
    message = MagicMock()
    message.content = json_response
    client.chat.completions.create.return_value.choices = [MagicMock(message=message)]
    return client


def test_rank_platforms_returns_sorted_scores():
    json_resp = """[
        {"slug": "producthunt", "score": 9, "reasoning": "Great fit for early adopters."},
        {"slug": "hackernews",  "score": 8, "reasoning": "Technical audience matches."},
        {"slug": "twitter",     "score": 6, "reasoning": "Good for awareness."},
        {"slug": "linkedin",    "score": 4, "reasoning": "Less relevant for dev tools."},
        {"slug": "indiehackers","score": 7, "reasoning": "Builder community."},
        {"slug": "reddit",      "score": 5, "reasoning": "Depends on subreddit."}
    ]"""
    client = _make_mock_client(json_resp)
    advisor = LaunchAdvisor(client)

    scores = advisor.rank_platforms("A CLI tool that helps you write better commit messages.")

    assert isinstance(scores, list)
    assert all(isinstance(s, PlatformScore) for s in scores)
    # Must be sorted best-first
    for i in range(len(scores) - 1):
        assert scores[i].score >= scores[i + 1].score


def test_rank_platforms_count_matches_all_platforms():
    slugs = [p.slug for p in ALL_PLATFORMS]
    json_resp = "[" + ", ".join(
        f'{{"slug": "{s}", "score": 5, "reasoning": "OK."}}'
        for s in slugs
    ) + "]"
    client = _make_mock_client(json_resp)
    advisor = LaunchAdvisor(client)

    scores = advisor.rank_platforms("Any product.")
    assert len(scores) == len(ALL_PLATFORMS)


def test_rank_platforms_ignores_unknown_slugs():
    json_resp = '[{"slug": "unknown_platform", "score": 9, "reasoning": "Irrelevant."}]'
    client = _make_mock_client(json_resp)
    advisor = LaunchAdvisor(client)

    scores = advisor.rank_platforms("A product.")
    assert scores == []


def test_platform_score_has_correct_platform():
    json_resp = '[{"slug": "producthunt", "score": 8, "reasoning": "Good fit."}]'
    client = _make_mock_client(json_resp)
    advisor = LaunchAdvisor(client)

    scores = advisor.rank_platforms("A SaaS product.")
    assert scores[0].platform == PRODUCT_HUNT
    assert scores[0].score == 8
