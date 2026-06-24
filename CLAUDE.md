# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

## 5. Project overview

What this is: (fill in: one or two sentences, what it does and who it serves.)
Stack: (fill in: hosting, database, payments, email, automation.)
Live at: (fill in: url)
Current focus: (fill in: the one milestone you are working toward right now.)

## 6. Architecture rules

- Database access lives in (fill in: location). The UI never queries the database directly.
- Business logic lives in (fill in: location). Keep it out of view files and edge functions where possible.
- Server side secrets never touch client code. They live only in (fill in: location).
- Shared helpers live in (fill in: location). Search before adding a helper; do not duplicate one that already exists.

## 7. Coding standards

- Language and framework: (fill in.)
- Formatting: (fill in.)
- Naming: (fill in.)
- Comments explain why, not what. Keep functions small and single purpose.

## 8. Validation (must pass before any task is complete)

Run every command below and confirm all pass before treating work as done.

```
(fill in: lint command)
(fill in: test command)
(fill in: build command)
(fill in: type or schema check)
```

If a command does not exist yet, say so rather than skipping it.

## 9. Task handling

Work toward one milestone at a time.

1. Restate the milestone and its success condition in one line before starting.
2. Implement the smallest complete version that meets that condition.
3. Run the validation list in section 8.
4. Stop, summarize what changed, and wait for review before the next milestone.

Governing rule: ship before build. A working, shipped, smaller version beats an unshipped larger one.
