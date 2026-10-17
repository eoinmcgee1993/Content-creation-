"""Validate registry.json and render the outputs generated from it.

    python build.py           # validate, then write every output
    python build.py --check   # validate, and fail if any output is stale

Outputs: system-prompt.md (paste into any model) and the Claude skill in
skill/secret-codes/ (router in SKILL.md, index in references/commands.md).
"""
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).parent
REGISTRY = HERE / "registry.json"
ROUTER = HERE / "router.md"
SKILL = HERE / "skill" / "secret-codes"

# The description is what makes Claude load the skill, so it names the
# triggers rather than describing the product.
SKILL_FRONTMATTER = """---
name: secret-codes
description: Natural-language command layer. Use whenever a message contains /slash shortcuts such as /human, /critic, /research, /rewrite, /decision, /auditcode or /recap (alone or stacked, e.g. "/rewrite /human /punchy"), mentions Secret Codes, or invokes /secret-codes. Resolves each token to one canonical command, applies modes and permission controls, runs tasks and workflows in order, and checks the result before answering.
---

"""

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


def render_index(reg):
    lines = [
        "## Command index",
        "",
        "Format: `/command (aliases) — what it does [fields or stages]`.",
        "",
    ]
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


def render(reg):
    """Return {path: text} for every generated file."""
    router = ROUTER.read_text().rstrip()
    index = render_index(reg)
    return {
        HERE / "system-prompt.md": router + "\n\n" + index,
        SKILL / "SKILL.md": SKILL_FRONTMATTER + router + "\n\n"
        "## Command index\n\n"
        "The full index is in `references/commands.md`. Read it whenever the\n"
        "request contains a `/word`, or names an operation you need the exact\n"
        "fields or stages for.\n",
        SKILL / "references" / "commands.md": "# Secret Codes command index\n\n" + index,
    }


def main(argv):
    reg = load()
    problems = validate(reg)
    if problems:
        print("\n".join(problems), file=sys.stderr)
        return 1
    outputs = render(reg)
    if "--check" in argv:
        stale = [p for p, t in outputs.items() if not p.exists() or p.read_text() != t]
        for p in stale:
            print(f"{p.relative_to(HERE)} is stale: run python build.py", file=sys.stderr)
        return 1 if stale else 0
    for path, text in outputs.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text)
        print(f"wrote {path.relative_to(HERE)} ({len(text)} chars)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
