# Secret Codes V2

A natural-language command layer for AI chat models. You describe the
outcome; the model picks the operation. `/commands` are optional shortcuts.

## Files

| File | What it is |
|---|---|
| `registry.json` | **Source of truth.** Every canonical command: class, category, aliases, one-line behaviour, and output fields or workflow stages where they matter. |
| `router.md` | Hand-written part of the system prompt: routing, composition, control layer, evidence, quality gate. |
| `system-prompt.md` | **Generated** — `router.md` plus a command index rendered from the registry. Paste this into a model. Don't edit it by hand. |
| `build.py` | Validates the registry and regenerates `system-prompt.md`. |

```bash
python secret-codes/build.py            # validate + regenerate the prompt
python secret-codes/build.py --check    # fail if the prompt is stale
pytest secret-codes/tests -q
```

Using it: paste `system-prompt.md` into a Claude Project's instructions, a
custom GPT, a Gemini Gem, or an API `system` parameter. At about 21k
characters it is too long for ChatGPT's plain custom-instructions box (1,500
characters).

## The one rule the validator enforces

**Each `/token` belongs to exactly one canonical command.** Aliases are only
other spellings of that command, never a separate behaviour. Every token must
also be typeable as one word (`[a-z0-9]+`).

## How the spec's collisions were resolved

The V2 draft says "aliases should never be separate implementations," but it
lists the same token under several sections. Here is how each one was
resolved. Change any of them in `registry.json`, and the validator will tell
you if the change creates a new collision.

| Token(s) in the draft | Resolved to | Why |
|---|---|---|
| `/critique`, `/secondopinion` listed as reasoning commands | aliases of `critic` | §25 already declares them aliases |
| `/image` (design) | alias of `imageprompt` | same, per §25 |
| `/handoff` (agents) vs `/handback` (context) | one command, `handoff` | identical definitions |
| `/review` (learning and code) | `codereview` | §21's `/code /test /review` uses it this way; learning review is `spacedreview` |
| `/codeaudit` workflow (§23) vs `/auditcode` command (§11) | one workflow, `auditcode` | the same audit under two names |
| `/verify` (research and quality gate), `/factcheck` | `verify` (research); `factcheck` is an alias | same operation |
| `/check`, `/validate`, `/quality` | one command, `check` | all three are the quality gate |
| `/safe` mode vs `/safeauto` control | alias of `safeauto` | same definition |
| `/noaction` vs `/draftonly` | alias of `draftonly` | same definition |
| `/analyse` (reasoning and data) | `analyse` in think; `/data` handles supplied data | §16's own data-vs-research split |
| `/inspect`, `/benchmark`, `/negative`, `/carousel`, `/forecast`, `/constraints` | one home each (files, research, prompt, content, data, prompt) | they appeared in two sections |
| `/growth`, `/offer`, `/pricing`, `/competitoraudit` (marketing and business) | growth, offer, competitoraudit → marketing; pricing → business | listed twice |
| `/competitor` vs `/competitoraudit` | alias | near-identical |
| `/current` vs `/currentinfo` | alias | identical |
| `/contextpack` (prompt and context) | context | listed twice |
| `/delegation` (ops) vs `/delegate` (agents) | alias of `delegate` | same operation |
| `/projectcontext`, `/session` | aliases of `context`, `recap` | no distinct behaviour was given |
| `/proscons` / `/tradeoffs`; `/counter` / `/contrarian` / `/devilsadvocate`; `/ideas` / `/brainstorm`; `/hook` / `/hooks`; `/headline` / `/title`; `/story` / `/narrative`; `/metaphor` / `/analogy`; `/tighten` / `/shorten`; `/icp` / `/avatar` / `/audience`; `/retention` / `/churn`; `/kpi` / `/metrics`; `/teach` / `/tutor` / `/learn`; `/table` / `/tables`; `/diagram` / `/flowchart`; `/ci` / `/cd`; `/optimize` / `/performance` | merged into one command each | near-synonyms; keeping both would bring back V1's duplication |
| `/case study`, `/unit economics` | `casestudy`, `uniteconomics` | a token with a space can't be typed as one command |

Other structural changes:

- **Workflow is a fifth class.** §03 defines four classes, but the §23 recipes
  are neither tasks nor modes. They are fixed stage sequences, so the registry
  gives them their own class and a `steps` list.
- **PROMPT and MODES are categories.** The §29 master structure has 15
  branches and leaves out prompt engineering (§09) and the global modes (§04).
  Both are now categories.
- **Composition rule.** Control and mode commands apply globally wherever they
  appear. Task, transform and workflow commands run left to right. When
  control commands conflict, the most restrictive one wins.
- `/stats` (compute on supplied data) and `/statistics` (find published
  figures) remain separate commands. That follows the spec's own data-vs-
  research split, but the two names are close and a user could confuse them.
