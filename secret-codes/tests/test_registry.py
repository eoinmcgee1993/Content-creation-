import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import build  # noqa: E402


def test_registry_is_valid():
    assert build.validate(build.load()) == []


def test_duplicate_alias_is_rejected():
    reg = build.load()
    reg["commands"][0]["aliases"].append("critique")  # owned by critic
    assert any("/critique claimed by both" in p for p in build.validate(reg))


def test_token_with_space_is_rejected():
    reg = build.load()
    reg["commands"][0]["aliases"].append("case study")
    assert any("invalid token" in p for p in build.validate(reg))


def test_system_prompt_is_up_to_date():
    assert build.main(["--check"]) == 0
