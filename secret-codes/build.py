"""Validate registry.json and render system-prompt.md from it.

    python build.py           # validate, then write system-prompt.md
    python build.py --check   # validate, and fail if system-prompt.md is stale
"""
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).parent
REGISTRY = HERE / "registry.json"
ROUTER = HERE / "router.md"
OUTPUT = HERE / "system-prompt.md"

# Tokens are typed after a slash, so no spaces or punctuation: V1's
# "/case study" could never be typed as one command.
TOKEN = re.compile(r"^[a-z0-9]+$")


def load():
    return json.loads(REGISTRY.read_text())


def validate(reg):
    """Return a list of problems; empty means valid."""
    problems = []
    owner = {}  # token -> canonical name that claims it
    for cmd in reg["commands"]:
        name = cmd["name"]
        if cmd["class"] not in reg["classes"]:
            problems.append(f"{name}: unknown class {cmd['class']!r}")
        if cmd["category"] not in reg["categories"]:
            problems.append(f"{name}: unknown category {cmd['category']!r}")
        if not cmd.get("does"):
            problems.append(f"{name}: missing 'does'")
        if cmd["class"] == "workflow" and not cmd.get("steps"):
            problems.append(f"{name}: workflow without steps")
        if cmd["class"] != "workflow" and "steps" in cmd:
            problems.append(f"{name}: steps on a non-workflow")
        # The whole point of the registry: one token, one implementation.
        for token in [name, *cmd["aliases"]]:
            if not TOKEN.match(token):
                problems.append(f"{name}: invalid token {token!r}")
            if token in owner:
                problems.append(f"/{token} claimed by both {owner[token]} and {name}")
            else:
                owner[token] = name
    used = {c["category"] for c in reg["commands"]}
    for cat in reg["categories"]:
        if cat not in used:
            problems.append(f"category {cat!r} has no commands")
    return problems


def render(reg):
    lines = [ROUTER.read_text().rstrip(), ""]
    for cat, label in reg["categories"].items():
        lines += [f"### {label}", ""]
        for cmd in reg["commands"]:
            if cmd["category"] != cat:
                continue
            line = f"- `/{cmd['name']}`"
            if cmd["aliases"]:
                line += " (" + ", ".join(cmd["aliases"]) + ")"
            line += f" — {cmd['does']}"
            extra = cmd.get("steps") or cmd.get("output")
            if extra:
                sep = " → " if "steps" in cmd else " · "
                line += " [" + sep.join(extra) + "]"
            if cmd.get("can_modify_external_state"):
                line += " ⚠ external action"
            elif cmd.get("requires_external_tools"):
                line += " (needs tools)"
            lines.append(line)
        lines.append("")
    return "\n".join(lines)


def main(argv):
    reg = load()
    problems = validate(reg)
    if problems:
        print("\n".join(problems), file=sys.stderr)
        return 1
    text = render(reg)
    if "--check" in argv:
        if not OUTPUT.exists() or OUTPUT.read_text() != text:
            print("system-prompt.md is stale: run python build.py", file=sys.stderr)
            return 1
        return 0
    OUTPUT.write_text(text)
    print(f"{len(reg['commands'])} commands -> {OUTPUT.name} ({len(text)} chars)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
