# Secret Codes command index

## Command index

Format: `/command (aliases) — what it does [fields or stages]`.

### Global operating modes

- `/fast` (quick) — Give the shortest useful answer.
- `/deep` — Go substantially deeper: reasoning, evidence, trade-offs and gaps.
- `/strict` — Never silently invent missing information; mark every gap.
- `/creative` — Prioritise divergent ideas and unusual approaches.
- `/practical` — Focus only on what can actually be done.
- `/expert` (specialist, consultant) — Specialist-level reasoning, with limitations stated plainly.
- `/simple` (plain) — Explain without unnecessary jargon.
- `/eli5` (eli5learn) — Explain as if to a curious beginner, using everyday comparisons.
- `/autopilot` — Break the job into stages and complete everything that can safely be completed.

### Writing and text transformation

- `/human` (humanise, humanize, natural, casual, friendly) — Rewrite so it reads like a person wrote it, meaning unchanged.
- `/rewrite` — Rewrite from scratch, preserving the meaning.
- `/edit` — Line-edit for clarity and flow; keep the author's structure.
- `/polish` — Final-pass refinement of near-finished text.
- `/proofread` — Fix spelling, grammar and punctuation only.
- `/simplify` — Make the material easier to understand.
- `/expand` — Add depth, detail and examples.
- `/tighten` (shorten, cut) — Remove flab and length without losing meaning.
- `/tone` — Shift the tone to the one requested.
- `/voice` — Match a supplied voice or brand voice.
- `/spoken` (speech) — Rewrite to be said out loud.
- `/professional` (formal) — Make it professional and composed.
- `/punchy` — Make the delivery sharper and more forceful.
- `/emotional` — Increase emotional resonance.
- `/metaphor` (analogy) — Explain or enrich through metaphor or analogy.
- `/story` (narrative, storytelling) — Shape the material as a story.
- `/headline` (title, titles, headlines) — Write headline or title options.
- `/hook` (hooks) — Write opening hooks that earn attention.
- `/outline` — Produce a structured outline.
- `/summarize` (summarise, summary, tldr) — Condense to the essential points.
- `/translate` — Translate, preserving meaning and register.
- `/email` — Write an email.

### Reasoning, critique and decisions

- `/analyse` (analyze, analysis, analyst) — Break the subject into parts and examine how they relate.
- `/think` (why) — Reason step by step and show the reasoning.
- `/logic` — Check whether the argument is logically valid.
- `/critic` (critique, flaws, weaknesses, secondopinion) — Find weaknesses, challenge assumptions, separate evidence from opinion, propose fixes. [finding · evidence · impact · fix]
- `/redteam` — Attack the idea as an adversary would, looking for how it fails or is abused.
- `/assumptions` — List the assumptions the material depends on.
- `/edgecases` — Find the edge cases and boundary conditions.
- `/counter` (contrarian, devilsadvocate) — Argue the strongest opposing position.
- `/debate` — Argue both sides, then weigh them.
- `/tradeoffs` (proscons) — Lay out the trade-offs, pros and cons.
- `/alternatives` (options) — Generate genuinely different alternatives.
- `/decision` (decide) — Structure a decision without forcing a single winner. [objective · options · criteria · evidence · trade-offs · risks · unknown variables · conditional conclusions · next step]
- `/risks` — Identify risks, their likelihood and impact.
- `/pareto` (8020) — Find the 20% of effort that drives 80% of the result.
- `/priors` (baserates) — State base rates and prior expectations before judging.

### Research and evidence

- `/research` — Investigate using external evidence; label each point as fact, claim, inference, assumption, unknown or conflicting evidence. (needs tools)
- `/sources` — Find and list the relevant sources. (needs tools)
- `/primary` — Prefer primary sources over commentary.
- `/currentinfo` (current, latest) — Use the most recent information and state its date. (needs tools)
- `/evidence` — Show the evidence behind each claim.
- `/statistics` — Find published statistics from external sources. (needs tools)
- `/benchmark` — Compare against a reference standard or measured baseline.
- `/verify` (factcheck) — Check whether claims are true against independent evidence.
- `/grounded` — Tie every claim to a source; drop claims that cannot be.
- `/sourceonly` — Answer only from the material supplied.
- `/notfound` — Say plainly when something is not found instead of guessing.
- `/cite` — Attach citations to claims.
- `/audittrail` — Show the provenance of every claim. [claim · source · date · evidence · confidence · limitation]
- `/deepresearch` — Full research workflow. [define → search → collect → cross-check → analyse → identify gaps → synthesise → cite → verify] (needs tools)

### Learning and teaching

- `/teach` (learn, tutor) — Teach the idea, show an example, then ask the learner to try.
- `/quiz` — Ask questions to check understanding.
- `/exam` — Run a full, marked assessment.
- `/flashcards` — Make flashcards.
- `/socratic` — Teach only by asking questions.
- `/curriculum` (syllabus) — Design a learning path.
- `/drill` (practice) — Repetitive practice on one skill.
- `/mistake` (mistakes) — Show common mistakes and how to avoid them.
- `/difference` (vs) — Explain the difference between similar things.
- `/whiteboard` — Explain visually, as on a whiteboard.
- `/sticky` (mnemonic) — Make it memorable.
- `/mindmap` — Produce a mind map.
- `/cheatsheet` — Produce a one-page reference.
- `/diagnose` — Find out what the learner already knows before teaching.
- `/prerequisites` (prereqs) — List what must be understood first.
- `/mastery` — Define and test what mastery looks like.
- `/spacedreview` (spaced) — Schedule review of learned material over time.

### Software engineering

- `/code` (implement) — Write working code.
- `/debug` — Find why the code misbehaves.
- `/fix` (patch) — Apply fixes to the identified problems.
- `/rootcause` (rca) — Trace a failure to its root cause, not its symptom.
- `/codereview` (review) — Review code for correctness, security and maintainability.
- `/refactor` — Restructure code without changing behaviour.
- `/optimize` (optimise, performance) — Make the code faster or leaner.
- `/profile` — Measure where time and memory go.
- `/test` (tests) — Write or run tests.
- `/coverage` — Find what the tests do not cover.
- `/explaincode` — Explain what the code does and why.
- `/sql` — Write or fix SQL.
- `/api` — Design or integrate an API.
- `/architecture` (arch) — Design or assess system architecture.
- `/scaffold` (boilerplate) — Generate a project skeleton.
- `/migrate` (migration) — Plan or write a migration.
- `/dependency` (dependencies, deps) — Assess or update dependencies.
- `/security` (secreview) — Review for security vulnerabilities.
- `/threatmodel` — Model who could attack the system, how, and what it costs.
- `/logs` — Read logs and explain what happened.
- `/trace` — Follow a request or value through the code.
- `/cicd` (ci, cd, pipeline) — Set up or fix CI/CD pipelines.
- `/deploy` — Prepare a deployment. ⚠ external action
- `/release` — Prepare a release. ⚠ external action
- `/commit` — Write a commit message for the change.
- `/changelog` — Write changelog entries.
- `/readme` — Write or update a README.
- `/docs` (documentation) — Write technical documentation.
- `/auditcode` (codeaudit) — Audit a codebase, ranked critical/high/medium/low across bugs, security, architecture, performance, duplication, dead code, testing, maintainability and documentation. Follow with fix to patch the actionable findings. [discover → inspect → classify → find failures → prioritise → patch → test → review → report]

### Design and visual

- `/design` — Design the thing requested.
- `/ui` — Design the user interface.
- `/ux` — Design the user experience and flows.
- `/brand` (branding) — Develop the brand identity.
- `/layout` — Design the layout and hierarchy.
- `/typography` (type, fonts) — Choose and pair typefaces.
- `/color` (colour, palette) — Build a colour palette.
- `/imageprompt` (image, img, photo, hdreal, proshot, lifestyle, cinematic) — Write a prompt for an image generator.
- `/storyboard` — Lay out a sequence of frames.
- `/logo` — Develop logo concepts.
- `/thumbnail` — Design a thumbnail.
- `/infographic` — Design an infographic.
- `/diagram` (flowchart) — Draw a diagram or flowchart.
- `/mockup` (wireframe) — Produce a mockup.
- `/styleframe` — Produce a style frame that sets the visual look.
- `/presentation` (deck, slides) — Build a presentation.
- `/designsystem` — Define a design system: tokens, components, rules.
- `/designaudit` — Audit a design for consistency and usability.
- `/accessibility` (a11y) — Check and fix accessibility.
- `/responsive` — Make the design work across screen sizes.
- `/component` — Design a reusable component.
- `/visualdirection` (artdirection, moodboard) — Set the overall visual direction.

### Content creation and distribution

- `/content` — Create content for the stated channel.
- `/brainstorm` (ideas) — Generate many ideas.
- `/viral` — Optimise for shareability.
- `/trend` (trends) — Identify relevant trends. (needs tools)
- `/contentgap` — Find topics the audience wants that nobody covers well.
- `/thread` — Write a thread.
- `/script` — Write a script.
- `/youtube` — Create for YouTube.
- `/reels` (shorts, tiktok) — Create short-form vertical video.
- `/caption` (captions) — Write captions.
- `/instagram` (ig) — Create for Instagram.
- `/carousel` — Create a multi-slide carousel.
- `/newsletter` — Write a newsletter.
- `/seo` — Optimise for search engines.
- `/geo` — Optimise to be cited by generative AI answers.
- `/aeo` — Optimise for direct-answer features.
- `/repurpose` — Turn existing material into other formats.
- `/series` — Plan a content series.
- `/cta` — Write calls to action.
- `/linkedin` — Create for LinkedIn.
- `/calendar` (contentcalendar) — Build a content calendar.
- `/contentengine` — Turn one idea into a full content system, ending with an SEO and repurpose plan. [one idea → longform → shortform → thread → carousel → video → email → cta]

### Marketing and sales

- `/ads` (ad) — Write ad creative.
- `/ugc` — Write user-generated-style content briefs and scripts.
- `/landing` (landingpage) — Write or improve a landing page.
- `/offer` — Shape the offer.
- `/offerstack` — Stack bonuses and components into the offer.
- `/monetize` (monetise) — Find ways to make money from it.
- `/upsell` — Design upsells and cross-sells.
- `/funnel` — Design the funnel.
- `/positioning` — Define the position against alternatives.
- `/icp` (avatar, audience, persona) — Define the ideal customer.
- `/painpoints` — Identify the customer's pain points.
- `/objections` — List objections and answers to them.
- `/abtest` (splittest) — Design an A/B test.
- `/creativebrief` (brief) — Write a creative brief.
- `/sales` — Write sales material.
- `/campaign` — Plan a campaign.
- `/growth` — Find growth levers.
- `/competitoraudit` (competitor, competitors) — Analyse competitors. (needs tools)
- `/customerresearch` — Plan or synthesise customer research.
- `/messaging` — Build the messaging framework.
- `/valueprop` — Sharpen the value proposition.
- `/proof` (socialproof) — Find and present proof: results, testimonials, data.
- `/casestudy` — Write a case study.
- `/retention` (churn) — Reduce churn and keep customers.
- `/lifecycle` — Map lifecycle marketing stages.
- `/emailsequence` (sequence) — Write an email sequence.
- `/launch` — Plan and build a launch. [positioning → offer → landing → creative → email → content → distribution → metrics]

### Business and strategy

- `/business` (startup) — Analyse or develop the business.
- `/strategy` — Develop strategy.
- `/market` (marketsize) — Analyse the market.
- `/swot` — Strengths, weaknesses, opportunities, threats.
- `/pricing` (price) — Set or assess pricing.
- `/roi` — Estimate return on investment, showing the inputs.
- `/roadmap` — Build a roadmap.
- `/plan` — Make a plan.
- `/mvp` — Define the smallest version worth shipping.
- `/uniteconomics` — Work out per-unit revenue, cost and margin.
- `/businessmodel` — Describe how the business makes money.
- `/validation` — Design cheap tests of whether the idea is wanted.
- `/experiment` — Design an experiment with a hypothesis and success threshold.
- `/kpi` (kpis, metrics) — Choose the metrics that matter.
- `/scenario` (scenarios) — Model best, base and worst cases.
- `/product` — Take a product from problem to launch. [problem → customer → market → solution → mvp → offer → price → validation → launch]

### Analysis of supplied data

- `/data` — Analyse the data supplied. Use research for external evidence.
- `/clean` — Clean the data.
- `/transform` (reshape) — Reshape the data.
- `/query` — Query the data.
- `/table` (tables) — Present as a table, or extract tables from a document.
- `/chart` (graph, plot) — Chart the data.
- `/stats` — Compute statistics on the data supplied.
- `/forecast` — Forecast, stating method and uncertainty.
- `/outliers` (anomalies) — Find outliers.
- `/correlation` — Find correlations, without claiming causation.
- `/segment` — Segment the data.
- `/aggregate` (groupby) — Aggregate the data.

### Documents and files

- `/read` — Read the material fully before doing anything with it.
- `/extract` — Extract only what is actually present.
- `/inspect` — Examine a file, folder or codebase and report what is there.
- `/document` — Understand the document first, then perform the requested operation.
- `/longdoc` (longcontext) — Handle a long document section by section without losing track.
- `/compare` — Compare two or more documents systematically.
- `/diff` — Show exactly what changed.
- `/merge` — Combine documents, resolving overlaps and conflicts.
- `/revise` — Revise a document against supplied feedback.
- `/redact` — Remove sensitive information.
- `/index` — Build an index of topics and where they appear.
- `/catalog` (catalogue, inventory) — Turn a messy collection into an inventory.
- `/quotes` — Pull exact quotations.
- `/citations` — Extract the citations a document already contains.

### Prompt engineering

- `/prompt` (promptengineer) — Write an effective prompt for the goal.
- `/promptshort` — Write the shortest prompt that works.
- `/promptdetail` — Write a fully specified prompt.
- `/constraints` — Add explicit constraints to a prompt or task.
- `/negative` (negativeprompt) — Write what must be excluded (negative prompt).
- `/systemprompt` — Write a system prompt.
- `/metaprompt` — Write a prompt that writes prompts.
- `/chain` — Split the task into a chain of prompts.
- `/criticprompt` — Write a prompt that critiques another output.
- `/eval` — Define how to evaluate an output.
- `/evalset` — Build a set of test cases for a prompt.
- `/fewshot` (demos, examples) — Add worked examples to a prompt.
- `/promptaudit` — Audit a prompt. [ambiguity · missing context · conflicting instructions · unnecessary complexity · missing constraints · failure modes · output format · evaluation method]
- `/promptversion` — Record a prompt as a numbered version with what changed.
- `/promptdiff` — Compare two prompt versions and their likely effect.
- `/prompttest` — Run a prompt against test cases and report results.
- `/promptoptimize` (promptoptimise) — Improve a prompt against its evaluation.

### Agents and automation

- `/agent` (agenttask) — Turn the request into a sequence of executable tasks and carry them out.
- `/agentplan` — Produce the task sequence without executing it.
- `/workflow` (process) — Design a repeatable process.
- `/orchestrate` — Coordinate multiple tools or stages.
- `/delegate` (delegation) — Split work for other people or agents, with owners and done-criteria.
- `/handoff` (handback, handover) — Package the current state so another person, model or agent can pick it up.
- `/toolchain` (tools) — Choose the tools for the job and how they connect.
- `/automate` (automation) — Design an automation.
- `/trigger` — Define what event starts an automation.
- `/monitor` (watch) — Define what to watch and what counts as a meaningful change.

### Context and memory

- `/context` (projectcontext) — State the context being worked from.
- `/contextpack` — Build a compact context pack for a model.
- `/recap` (session) — Recap where things stand. [what we know · what changed · what's done · what's open · decisions · blockers · next action]
- `/continue` (carryon) — Pick up exactly where the work left off.

### Control, permissions and the quality gate

- `/preview` (dryrun) — Show what would happen; change nothing.
- `/draftonly` (noaction, draft) — Prepare it; take no external action.
- `/readonly` — Read and report only; modify nothing, local or external.
- `/approval` (approve) — Prepare the action and wait for explicit approval.
- `/toolgate` — Ask before each tool use.
- `/safeauto` (safe) — Do safe, reversible steps automatically; stop for approval before consequential ones.
- `/execute` (run, go) — Perform the approved action. ⚠ external action
- `/publish` (ship) — Push the finished result to its destination. ⚠ external action
- `/rollback` (undo, revert) — Reverse a supported previous operation. ⚠ external action
- `/check` (validate, quality, qa) — Run the quality gate on the output: constraints, sources, format.

### Operations and career

- `/meeting` (meetingnotes) — Prepare for or write up a meeting.
- `/agenda` — Write an agenda.
- `/sop` — Write a standard operating procedure.
- `/okr` (okrs) — Write objectives and key results.
- `/resume` (cv) — Write or improve a CV.
- `/negotiate` (negotiation) — Prepare a negotiation.
- `/name` (naming) — Generate names.
- `/faq` — Write an FAQ.
- `/career` — Career advice and planning.
- `/productivity` (time) — Improve how time and effort are spent.
- `/checklist` — Make a checklist.
- `/incident` — Run or document an incident response.
- `/postmortem` (retro) — Write a blameless postmortem.
- `/status` (statusupdate) — Write a status update.
- `/report` — Write a report.
- `/weeklyreview` (weekly) — Run a weekly review.
- `/audit` — Audit any collection, process or system and turn it into an action plan. [inventory → classify → duplicates → risks → gaps → priorities → action plan]
