// Everything the Money Machine can say. The engine only combines these.
//
// Saved and shared ideas are stored as ids and list positions (niche id,
// pain id, format id, sub-niche index...), so treat every list here as
// append-only: renaming an id or reordering `sub`, `when` or GEOS changes
// what old vault entries and share links open.
//
// "¤" is the currency placeholder; the page swaps in $, € or £.
// Text fields are written to slot into the format templates below:
//   thing  a noun phrase naming the pain        "missed deductions"
//   task   a bare verb phrase, the job to do     "chase unpaid invoices"
//   result a bare verb phrase, the payoff        "get paid in days"
//   data   what the customer already has         "bank exports"
//   supply (optional) the other side of a match  "clients who post budgets"
//   merch  (optional) printable/physical product "PR brag posters"

export const MODES = [
  { id: "jackpot", emoji: "🎰", label: "JACKPOT", blurb: "Random high-upside idea." },
  { id: "degen", emoji: "💀", label: "DEGEN", blurb: "Ideas that are strange, aggressive or borderline ridiculous." },
  { id: "cash", emoji: "💰", label: "CASH NOW", blurb: "Ideas designed around getting the first customer quickly." },
  { id: "ai", emoji: "🤖", label: "AI MODE", blurb: "Workflow automation, API bridging and intelligent systems infrastructure." },
  { id: "digital", emoji: "📦", label: "DIGITAL PRODUCTS", blurb: "Templates, PDFs, courses, prompts, tools." },
  { id: "steal", emoji: "🕵️", label: "STEAL LIKE AN ENGINEER", blurb: "Take an existing business model and mutate it into a new niche." },
  { id: "sheep", emoji: "☠️", label: "BLACK SHEEP", blurb: "Unglamorous, uncomfortable, quietly profitable niches nobody wants to talk about." },
];

// pick: how a spin chooses between candidates.
//   random  - first draw wins
//   upside  - best scorecard plus the biggest wallet out of `draws` spins
//   fastest - easiest first customer out of `draws` spins
export const MODE_RULES = {
  jackpot: { sets: ["core", "degen", "sheep"], formats: "all", pick: "upside", draws: 8 },
  degen: { sets: ["degen"], formats: "all", pick: "random", degen: 1 },
  cash: { sets: ["core", "sheep"], formats: ["concierge", "ghostwriter", "detective", "audit", "workflow", "kit"], pick: "fastest", draws: 3 },
  ai: { sets: ["core", "degen", "sheep"], formats: ["detective", "watchdog", "agent", "chatbot", "api", "saas", "extension", "workflow"], pick: "random" },
  digital: { sets: ["core", "degen", "sheep"], formats: ["kit", "playbook", "course", "prompts", "printables", "calculator", "directory"], pick: "random" },
  steal: { steal: true, pick: "random" },
  sheep: { sets: ["sheep"], formats: "all", pick: "random" },
};

// Price anchors by how much a customer segment can spend.
// 1 consumers · 2 solo operators · 3 small businesses · 4 high-ticket B2B
export const BAND = {
  1: { one: 9, rec: 5, setup: 49, kit: 9 },
  2: { one: 19, rec: 9, setup: 149, kit: 19 },
  3: { one: 99, rec: 49, setup: 490, kit: 49 },
  4: { one: 490, rec: 199, setup: 1490, kit: 99 },
};

// Every price the machine quotes snaps to one of these.
export const PRICE_POINTS = [1, 5, 7, 9, 12, 15, 19, 24, 29, 39, 49, 59, 79, 99, 129, 149, 199, 249, 299, 399, 490, 590, 790, 990, 1490, 1990, 2490, 2990, 3990, 4990];

export const WALLET_WHY = {
  1: "Consumers: keep the entry price under the cost of a takeaway.",
  2: "Solo operators pay for anything that gives them a Sunday back.",
  3: "Small businesses budget monthly. Anchor it against one lost customer.",
  4: "High-ticket buyers expect a call. Price against what the problem costs them.",
};

export const GEOS = ["in Ireland", "in the UK", "in Texas", "in Dubai", "in Berlin", "in Sydney", "in Toronto", "in Lisbon", "in Florida", "in Singapore"];

// kind drives delivery, payment platform and the 7-day plan:
// service (you do it) · product (download) · software (they use it)
// minWallet / noGentle keep a format away from customers it doesn't suit
// (nobody sells an API to a grieving family).
//
// Customer-facing copy never says "AI": ideas are positioned as
// Intelligent Automation / Systems Infrastructure. Per format:
//   sys   the positioning line ({N} is the pain's noun, upper-cased later)
//   x     the mechanism in "X for Y" ({nn} is the noun in lower case);
//         prop replaces the whole line when the mechanism is its supply
//   tier  the stack MAKE IT CHEAPER downgrades from
//   t1/t2 the two-tier price: a low-barrier entry and a recurring backend
export const FORMATS = [
  {
    id: "detective", reel: "DETECTIVE", kind: "service", fits: ["leak", "risk"],
    names: ["{N} Detective", "{N} Bounty Hunter", "{N} Autopsy"],
    pitch: "Find {find} hiding in {poss} {data}.",
    pay: (b) => ({ one: b.one, rec: b.rec }), offer: "{one} audit + {rec}/month monitoring",
    mvp: ["landing page", "upload form", "automated analysis"], nocode: ["Carrd page", "Tally upload form", "you + Claude in a chat window"],
    first: "post 3 before/after examples in {hang}", free: "free audit",
    build: 2, cost: 1, auto: 5, clar: 4, fcd: 0,
    why: { build: "An upload form, one well-tested prompt and a report template.", auto: "The model reads the files; you only check the edge cases.", clar: "The audit proves the money exists, and monitoring keeps finding it." },
    bullets: ["Upload {data} in two minutes", "Every case of {find} flagged, with what it costs", "A plain-English fix list, ranked by money"],
    cta: "Run my {one} audit",
    sys: "INTELLIGENT AUTOMATION: {N} AUDIT INFRASTRUCTURE", x: "automated {nn} audit infrastructure", tier: "CLAUDE API PIPELINE", t1: "{one} one-off audit", t2: "{rec}/month monitoring",
    deliver: ["A written audit of {poss} {data}", "Every case of {find}, with what it costs", "A fix list ranked by money", "Monthly re-scan on the monitoring plan"],
    stack: [["Page", "Netlify or Carrd"], ["Intake", "Tally form with file upload"], ["Payments", "Stripe Payment Links"], ["Intelligence", "Claude API with one tested audit prompt"], ["Glue", "Make or n8n"], ["Data", "Google Sheets"], ["Email", "Resend or Gmail"]],
    flow: ["Customer pays for the audit (Stripe Payment Link)", "Tally form collects {data}", "Make sends the files to the Claude API with your audit prompt", "Findings land in a Google Sheet, one row per issue", "A Google Docs template turns the sheet into the report", "You skim it, then Resend emails it", "Day 30: automatic re-scan offer for monitoring"],
  },
  {
    id: "watchdog", reel: "WATCHDOG", kind: "software", fits: ["leak", "risk"],
    names: ["{N} Watchdog", "{N} Radar", "{N} Tripwire"],
    pitch: "Watches {poss} {data} around the clock and texts them the moment there's a sign of {find}.",
    pay: (b) => ({ rec: b.rec * 2 }), offer: "free first scan, then {rec}/month",
    mvp: ["landing page", "connect form", "daily automated check", "alert email"], nocode: ["Carrd page", "Tally upload form", "a weekly check you run in Claude", "a Gmail template"],
    first: "run 5 free scans for {label} in {hang} and send each one their report", free: "free scan",
    build: 3, cost: 2, auto: 5, clar: 4, fcd: 0,
    why: { build: "A daily job, a data connection and an alert. The connection is the hard part.", auto: "Once connected it runs every day without you.", clar: "A monthly fee for peace of mind is an easy yes." },
    bullets: ["Connect once, then forget about it", "Alerts the day something goes wrong, not a year later", "A monthly report of everything it caught"],
    cta: "Start my free scan",
    sys: "INTELLIGENT AUTOMATION: {N} MONITORING INFRASTRUCTURE", x: "always-on {nn} monitoring", tier: "CUSTOM MONITORING SAAS", t1: "Free first scan", t2: "{rec}/month monitoring",
    deliver: ["Daily monitoring of {data}", "Instant alerts by email or text", "A monthly report of what it caught"],
    stack: [["Front end", "Static page on Netlify"], ["Backend", "Supabase (auth, Postgres, Edge Functions)"], ["Schedule", "Supabase cron or n8n"], ["Intelligence", "Claude API"], ["Payments", "Stripe Billing"], ["Alerts", "Resend email + Twilio SMS"]],
    flow: ["Customer subscribes (Stripe Checkout)", "They connect or upload {data}", "A daily scheduled job pulls anything new", "Claude checks it against your rules for {find}", "Anything flagged becomes an email or SMS with the fix", "Everything is logged for the monthly report"],
  },
  {
    id: "ghostwriter", reel: "GHOSTWRITER", kind: "service", fits: ["content"],
    names: ["{N} Ghostwriter", "The {N} Ghost Desk", "{N} Ghost Studio"],
    pitch: "For {label}: we {task} in their voice, and they just hit approve.",
    pay: (b) => ({ rec: b.one * 5 }), offer: "{rec}/month, done for you",
    mvp: ["sample page", "voice intake form", "Claude draft + your edit"],
    first: "write 3 free samples for {label} you find in {hang}, then pitch the monthly plan", free: "free sample batch",
    build: 1, cost: 1, auto: 3, clar: 5, fcd: -1,
    why: { build: "A Google Doc of samples and an intake form. That's the product.", auto: "Claude drafts and you edit. Your taste is the moat.", clar: "A monthly retainer with fixed deliverables. Zero confusion." },
    bullets: ["Written in their voice, not a robot's", "Delivered on a fixed schedule", "Edits until it sounds exactly like them"],
    cta: "Get 3 free samples",
    sys: "SYSTEMS INFRASTRUCTURE: {N} PRODUCTION DESK", x: "a done-for-you {nn} production desk", tier: "DONE-FOR-YOU STUDIO", t1: "3 free samples", t2: "{rec}/month, done for you",
    deliver: ["We {task}, every week", "A voice guide built from their best past work", "One revision round per piece"],
    stack: [["Page", "Carrd or Notion"], ["Intake", "Tally"], ["Payments", "Stripe subscription link"], ["Intelligence", "Claude with a saved voice guide"], ["Workspace", "Google Docs"], ["Scheduling", "Buffer or native schedulers"]],
    flow: ["Stripe subscription starts the month", "Tally intake captures tone, examples and topics", "Claude drafts from the voice guide and {data}", "You edit in Google Docs (10 minutes a piece)", "Client approves in the doc", "Published or handed over on schedule"],
  },
  {
    id: "agent", reel: "AGENT", kind: "software", fits: ["time", "growth", "leak"],
    names: ["{N} Autopilot", "{N} Agent", "{N} Butler"],
    pitch: "An automation agent for {label} that can {task}, so they {result}.",
    pay: (b) => ({ rec: b.rec * 3 }), offer: "{rec}/month, setup included",
    mvp: ["landing page", "one working agent flow", "Stripe checkout"], nocode: ["Carrd page", "a Make scenario with one prompt", "Stripe Payment Link"],
    first: "record a 60-second demo of the agent doing the job and post it in {hang}", free: "free 14-day pilot",
    build: 3, cost: 2, auto: 5, clar: 3, fcd: 0,
    why: { build: "One narrow agent with tools and guardrails. Keep it to one job.", auto: "The agent does the job end to end; you read the logs.", clar: "Monthly pricing works, but buyers need to see it working first." },
    bullets: ["Does the job while they sleep", "Asks before doing anything risky", "A weekly log of everything it did"],
    cta: "Start the free pilot",
    sys: "INTELLIGENT AUTOMATION: {N} AGENT INFRASTRUCTURE", x: "an autonomous {nn} agent", tier: "CUSTOM AGENT STACK", t1: "Free 14-day pilot", t2: "{rec}/month, setup included",
    deliver: ["A configured automation agent that handles it: {task}", "Human approval for anything risky", "A weekly activity log"],
    stack: [["Front end", "Static page on Netlify"], ["Agent", "Claude API with tool use"], ["Orchestration", "n8n (self-hosted or cloud)"], ["Data", "Supabase Postgres"], ["Payments", "Stripe Checkout"], ["Email", "Resend"]],
    flow: ["Trigger: new {data} arrives (email, form or webhook)", "n8n hands it to a Claude agent with the right tools", "The agent drafts the action; risky ones wait for approval", "Approved actions run (email, update, booking)", "Everything is logged to a sheet", "A weekly summary goes to the customer"],
  },
  {
    id: "concierge", reel: "CONCIERGE", kind: "service", fits: ["time", "leak", "risk", "content"],
    names: ["{N} Concierge", "The {N} Fixers", "Done-For-You {N}"],
    pitch: "Done-for-you for {label}: we {task}, so they {result}.",
    pay: (b) => ({ one: b.one * 2, rec: b.one * 4 }), offer: "{one} first job, then {rec}/month",
    mvp: ["one-page site", "booking form", "you + Claude doing the work"],
    first: "offer the first 3 {label} in {hang} a free first job in exchange for a testimonial", free: "free first job",
    build: 1, cost: 1, auto: 2, clar: 5, fcd: -1,
    why: { build: "A form and your time. Nothing to build.", auto: "It's you doing the work, sped up by automation. Systemise it later.", clar: "They pay you to make the problem disappear. The clearest sale there is." },
    bullets: ["They hand it over, you handle it", "Turned around in 48 hours", "One flat price, no surprises"],
    cta: "Book my first job",
    sys: "SYSTEMS INFRASTRUCTURE: DONE-FOR-YOU {N} OPERATIONS", x: "done-for-you {nn} operations", tier: "DONE-FOR-YOU SERVICE", t1: "{one} first job", t2: "{rec}/month for every job after that",
    deliver: ["We handle it for them: {task}", "Delivered within 48 hours", "A short summary of what was done"],
    stack: [["Page", "Carrd"], ["Booking", "Tally or Cal.com"], ["Payments", "Stripe Payment Links"], ["Intelligence", "Claude as your assistant"], ["Ops", "Google Sheets job log"]],
    flow: ["Customer books and pays (Stripe Payment Link)", "Tally form collects {data}", "You do the job with Claude as your assistant", "The deliverable goes out from a template", "A follow-up email offers the monthly plan", "Every job is logged: this becomes your SOP"],
  },
  {
    id: "kit", reel: "TEMPLATE KIT", kind: "product", fits: ["content", "time", "growth", "skill"],
    names: ["The {N} Kit", "{N} Toolkit", "The {N} Starter Pack"],
    pitch: "{n} plug-and-play templates that help {label} {task}, without starting from a blank page.",
    pay: (b) => ({ one: b.kit * 1.5 }), offer: "{one}, one-off",
    mvp: ["Gumroad page", "{n} templates", "a one-page quick-start"],
    first: "give away 1 template free in {hang}, with the full kit linked underneath", free: "free template",
    build: 1, cost: 1, auto: 5, clar: 4, fcd: 0,
    why: { build: "A weekend making templates you would use yourself.", auto: "Gumroad sells and delivers it while you sleep.", clar: "One price, instant download, obvious value." },
    bullets: ["{n} ready-to-use templates", "Works in Google Docs, Sheets and Notion", "Fill in the blanks, done in minutes"],
    cta: "Get the kit ({one})",
    sys: "DIGITAL ASSET: {N} TEMPLATE SYSTEM", x: "a plug-and-play {nn} template system", tier: "GUMROAD TEMPLATE KIT", t1: "{one} kit, one-off", t2: "{club}/month: new templates every month",
    deliver: ["{n} templates to {task}", "A quick-start guide", "Free updates"],
    stack: [["Storefront", "Gumroad"], ["Templates", "Google Docs, Sheets or Notion"], ["Design", "Canva"], ["Intelligence", "Claude for first drafts"], ["Email", "Gumroad workflows"]],
    flow: ["Buyer pays on Gumroad", "Gumroad delivers the files instantly", "Gumroad workflow emails tips on day 1, 3 and 7", "Day 7: an upsell to the done-for-you version", "Ratings collected on Gumroad"],
  },
  {
    id: "playbook", reel: "PLAYBOOK", kind: "product", fits: ["skill", "growth", "risk", "mind"],
    names: ["The {N} Playbook", "The {N} Field Manual", "The {N} Bible"],
    pitch: "The step-by-step playbook for {label} who want to {result}.",
    pay: (b) => ({ one: b.kit }), offer: "{one} PDF",
    mvp: ["Gumroad page", "30-page PDF", "one worked example"],
    first: "post the table of contents as a thread in {hang} and presell at half price", free: "free chapter",
    build: 1, cost: 1, auto: 5, clar: 3, fcd: 0,
    why: { build: "Write what you know and format it once.", auto: "It sells and delivers itself on Gumroad.", clar: "Info products sell on the promise, so the title has to do the work." },
    bullets: ["The exact steps, in order", "Real examples, not theory", "Read it tonight, use it tomorrow"],
    cta: "Get the playbook ({one})",
    sys: "DIGITAL ASSET: {N} OPERATING MANUAL", x: "the {nn} operating manual", tier: "DESIGNED PDF PLAYBOOK", t1: "{one} playbook", t2: "{club}/month: new chapters, templates and a monthly Q&A",
    deliver: ["A 30-page PDF playbook", "A worked example for {label}", "Checklists to copy"],
    stack: [["Storefront", "Gumroad"], ["Writing", "Google Docs"], ["Layout", "Canva or Typst"], ["Intelligence", "Claude as editor"], ["Email", "Gumroad workflows"]],
    flow: ["Buyer pays on Gumroad", "The PDF is delivered instantly", "Day 2 email: \"did you try step 1?\"", "Day 5 email: upsell to the kit or course", "Reader questions feed the next edition"],
  },
  {
    id: "course", reel: "COURSE", kind: "product", fits: ["skill", "growth"],
    names: ["{N} Bootcamp", "{N} School", "The 14-Day {N} Sprint"],
    pitch: "A 14-day sprint that teaches {label} how to {result}.",
    pay: (b) => ({ one: b.kit * 4 }), offer: "{one} per cohort seat",
    mvp: ["presale page", "5 lessons recorded on Loom", "a private chat group"],
    first: "presell 10 founding seats in {hang} before recording anything", free: "free first lesson",
    build: 2, cost: 1, auto: 4, clar: 3, fcd: 1,
    why: { build: "Five Looms and a group chat. Record after the presale.", auto: "Evergreen after the first cohort.", clar: "Courses sell on outcomes. Prove one first." },
    bullets: ["14 days, one outcome", "Short lessons you can do on a phone", "A live Q&A every week"],
    cta: "Claim a founding seat ({one})",
    sys: "KNOWLEDGE INFRASTRUCTURE: {N} TRAINING SYSTEM", x: "a 14-day {nn} training sprint", tier: "COHORT COURSE", t1: "{one} founding seat", t2: "{club}/month alumni membership: new lessons and live calls",
    deliver: ["5 video lessons", "Templates for every lesson", "2 live Q&A calls", "A private group"],
    stack: [["Sales", "Gumroad or Stripe"], ["Lessons", "Loom"], ["Community", "Discord or Circle"], ["Email", "Kit (ConvertKit)"], ["Calls", "Zoom"]],
    flow: ["Presale on Gumroad or Stripe", "Buyers are added to the group automatically", "Lessons drip daily by email", "A weekly live call, recorded", "Day 14: testimonial form and an upsell to the next level"],
  },
  {
    id: "prompts", reel: "PROMPT PACK", kind: "product", fits: ["content", "time", "skill"],
    names: ["The {N} Prompt Vault", "{N} Prompt Pack", "The {N} Prompt Bible"],
    pitch: "{n} tested prompts that help {label} {task}.",
    pay: (b) => ({ one: b.kit * 0.8 }), offer: "{one}, one-off",
    mvp: ["Gumroad page", "{n} tested prompts", "example outputs"],
    first: "post 3 prompts free in {hang} with the outputs, and sell the rest", free: "free prompt sample",
    build: 1, cost: 1, auto: 5, clar: 3, fcd: 0,
    why: { build: "An afternoon of testing prompts on real examples.", auto: "A digital download with zero delivery work.", clar: "Cheap and impulsive, but prompts are a crowded shelf." },
    bullets: ["{n} prompts tested on real examples", "Works in ChatGPT, Claude and Gemini", "Copy, paste, fill in the brackets"],
    cta: "Get the prompts ({one})",
    sys: "DIGITAL ASSET: {N} PROMPT LIBRARY", x: "a tested {nn} prompt library", tier: "PROMPT LIBRARY", t1: "{one} prompt pack, one-off", t2: "{club}/month: new tested prompts every month",
    deliver: ["{n} prompts to {task}", "Example outputs", "A guide to adapting them"],
    stack: [["Storefront", "Gumroad"], ["Format", "Notion page or PDF"], ["Testing", "Claude and ChatGPT"], ["Email", "Gumroad workflows"]],
    flow: ["Gumroad sale", "Notion page or PDF delivered instantly", "Day 3: a bonus prompt by email", "Day 7: upsell to the kit or done-for-you version"],
  },
  {
    id: "calculator", reel: "CALCULATOR", kind: "product", fits: ["leak", "growth", "skill"],
    names: ["The {N} Calculator", "The {N} Score", "{N} Reality Check"],
    pitch: "A free calculator that shows {label} the yearly cost of {thing}, then sells the fix.",
    pay: (b) => ({ one: b.one }), offer: "free calculator, then a {one} full report",
    mvp: ["single-page calculator", "email gate", "PDF report"],
    first: "share the free calculator in {hang} and sell the full report to anyone who scores badly", free: "free calculator",
    build: 2, cost: 1, auto: 5, clar: 2, fcd: -1,
    why: { build: "One page of JavaScript and a report template.", auto: "Traffic in, reports out, no humans.", clar: "Free tools get traffic. Turning it into money is the hard part." },
    bullets: ["Takes 60 seconds", "Shows the number in ¤", "A personalised fix list in the full report"],
    cta: "Calculate mine (free)",
    sys: "INTELLIGENT AUTOMATION: {N} DIAGNOSTIC ENGINE", x: "a 60-second {nn} diagnostic", tier: "CUSTOM CALCULATOR", t1: "Free calculator, then a {one} full report", t2: "{club}/month: re-scored every month, with alerts",
    deliver: ["A personalised full report", "Benchmarks against similar {label}", "A ranked fix list"],
    stack: [["Calculator", "Static page on Netlify"], ["Email gate", "Kit (ConvertKit) form"], ["Payments", "Stripe Payment Link"], ["Report", "Make + Claude API + Google Docs template"]],
    flow: ["Visitor runs the calculator (static page)", "Email gate for the detailed breakdown", "Stripe Payment Link for the full report", "Make and the Claude API write the personalised report", "Everyone who scored badly gets a short email sequence"],
  },
  {
    id: "audit", reel: "X-RAY AUDIT", kind: "service", fits: ["growth", "risk", "leak"],
    names: ["{N} X-Ray", "{N} Health Check", "The {N} Audit"],
    pitch: "A done-for-you audit that scores {poss} {data} against 25 checks and shows exactly how to {result}.",
    pay: (b) => ({ one: b.one * 2 }), offer: "{one} audit, credited against the fix",
    mvp: ["landing page", "intake form", "auto-scored report"], nocode: ["Carrd page", "Tally form", "you + a 25-point checklist"],
    first: "audit 5 {label} from {hang} for free (with permission) and post the anonymised fixes", free: "free mini-audit",
    build: 2, cost: 1, auto: 4, clar: 4, fcd: -1,
    why: { build: "A 25-point checklist, an intake form and a scoring prompt.", auto: "The model scores against the checklist; you add the human read.", clar: "A fixed-price audit is easy to buy and leads straight to the fix." },
    bullets: ["A 25-point check of {data}", "Every issue priced in ¤", "A fix list you can do yourself, or we do it"],
    cta: "Book my audit ({one})",
    sys: "SYSTEMS INFRASTRUCTURE: {N} AUDIT PROTOCOL", x: "a 25-point {nn} audit protocol", tier: "SCORED AUDIT PIPELINE", t1: "{one} audit, credited against the fix", t2: "{care}/month: a monthly re-check and the fixes",
    deliver: ["A 25-point audit report", "Issues ranked by the money at stake", "A 30-minute walkthrough call"],
    stack: [["Page", "Carrd"], ["Intake", "Tally"], ["Payments", "Stripe Payment Links"], ["Scoring", "Claude API + your 25-point checklist"], ["Report", "Google Docs template + Loom"]],
    flow: ["Stripe Payment Link", "Tally intake plus {data}", "Claude scores it against your 25-point checklist", "You review it and add 3 human insights", "Report and Loom walkthrough sent", "Upsell: \"want us to fix it?\""],
  },
  {
    id: "directory", reel: "DIRECTORY", kind: "product", needs: "supply",
    names: ["The {N} Index", "The {N} Atlas", "The {N} List"],
    pitch: "The curated, always-current directory of {supply} for {label}.",
    pay: (b) => ({ one: b.kit, rec: b.rec * 3 }), offer: "{one} lifetime access (suppliers pay {rec}/month to be featured)",
    mvp: ["one-page site", "Airtable of 50 entries", "submission form"],
    first: "list 50 {supply} yourself and post the free top 10 in {hang}", free: "free top-10 list",
    build: 2, cost: 1, auto: 3, clar: 3, fcd: 0,
    why: { build: "A spreadsheet with a nice front end.", auto: "It needs a monthly refresh; automation can do the first pass.", clar: "Two ways to charge (access or listings). Pick one." },
    bullets: ["Every entry checked by a human", "Updated monthly", "Filtered by what {label} actually care about"],
    cta: "Get lifetime access ({one})",
    sys: "DATA INFRASTRUCTURE: {N} INDEX", prop: "A curated, always-current index of {supply}, for {who}.", x: "a curated {nn} index", tier: "SOFTR DIRECTORY", t1: "{one} lifetime access", t2: "Suppliers pay {rec}/month to be featured",
    deliver: ["Access to the full directory", "Monthly updates", "New-entry alerts"],
    stack: [["Data", "Airtable or Google Sheets"], ["Front end", "Softr or a static page"], ["Payments", "Gumroad or Stripe"], ["Refresh", "Claude-assisted monthly re-check"]],
    flow: ["Entries live in Airtable", "Softr or a static page renders them", "Gumroad or Stripe unlocks the full list", "Monthly: Claude-assisted re-check of every entry", "Suppliers pay to be featured"],
  },
  {
    id: "marketplace", reel: "MARKETPLACE", kind: "software", needs: "supply",
    names: ["The {N} Exchange", "{N} Match", "The {N} Market"],
    pitch: "Matches {label} with {supply}, and only gets paid when it works.",
    pay: () => ({ take: 12 }), offer: "a {take}% cut of every successful match",
    mvp: ["landing page", "two intake forms", "manual matching"],
    first: "hand-match the first 5 pairs from {hang} over DM before building anything", free: "free first match",
    build: 4, cost: 2, auto: 3, clar: 3, fcd: 1,
    why: { build: "Two-sided products are hard. Start with forms and your inbox.", auto: "Matching can be automated once you know what a good match looks like.", clar: "Take rates are clear. Collecting them without being bypassed is not." },
    bullets: ["Only pay when it works", "Every match vetted by a human", "Matched within 48 hours"],
    cta: "Get matched",
    sys: "SYSTEMS INFRASTRUCTURE: {N} MATCHING ENGINE", prop: "A pay-on-success marketplace of {supply}, for {who}.", x: "a pay-on-success {nn} marketplace", tier: "CUSTOM MARKETPLACE", t1: "Free to join, for both sides", t2: "{take}% of every completed match, plus {feature}/month for featured placement",
    deliver: ["A vetted match", "Introductions handled", "Payment protection"],
    stack: [["Forms", "Tally (one per side)"], ["Data", "Airtable"], ["Matching", "Claude ranks candidates, you approve"], ["Payments", "Stripe Connect"], ["Email", "Resend"]],
    flow: ["Two Tally forms (demand and supply) feed one Airtable base", "Claude ranks candidate matches", "You approve and send the intros", "Stripe Connect takes the fee on completion", "Both sides rate the match"],
  },
  {
    id: "newsletter", reel: "NEWSLETTER", kind: "product", fits: ["skill", "growth", "mind"],
    names: ["{N} Weekly", "The {N} Brief", "{N} Signal"],
    pitch: "A 5-minute weekly briefing that helps {label} {result}.",
    pay: (b) => ({ rec: Math.min(Math.max(b.rec, 5), 29) }), offer: "free weekly issue, {rec}/month paid tier, plus sponsors",
    mvp: ["beehiiv or Substack page", "issue #1", "referral link"],
    first: "publish issue #1 in {hang} and ask for the first 100 signups", free: "free issue",
    build: 1, cost: 1, auto: 3, clar: 2, fcd: 0,
    why: { build: "Issue #1 is the MVP.", auto: "Automation gathers and drafts; you add the take.", clar: "Audience first, money later. Sponsors show up around 1,000 readers." },
    bullets: ["5 minutes a week", "Only what moves the needle for {label}", "Free, with a paid deep-dive tier"],
    cta: "Get the next issue",
    sys: "MEDIA INFRASTRUCTURE: {N} BRIEFING", x: "a 5-minute weekly {nn} briefing", tier: "BEEHIIV NEWSLETTER", t1: "Free weekly issue", t2: "{rec}/month paid tier, plus sponsors",
    deliver: ["A weekly briefing", "Paid tier: deep dives and templates", "Full archive access"],
    stack: [["Platform", "beehiiv or Substack"], ["Sources", "RSS, Google Alerts, Reddit"], ["Pipeline", "n8n + Claude summaries"], ["Growth", "beehiiv referral programme"]],
    flow: ["RSS, alerts and Reddit feeds flow into n8n", "Claude summarises and ranks the week's items", "You write the take (20 minutes)", "beehiiv schedules the send", "The referral programme rewards shares"],
  },
  {
    id: "chatbot", reel: "CHATBOT", kind: "software", fits: ["time", "skill"],
    names: ["{N} Bot", "Ask {N}", "The {N} Oracle"],
    pitch: "An always-on assistant, trained on their own documents, that helps {label} {task}.",
    pay: (b) => ({ setup: b.setup, rec: b.rec * 2 }), offer: "{setup} setup + {rec}/month",
    mvp: ["chat widget", "knowledge base from their docs", "handoff to email"], nocode: ["a shared Claude project", "their docs as a knowledge base", "handoff to email"],
    first: "build a free demo bot on public info for one of the {label} in {hang}, then show it to 10 more", free: "free demo bot",
    build: 3, cost: 2, auto: 5, clar: 4, fcd: 0,
    why: { build: "A widget, a knowledge base and a fallback. Retrieval quality is the real work.", auto: "Answers around the clock; humans only get the hard ones.", clar: "Setup fee plus monthly care is a model buyers already know." },
    bullets: ["Answers 24/7 in their voice", "Trained only on their own documents", "Hands tricky questions to a human"],
    cta: "Get my free demo bot",
    sys: "INTELLIGENT AUTOMATION: {N} ASSISTANT INFRASTRUCTURE", x: "a 24/7 {nn} assistant, trained on their own documents,", tier: "CUSTOM CHATBOT", t1: "{setup} setup", t2: "{rec}/month care and retraining",
    deliver: ["A custom assistant trained on their documents", "Embedded on their site or WhatsApp", "Monthly retraining and a report"],
    stack: [["Widget", "Static embed script"], ["Knowledge", "Supabase pgvector or a Claude project"], ["Intelligence", "Claude API"], ["Channels", "Website + WhatsApp via Twilio"], ["Payments", "Stripe"]],
    flow: ["Collect their docs, FAQs and past messages", "Load them into a knowledge base", "Chat widget on their site, or WhatsApp via Twilio", "Anything it can't answer is emailed to a human", "Monthly: review transcripts and add answers"],
  },
  {
    id: "api", reel: "API", kind: "software", fits: ["leak", "risk"], minWallet: 2, noGentle: true,
    names: ["{N} API", "The {N} Engine", "{N}-as-a-Service"],
    pitch: "An API that takes {data} and flags {find} in seconds, sold to the software {label} already use.",
    pay: (b) => ({ usage: b.rec * 3 }), offer: "first 1,000 calls free, then {usage}/month for 10,000",
    mvp: ["one endpoint", "API key page", "usage billing"], nocode: ["a Make webhook", "an API key in a Google Sheet", "prepaid credit packs"],
    first: "post the endpoint with a curl example in {hang} and give the first 1,000 calls away", free: "free API trial",
    build: 4, cost: 2, auto: 5, clar: 3, fcd: 1,
    why: { build: "Auth, metering, a strict JSON schema and docs. Small surface, high polish.", auto: "Pure software; it runs while you sleep.", clar: "Usage pricing is fair but harder to forecast for buyers." },
    bullets: ["One endpoint: JSON in, JSON out", "Built for software that serves {label}", "Pay only for what you use"],
    cta: "Get an API key",
    sys: "SYSTEMS INFRASTRUCTURE: {N} API", x: "a {nn} analysis API", tier: "CUSTOM API", t1: "First 1,000 calls free", t2: "{usage}/month for 10,000 calls",
    deliver: ["API access", "Docs and examples", "A usage dashboard"],
    stack: [["Edge", "Supabase Edge Function or Cloudflare Worker"], ["Auth", "API keys in Postgres"], ["Intelligence", "Claude API with a strict JSON schema"], ["Billing", "Stripe metered billing"], ["Docs", "A single static page"]],
    flow: ["A request hits the edge function", "The key is checked and usage metered", "Claude analyses {data} against a strict JSON schema", "The response is cached", "Stripe bills metered usage monthly"],
  },
  {
    id: "saas", reel: "MICRO-SAAS", kind: "software", fits: ["time", "leak", "growth"],
    names: ["{N} HQ", "{N} OS", "{N} Pilot"],
    pitch: "The simplest tool for {label} to {task}, so they {result}.",
    pay: (b) => ({ rec: b.rec * 2 }), offer: "{rec}/month with a 14-day free trial",
    mvp: ["landing page", "one core screen", "Stripe subscription"], nocode: ["Carrd page", "a Glide app on a Google Sheet", "Stripe Payment Link"],
    first: "build a waitlist from {hang} with a 30-second screen recording, then charge the first 10", free: "free trial",
    build: 4, cost: 2, auto: 5, clar: 4, fcd: 0,
    why: { build: "Auth, one core screen and billing. Two weeks if you keep it to one job.", auto: "It's software. It runs without you.", clar: "A monthly subscription for a weekly pain is the cleanest model there is." },
    bullets: ["Does one job, properly", "Set up in five minutes", "Cancel any time"],
    cta: "Start the free trial",
    sys: "SYSTEMS INFRASTRUCTURE: {N} SOFTWARE", x: "single-purpose {nn} software", tier: "CUSTOM SAAS", t1: "14-day free trial", t2: "{rec}/month",
    deliver: ["Access to the tool", "An onboarding call", "Priority support"],
    stack: [["Front end", "Static HTML/JS on Netlify"], ["Backend", "Supabase (auth, Postgres, Edge Functions)"], ["Intelligence", "Claude API"], ["Payments", "Stripe Billing"], ["Email", "Resend"]],
    flow: ["Sign-up starts a Stripe trial", "An onboarding email sequence walks them through setup", "The core feature does the job, with the Claude API doing the heavy lifting", "A weekly usage digest by email", "A churn alert fires when usage drops"],
  },
  {
    id: "extension", reel: "EXTENSION", kind: "software", fits: ["time", "content"], noGentle: true,
    names: ["{N} Lens", "{N} Clip", "The {N} Button"],
    pitch: "A browser extension that lets {label} {task} in one click, right where they already work.",
    pay: (b) => ({ rec: Math.max(5, b.rec) }), offer: "free, then {rec}/month for the power features",
    mvp: ["Chrome extension", "one-click action", "license key check"], nocode: ["a bookmarklet", "one-click action", "a Gumroad license key"],
    first: "ship it free to 50 users from {hang} and paywall the feature they use most", free: "free version",
    build: 3, cost: 1, auto: 5, clar: 3, fcd: 0,
    why: { build: "One content script and one API call. The store review is the slow part.", auto: "Installs itself and runs where they already work.", clar: "Freemium works, but the paywall has to sit on the right feature." },
    bullets: ["Works inside the tools they already use", "One click, no copy-paste", "Free to start"],
    cta: "Add to Chrome (free)",
    sys: "INTELLIGENT AUTOMATION: {N} BROWSER LAYER", x: "one-click {nn} automation inside the browser", tier: "CHROME EXTENSION", t1: "Free version", t2: "{rec}/month for the power features",
    deliver: ["The extension", "Power features unlocked", "Updates as platforms change"],
    stack: [["Extension", "Chrome Manifest V3"], ["API", "Supabase Edge Function"], ["Intelligence", "Claude API"], ["Licensing", "Gumroad or Lemon Squeezy keys"]],
    flow: ["The extension reads the page they're on", "One click sends it to your API, where Claude does the work", "The result is injected back into the page", "A license check unlocks the power features", "Usage counts decide where the paywall sits"],
  },
  {
    id: "workflow", reel: "AUTOMATION", kind: "service", fits: ["time", "growth", "leak"],
    names: ["The {N} Machine", "{N} Pipeline", "The {N} Install"],
    pitch: "We install an automation that lets {label} {task} on autopilot, set up in a day.",
    pay: (b) => ({ setup: b.setup * 2, rec: b.rec * 2 }), offer: "{setup} install + {rec}/month care plan",
    mvp: ["scoping call", "Make or n8n scenario", "Loom handover"],
    first: "install it free for one of the {label} in {hang}, then post the before/after", free: "free install",
    build: 2, cost: 1, auto: 4, clar: 5, fcd: 0,
    why: { build: "Build it once in n8n, then clone it for every client.", auto: "Once installed it runs itself; the care plan covers maintenance.", clar: "Setup fee plus care plan. Buyers understand it instantly." },
    bullets: ["Installed in one day", "Runs on tools they already use", "Maintained every month"],
    cta: "Book my install",
    sys: "INTELLIGENT AUTOMATION: {N} INFRASTRUCTURE", x: "installed {nn} automation infrastructure", tier: "CUSTOM N8N INSTALL", t1: "{setup} install", t2: "{rec}/month care plan",
    deliver: ["A custom automation to {task}", "A Loom walkthrough", "Monthly monitoring and fixes"],
    stack: [["Automation", "n8n or Make"], ["Intelligence", "Claude API step for judgement calls"], ["Data", "Their existing tools + Google Sheets"], ["Payments", "Stripe invoice + subscription"], ["Handover", "Loom"]],
    flow: ["Scoping form, then a 20-minute call", "Clone your master n8n template", "Connect their tools", "A Claude step handles the judgement calls", "Test on 3 real examples", "Loom handover; the care plan starts"],
  },
  {
    id: "community", reel: "PRIVATE CLUB", kind: "product", fits: ["mind", "skill", "growth"],
    names: ["The {N} Club", "The {N} Syndicate", "The {N} Room"],
    pitch: "A private club where {label} {result}, together.",
    pay: (b) => ({ rec: b.rec * 2 }), offer: "{rec}/month membership",
    mvp: ["Discord or Circle space", "weekly call", "onboarding checklist"], nocode: ["a WhatsApp group", "weekly call", "a pinned checklist"],
    first: "invite 20 {label} from {hang} to a free founding month", free: "free founding month",
    build: 1, cost: 1, auto: 2, clar: 3, fcd: 0,
    why: { build: "A chat space and a calendar invite.", auto: "Communities need a host. That's you.", clar: "Monthly membership is clear, but churn follows the energy." },
    bullets: ["A weekly live session", "Templates and teardown threads", "People who get it"],
    cta: "Join the club",
    sys: "NETWORK INFRASTRUCTURE: {N} MEMBERS' CLUB", x: "a private {nn} members' club", tier: "CIRCLE COMMUNITY", t1: "Free founding month", t2: "{rec}/month membership",
    deliver: ["Private community access", "A weekly live call", "A resource library"],
    stack: [["Space", "Discord or Circle"], ["Payments", "Stripe subscription"], ["Access", "Automatic invites on payment"], ["Calls", "Zoom or Discord stage"]],
    flow: ["Stripe subscription triggers an automatic invite", "A welcome DM with the onboarding checklist", "A weekly call invite", "A monthly wins thread that doubles as testimonials", "A churn survey on cancel"],
  },
  {
    id: "printables", reel: "PRINT SHOP", kind: "product", needs: "merch",
    names: ["The {N} Print Shop", "{N} Wall Art", "The {N} Merch Drop"],
    pitch: "Print-on-demand {merch} for {label}: zero inventory, pure margin.",
    pay: (b) => ({ one: b.kit * 1.3 }), offer: "{one} per item, printed on demand",
    mvp: ["Etsy or Gumroad listing", "10 designs", "print-on-demand connection"],
    first: "post 5 designs in {hang} and let the votes pick which ones you list", free: "free phone wallpaper",
    build: 1, cost: 1, auto: 5, clar: 3, fcd: 0,
    why: { build: "Ten designs and a print-on-demand connection.", auto: "The supplier prints and ships every order.", clar: "Clear per-item pricing, but margins are thin until you have volume." },
    bullets: ["Designed for {label}", "Printed on demand, shipped worldwide", "Limited drops every month"],
    cta: "Shop the drop",
    sys: "DIGITAL ASSET: {N} PRINT-ON-DEMAND LINE", x: "print-on-demand {merch}", tier: "PRINT-ON-DEMAND STORE", t1: "{one} per item, printed on demand", t2: "{club}/month: a new design drop every month",
    deliver: ["Printed and shipped on demand", "Tracked delivery", "New drops every month"],
    stack: [["Store", "Etsy or Shopify"], ["Printing", "Printful or Printify"], ["Design", "Canva + generated drafts, hand-finished"], ["Email", "Kit (ConvertKit)"]],
    flow: ["Designs drafted with an image model, then finished by hand", "Printful or Printify connected to the store", "Each order is printed and shipped by the supplier", "A review request email after delivery", "Best-sellers get new variants"],
  },
  {
    id: "refill", reel: "SUBSCRIPTION", kind: "service", stealOnly: true,
    names: ["The {N} Club", "{N} Refill", "Never Out Of {N}"],
    pitch: "",
    pay: (b) => ({ rec: b.rec * 3 }), offer: "{rec}/month, refilled automatically",
    mvp: ["subscription page", "one supplier", "you packing the first boxes"],
    first: "presell 20 subscriptions in {hang} before ordering any stock", free: "free first box",
    build: 2, cost: 3, auto: 3, clar: 5, fcd: 0,
    why: { build: "A subscription page and one supplier. Pack the first boxes yourself.", auto: "Dropship once volume justifies it.", clar: "Auto-refill of something they already buy is the clearest sale in retail." },
    bullets: ["Set it once, never run out", "Skip or pause any month", "Cheaper than buying it in a hurry"],
    cta: "Start my subscription",
    sys: "SYSTEMS INFRASTRUCTURE: {N} AUTO-REFILL", x: "an auto-refill {nn} subscription", tier: "SUBSCRIPTION STORE", t1: "Free first box", t2: "{rec}/month, refilled automatically",
    deliver: ["A monthly refill, sized to them", "Skip or pause any time", "Discreet packaging"],
    stack: [["Store", "Shopify subscriptions or Stripe"], ["Supply", "One wholesaler, then dropship"], ["Shipping", "Shippo or ShipStation"], ["Email", "Kit (ConvertKit)"]],
    flow: ["Stripe subscription", "The order sheet goes to the wholesaler (or you pack it)", "Shipping labels print automatically", "A monthly skip/pause email", "A churn survey on cancel"],
  },
];

export const NICHES = [
  {
    id: "freelancers", set: "core", label: "freelancers", reel: "FREELANCERS", q: "earning ¤30k+", wallet: 2, reach: 4, trust: 1,
    hang: ["r/freelance", "freelancer Facebook groups", "Indie Hackers"],
    sub: ["freelance video editors", "Upwork developers", "freelance copywriters", "freelance designers"],
    when: ["the fortnight before the tax deadline", "January, when the tax bill lands"], ally: "accountants who serve freelancers",
    pains: [
      { id: "receipt", type: "leak", reel: "DEDUCTIONS", noun: "Receipt", thing: "forgotten expenses, zombie subscriptions and missed deductions", task: "dig through receipts for deductions", result: "claw back ¤1,000+ a year", data: "bank exports and receipts" },
      { id: "invoice", type: "time", reel: "LATE INVOICES", noun: "Invoice", thing: "clients who pay 60 days late", task: "chase unpaid invoices", result: "get paid in days, not months", data: "invoices and client emails" },
      { id: "pipeline", type: "growth", reel: "DRY PIPELINE", noun: "Pipeline", thing: "feast-or-famine months", task: "line up the next client before this one ends", result: "book next month before this one ends", data: "portfolios and past client lists", supply: "clients who post real budgets" },
    ],
  },
  {
    id: "dentists", set: "core", label: "dental practices", reel: "DENTISTS", q: "with 3+ chairs", wallet: 3, reach: 2, trust: 2, local: true,
    hang: ["dental practice-owner Facebook groups", "Dentaltown", "practice-manager LinkedIn groups"],
    sub: ["orthodontists", "cosmetic dentists", "mixed private and insurance practices"],
    when: ["the January cancellation slump", "the week after a bad Google review"], ally: "dental supply reps",
    pains: [
      { id: "noshow", type: "leak", reel: "NO-SHOWS", noun: "No-Show", thing: "empty chairs from no-shows", task: "refill last-minute cancellations", result: "stop losing ¤500 a day to empty chairs", data: "appointment books" },
      { id: "reviews", type: "growth", reel: "REVIEWS", noun: "Review", thing: "a 4.1-star Google rating", task: "get happy patients to leave reviews", result: "overtake the practice down the road on Google", data: "Google reviews and patient lists" },
      { id: "recall", type: "leak", reel: "RECALLS", noun: "Recall", thing: "patients who never rebook their check-up", task: "chase overdue check-ups", result: "refill the book with patients they already have", data: "recall lists" },
    ],
  },
  {
    id: "airbnb", set: "core", label: "Airbnb hosts", reel: "AIRBNB HOSTS", q: "with 2–10 listings", wallet: 2, reach: 5, trust: 1,
    hang: ["r/airbnb_hosts", "Airbnb host Facebook groups", "BiggerPockets short-term rental forums"],
    sub: ["cabin hosts", "city-centre apartment hosts", "co-hosts managing other people's flats"],
    when: ["the month before peak season", "the day a 3-star review lands"], ally: "cleaning companies and property managers",
    pains: [
      { id: "listing", type: "content", reel: "LISTINGS", noun: "Listing", thing: "listings stuck on page 4", task: "rewrite listing titles and descriptions", result: "rank on page one in their area", data: "listing copy and photos" },
      { id: "turnover", type: "time", reel: "TURNOVERS", noun: "Turnover", thing: "cleaners who cancel on changeover day", task: "coordinate cleaners between guests", result: "never scramble for a cleaner again", data: "booking calendars", supply: "turnover cleaners who actually show up" },
      { id: "pricing", type: "leak", reel: "PRICING", noun: "Pricing", thing: "nights priced ¤40 under the market", task: "set nightly prices by hand", result: "add ¤3k a year per listing", data: "calendars and local comps" },
      { id: "guests", type: "time", reel: "GUEST DMS", noun: "Guest Message", thing: "the same 12 guest questions at 2am", task: "answer guest messages", result: "sleep through check-in night", data: "house manuals and past messages" },
    ],
  },
  {
    id: "landlords", set: "core", label: "small landlords", reel: "LANDLORDS", q: "with 3–20 units", wallet: 3, reach: 3, trust: 2,
    hang: ["BiggerPockets", "r/Landlord", "landlord association forums"],
    sub: ["student-let landlords", "HMO landlords", "accidental landlords"],
    when: ["lease-renewal season", "the week new rental rules drop"], ally: "letting agents and property accountants",
    pains: [
      { id: "certs", type: "risk", reel: "COMPLIANCE", noun: "Compliance", thing: "expired safety certificates and missed legal deadlines", task: "track certificates and legal deadlines", result: "never get fined for a missed certificate", data: "tenancy files" },
      { id: "arrears", type: "leak", reel: "LATE RENT", noun: "Rent", thing: "rent that arrives late or not at all", task: "chase late rent without the awkward calls", result: "collect rent on time every month", data: "rent ledgers and bank feeds" },
      { id: "repairs", type: "time", reel: "REPAIRS", noun: "Repair", thing: "11pm boiler texts", task: "triage tenant repair requests", result: "fix things before they turn into disputes", data: "tenant messages and repair history", supply: "tradespeople who actually show up" },
    ],
  },
  {
    id: "weddingphoto", set: "core", label: "wedding photographers", reel: "WEDDING PHOTOGS", q: "shooting 20+ weddings a year", wallet: 2, reach: 4, trust: 1,
    hang: ["wedding photographer Facebook groups", "r/WeddingPhotography", "photographer Discords"],
    sub: ["elopement photographers", "destination wedding photographers", "wedding videographers"],
    when: ["January–March booking season", "the week after a wedding fair"], ally: "wedding planners and venues",
    pains: [
      { id: "inquiry", type: "growth", reel: "INQUIRIES", noun: "Inquiry", thing: "inquiries that ghost after the price list", task: "reply to inquiries before the couple books someone else", result: "turn 1 in 3 inquiries into a booking", data: "inquiry emails and price guides" },
      { id: "culling", type: "time", reel: "CULLING", noun: "Culling", thing: "3,000 raw photos per wedding", task: "cull and sort wedding photos", result: "deliver galleries in days, not weeks", data: "RAW files" },
      { id: "venueblog", type: "content", reel: "VENUE SEO", noun: "Venue Blog", thing: "venue pages nobody finds", task: "write venue blog posts from each wedding", result: "rank for \"[venue] wedding photographer\"", data: "galleries and venue notes" },
    ],
  },
  {
    id: "trainers", set: "core", label: "personal trainers", reel: "PERSONAL TRAINERS", q: "with 10–40 clients", wallet: 2, reach: 4, trust: 1,
    hang: ["r/personaltraining", "PT Facebook groups", "fitness coach Discords"],
    sub: ["online coaches", "strength coaches", "pre- and postnatal trainers"],
    when: ["January", "the September back-to-routine spike"], ally: "physios and nutritionists",
    pains: [
      { id: "programs", type: "time", reel: "PROGRAMS", noun: "Program", thing: "Sunday nights spent writing programs", task: "write personalised training programs", result: "get Sunday nights back", data: "client notes and progress logs" },
      { id: "churn", type: "leak", reel: "CLIENT CHURN", noun: "Retention", thing: "clients who quietly quit in week 6", task: "spot clients who are about to quit", result: "keep clients six months longer", data: "check-ins and attendance logs" },
      { id: "wins", type: "content", reel: "CONTENT", noun: "Transformation", thing: "a feed full of stock motivation quotes", task: "turn client wins into posts", result: "get DMs from strangers who want to train", data: "client progress photos (with consent)" },
    ],
  },
  {
    id: "etsy", set: "core", label: "Etsy sellers", reel: "ETSY SELLERS", q: "doing 100+ orders a month", wallet: 1, reach: 5, trust: 1,
    hang: ["r/EtsySellers", "Etsy seller Facebook groups", "the Etsy community forums"],
    sub: ["digital-download sellers", "handmade jewellery sellers", "print-on-demand sellers"],
    when: ["the October run-up to Q4", "the week after an algorithm change"], ally: "packaging and print-on-demand suppliers",
    pains: [
      { id: "seo", type: "growth", reel: "ETSY SEO", noun: "Listing", thing: "listings buried on page 9", task: "rewrite titles and all 13 tags", result: "show up for the searches that buy", data: "listings and search terms" },
      { id: "fees", type: "leak", reel: "FEES", noun: "Fee", thing: "fees and ad spend eating the margin", find: "listings where fees and ad spend eat the whole margin", task: "work out real profit per listing", result: "kill the listings that lose money", data: "Etsy CSV exports" },
      { id: "messages", type: "time", reel: "BUYER MSGS", noun: "Buyer Message", thing: "where-is-my-order messages", task: "answer buyer messages", result: "keep a 5-star rating without living in the inbox", data: "order data and past messages" },
    ],
  },
  {
    id: "shopify", set: "core", label: "Shopify store owners", reel: "SHOPIFY STORES", q: "doing ¤10k+ a month", wallet: 3, reach: 4, trust: 1,
    hang: ["r/shopify", "r/ecommerce", "DTC founder Slack groups"],
    sub: ["supplement brands", "fashion boutiques", "pet brands"],
    when: ["Black Friday prep in September", "the month ad costs spike"], ally: "Shopify agencies and 3PLs",
    pains: [
      { id: "carts", type: "leak", reel: "ABANDONED CARTS", noun: "Cart", thing: "abandoned carts", task: "win back abandoned carts", result: "recover 10% of lost checkouts", data: "checkout and email data" },
      { id: "returns", type: "leak", reel: "RETURNS", noun: "Returns", thing: "returns that erase the margin", task: "find out why products come back", result: "cut returns by a third", data: "return reasons and reviews" },
      { id: "productcopy", type: "content", reel: "PRODUCT PAGES", noun: "Product Page", thing: "product pages copied from the supplier", task: "write product descriptions that sell", result: "lift conversion without more ad spend", data: "product catalogues" },
    ],
  },
  {
    id: "podcasters", set: "core", label: "podcasters", reel: "PODCASTERS", q: "with 500–5,000 downloads an episode", wallet: 1, reach: 4, trust: 1,
    hang: ["r/podcasting", "podcaster Facebook groups", "podcast creator Discords"],
    sub: ["interview podcasters", "true-crime podcasters", "B2B podcasters"],
    when: ["launch week", "the dreaded episode-20 slump"], ally: "podcast hosts and editors",
    pains: [
      { id: "clips", type: "content", reel: "CLIPS", noun: "Clip", thing: "episodes nobody clips", task: "cut episodes into vertical clips", result: "grow downloads from TikTok and Shorts", data: "episode audio and video" },
      { id: "guests", type: "growth", reel: "GUESTS", noun: "Guest", thing: "booking guests by cold email", task: "find and book great guests", result: "book a quarter of guests in one afternoon", data: "guest wishlists", supply: "guests who want to be booked" },
      { id: "sponsors", type: "leak", reel: "SPONSORS", noun: "Sponsor", thing: "a show with zero sponsors", find: "sponsors already buying ads on shows like theirs", task: "pitch sponsors that fit the audience", result: "land the first ¤500 sponsor", data: "audience stats and past episodes", supply: "brands that sponsor small shows" },
    ],
  },
  {
    id: "youtubers", set: "core", label: "YouTubers", reel: "YOUTUBERS", q: "with 10k–100k subscribers", wallet: 2, reach: 4, trust: 1,
    hang: ["r/NewTubers", "YouTube creator Discords", "creator-economy threads on X"],
    sub: ["gaming YouTubers", "finance YouTubers", "faceless channel owners"],
    when: ["the week the algorithm drops their views", "Q4 sponsorship budget season"], ally: "talent managers and editors",
    pains: [
      { id: "thumbnails", type: "growth", reel: "THUMBNAILS", noun: "Thumbnail", thing: "a 2% click-through rate", task: "test titles and thumbnails", result: "double click-through without new videos", data: "thumbnails and analytics" },
      { id: "scripts", type: "content", reel: "SCRIPTS", noun: "Script", thing: "blank-page script Mondays", task: "draft video scripts with hooks", result: "publish weekly without burning out", data: "past transcripts and top videos" },
      { id: "deals", type: "leak", reel: "SPONSOR DEALS", noun: "Sponsor Deal", thing: "sponsor deals priced by guessing", find: "sponsor deals priced below the going rate", task: "price and pitch sponsorships", result: "stop underpricing sponsors by half", data: "channel stats and past deals" },
    ],
  },
  {
    id: "realtors", set: "core", label: "estate agents", reel: "ESTATE AGENTS", q: "closing 10+ deals a year", wallet: 3, reach: 3, trust: 2,
    hang: ["estate agent Facebook groups", "r/realtors", "brokerage WhatsApp groups"],
    sub: ["luxury agents", "lettings agents", "first-time-buyer specialists"],
    when: ["spring listing season", "the week interest rates move"], ally: "mortgage brokers",
    pains: [
      { id: "copy", type: "content", reel: "LISTING COPY", noun: "Listing", thing: "listing descriptions that all say \"stunning\"", task: "write listing descriptions and social posts", result: "list faster and look more expensive", data: "property photos and specs" },
      { id: "leads", type: "growth", reel: "COLD LEADS", noun: "Lead", thing: "portal leads that go cold in five minutes", task: "reply to portal leads instantly", result: "book viewings while other agents sleep", data: "lead emails and CRM notes" },
      { id: "newsletter", type: "growth", reel: "PAST CLIENTS", noun: "Newsletter", thing: "a past-client list nobody has emailed since completion", task: "send past clients a monthly local-market newsletter", result: "win the repeat and referral listings", data: "past-client lists and local sales data" },
    ],
  },
  {
    id: "cafes", set: "core", label: "independent cafés", reel: "CAFÉS", q: "with 1–3 locations", wallet: 2, reach: 2, trust: 1, local: true,
    hang: ["local business Facebook groups", "café-owner forums", "hospitality WhatsApp groups"],
    sub: ["specialty coffee shops", "brunch spots", "bakery-cafés"],
    when: ["the January slump", "the week a chain opens nearby"], ally: "coffee roasters and wholesalers",
    pains: [
      { id: "waste", type: "leak", reel: "FOOD WASTE", noun: "Waste", thing: "binned pastries and over-ordering", task: "forecast what to bake and order", result: "cut waste by a third", data: "till data and order sheets" },
      { id: "regulars", type: "growth", reel: "REGULARS", noun: "Regular", thing: "regulars drifting to the chain", task: "run a loyalty scheme people actually use", result: "turn one-off visitors into regulars", data: "till data and customer lists" },
      { id: "rota", type: "time", reel: "STAFF ROTA", noun: "Rota", thing: "rota chaos every Sunday", task: "build the weekly staff rota", result: "stop losing Sundays to spreadsheets", data: "staff availability and hourly sales" },
    ],
  },
  {
    id: "foodtrucks", set: "core", label: "food trucks", reel: "FOOD TRUCKS", q: "working 3+ events a week", wallet: 2, reach: 3, trust: 1, local: true,
    hang: ["food truck association groups", "r/foodtrucks", "event-organiser WhatsApp groups"],
    sub: ["taco trucks", "coffee vans", "wood-fired pizza vans"],
    when: ["festival application season", "the run-up to wedding season"], ally: "event organisers",
    pains: [
      { id: "gigs", type: "growth", reel: "EVENT GIGS", noun: "Gig", thing: "empty weekdays between festivals", task: "find and pitch events, weddings and office lunches", result: "fill the calendar six weeks out", data: "menus, photos and past events", supply: "events that need food vendors" },
      { id: "menu", type: "content", reel: "MENU", noun: "Menu", thing: "a menu board nobody can read from the queue", task: "design menus, specials and social posts", result: "sell the high-margin items first", data: "menus and prices" },
      { id: "permits", type: "risk", reel: "PERMITS", noun: "Permit", thing: "permits and inspections across five councils", find: "permits, inspections and insurance about to expire", task: "track permits, inspections and insurance", result: "never get turned away at a pitch", data: "permits and certificates" },
    ],
  },
  {
    id: "trades", set: "core", label: "tradespeople", poss: "tradespeople's", reel: "TRADES", q: "running a 1–5 person crew", wallet: 2, reach: 2, trust: 1, local: true,
    hang: ["local trade Facebook groups", "r/Plumbing", "trade WhatsApp groups"],
    sub: ["plumbers", "electricians", "roofers", "heating engineers"],
    when: ["the first cold snap", "the spring renovation rush"], ally: "builders' merchants",
    pains: [
      { id: "quotes", type: "time", reel: "QUOTES", noun: "Quote", thing: "evenings spent writing quotes", task: "turn a site visit into a priced quote", result: "send quotes before they leave the driveway", data: "site photos and price lists" },
      { id: "unpaid", type: "leak", reel: "UNPAID JOBS", noun: "Payment", thing: "finished jobs that never get paid", task: "chase unpaid invoices", result: "get paid the day the job ends", data: "invoices and job sheets" },
      { id: "reviews", type: "growth", reel: "REVIEWS", noun: "Review", thing: "no new reviews since 2021", task: "ask every happy customer for a review", result: "win jobs from Google, not just referrals", data: "job lists and customer numbers" },
    ],
  },
  {
    id: "salons", set: "core", label: "barbers and salons", reel: "SALONS", q: "with 2–8 chairs", wallet: 2, reach: 2, trust: 1, local: true,
    hang: ["salon-owner Facebook groups", "r/Barber", "hair-industry Instagram"],
    sub: ["barbershops", "nail salons", "hair-colour specialists"],
    when: ["wedding season", "December party season"], ally: "product distributors",
    pains: [
      { id: "noshow", type: "leak", reel: "NO-SHOWS", noun: "No-Show", thing: "no-shows on Saturday mornings", task: "fill no-show slots from a waitlist", result: "get paid for every chair every Saturday", data: "booking calendars" },
      { id: "rebook", type: "growth", reel: "REBOOKINGS", noun: "Rebooking", thing: "clients who never rebook", task: "nudge clients when they're due", result: "fill Tuesdays with existing clients", data: "client lists and visit history" },
    ],
  },
  {
    id: "groomers", set: "core", label: "dog groomers", reel: "DOG GROOMERS", q: "working from a salon or a van", wallet: 2, reach: 3, trust: 1, local: true,
    hang: ["dog groomer Facebook groups", "r/doggrooming", "local pet Facebook groups"],
    sub: ["mobile groomers", "cat groomers", "show-dog groomers"],
    when: ["the spring shedding rush", "the pre-Christmas booking panic"], ally: "vets and pet shops",
    pains: [
      { id: "bookings", type: "time", reel: "BOOKINGS", noun: "Booking", thing: "a diary run by text, one dog at a time", task: "book appointments by breed and coat", result: "stop running the diary by text", data: "appointment texts and breed lists" },
      { id: "vaccines", type: "risk", reel: "VACCINE RECORDS", noun: "Vaccine Record", thing: "dogs with expired vaccination records", task: "track vaccination records and waivers", result: "never groom an unvaccinated dog by accident", data: "vaccination cards and waivers" },
    ],
  },
  {
    id: "studios", set: "core", label: "yoga and pilates studios", reel: "YOGA STUDIOS", q: "with 100+ members", wallet: 2, reach: 3, trust: 1, local: true,
    hang: ["studio-owner Facebook groups", "r/yogateachers", "local wellness Instagram"],
    sub: ["reformer pilates studios", "hot yoga studios", "community yoga collectives"],
    when: ["January resolution season", "September back-to-routine"], ally: "physios and wellness brands",
    pains: [
      { id: "trials", type: "leak", reel: "INTRO OFFERS", noun: "Intro Offer", thing: "intro-offer students who never convert", task: "follow up intro-offer students", result: "turn 40% of trials into members", data: "booking data and trial lists" },
      { id: "classes", type: "content", reel: "CLASS PLANS", noun: "Class Plan", thing: "teachers reinventing sequences every week", task: "plan class sequences and playlists", result: "give every teacher a week of classes in ten minutes", data: "class history and teacher notes" },
    ],
  },
  {
    id: "accountants", set: "core", label: "accounting firms", reel: "ACCOUNTANTS", q: "with 2–15 staff", wallet: 4, reach: 3, trust: 2,
    hang: ["accountant LinkedIn groups", "r/Accounting", "practice-management Facebook groups"],
    sub: ["firms serving landlords", "firms serving e-commerce brands", "bookkeeping-only practices"],
    when: ["tax-return crunch season", "year-end close"], ally: "accounting software resellers",
    pains: [
      { id: "docs", type: "time", reel: "MISSING DOCS", noun: "Document", thing: "clients who send documents the week of the deadline", task: "chase clients for missing documents", result: "close files weeks before the deadline", data: "client checklists and emails" },
      { id: "advisory", type: "growth", reel: "ADVISORY", noun: "Advisory", thing: "compliance work priced like a commodity", task: "package and sell monthly advisory", result: "raise average fees by 30%", data: "client ledgers" },
    ],
  },
  {
    id: "recruiters", set: "core", label: "recruiters", reel: "RECRUITERS", q: "billing ¤100k+ a year", wallet: 3, reach: 4, trust: 1,
    hang: ["r/recruiting", "recruiter LinkedIn groups", "recruitment Slack communities"],
    sub: ["tech recruiters", "healthcare recruiters", "executive search consultants"],
    when: ["January hiring budgets", "the week a big layoff hits the news"], ally: "HR consultants",
    pains: [
      { id: "sourcing", type: "time", reel: "SOURCING", noun: "Shortlist", thing: "hours of LinkedIn scrolling per role", task: "build candidate shortlists", result: "send a shortlist within 24 hours", data: "job specs and CV databases" },
      { id: "signals", type: "growth", reel: "HIRING SIGNALS", noun: "Hiring Signal", thing: "companies hiring that nobody calls first", task: "spot companies that just started hiring", result: "call hiring managers before the competition", data: "job boards and funding news" },
    ],
  },
  {
    id: "therapists", set: "core", label: "private-practice therapists", reel: "THERAPISTS", q: "with 15–30 weekly clients", wallet: 3, reach: 3, trust: 3,
    hang: ["therapist Facebook groups", "r/therapists", "professional-body forums"],
    sub: ["couples therapists", "CBT therapists", "child and teen therapists"],
    when: ["the September waitlist surge", "January"], ally: "GPs and employee-assistance programmes",
    pains: [
      { id: "notes", type: "time", reel: "SESSION NOTES", noun: "Note", thing: "evenings lost to session notes", task: "draft session notes from their own bullet points", result: "finish notes before the next client", data: "bullet-point notes (never recordings without consent)" },
      { id: "referrals", type: "growth", reel: "REFERRALS", noun: "Referral", thing: "a practice that lives or dies on one directory listing", task: "build referral relationships with GPs", result: "fill the diary from referrals, not ads", data: "practice specialisms" },
    ],
  },
  {
    id: "gamedev", set: "core", label: "indie game devs", reel: "INDIE DEVS", q: "shipping on Steam", wallet: 1, reach: 5, trust: 1,
    hang: ["r/gamedev", "r/IndieDev", "devlog Discord servers"],
    sub: ["solo devs", "pixel-art studios", "cosy-game devs"],
    when: ["Steam Next Fest", "the month before launch"], ally: "indie publishers",
    pains: [
      { id: "wishlists", type: "growth", reel: "WISHLISTS", noun: "Wishlist", thing: "a Steam page with 300 wishlists", task: "grow wishlists before launch", result: "hit 10k wishlists before release", data: "Steam pages and trailers" },
      { id: "devlogs", type: "content", reel: "DEVLOGS", noun: "Devlog", thing: "dead devlogs", task: "turn commits into devlogs and posts", result: "build an audience while building the game", data: "commit history and GIFs" },
      { id: "launch", type: "skill", reel: "LAUNCH MATH", noun: "Launch", thing: "pricing and discount guesswork", task: "price, discount and time a launch", result: "launch at a price that pays rent" },
    ],
  },
  {
    id: "saas", set: "core", label: "B2B SaaS founders", reel: "SAAS FOUNDERS", q: "under ¤1M ARR", wallet: 3, reach: 5, trust: 1,
    hang: ["Indie Hackers", "r/SaaS", "SaaS founder Slack groups"],
    sub: ["bootstrapped founders", "vertical SaaS founders", "dev-tool founders"],
    when: ["the month churn spikes", "fundraising season"], ally: "SaaS accountants and agencies",
    pains: [
      { id: "churn", type: "leak", reel: "CHURN", noun: "Churn", thing: "customers who cancel without saying why", task: "spot accounts about to churn", result: "save 1 in 5 cancellations", data: "product usage and billing data" },
      { id: "dunning", type: "leak", reel: "FAILED PAYMENTS", noun: "Dunning", thing: "failed card payments", task: "recover failed payments", result: "win back 30% of failed renewals", data: "Stripe data" },
      { id: "changelog", type: "content", reel: "CHANGELOGS", noun: "Changelog", thing: "features nobody knows shipped", task: "turn releases into changelogs and emails", result: "make every release sell", data: "commits and release notes" },
    ],
  },
  {
    id: "newsletters", set: "core", label: "newsletter writers", reel: "NEWSLETTERS", q: "with 1,000–20,000 subscribers", wallet: 2, reach: 5, trust: 1,
    hang: ["r/Newsletters", "Substack Notes", "beehiiv creator communities"],
    sub: ["finance newsletters", "local news newsletters", "B2B niche newsletters"],
    when: ["the month open rates drop", "Q4 sponsorship season"], ally: "newsletter ad networks",
    pains: [
      { id: "sponsors", type: "leak", reel: "SPONSORS", noun: "Sponsor", thing: "an inbox with zero sponsor deals", find: "sponsors already buying ads in newsletters like theirs", task: "find and pitch sponsors", result: "land sponsors worth ¤50 per thousand opens", data: "audience stats", supply: "brands buying newsletter ads" },
      { id: "swaps", type: "growth", reel: "SUBSCRIBERS", noun: "Subscriber", thing: "growth stuck at 30 new subscribers a week", task: "find cross-promotions and referral swaps", result: "double weekly signups", data: "subscriber data", supply: "newsletters open to swaps" },
    ],
  },
  {
    id: "authors", set: "core", label: "self-published authors", reel: "KDP AUTHORS", q: "on Amazon KDP", wallet: 1, reach: 4, trust: 1,
    hang: ["r/selfpublish", "20BooksTo50K", "KDP community forums"],
    sub: ["romance authors", "low-content book publishers", "non-fiction authors"],
    when: ["launch week", "the month before a series release"], ally: "cover designers and editors",
    pains: [
      { id: "ads", type: "growth", reel: "AMAZON ADS", noun: "Ads", thing: "Amazon ads burning ¤10 a day for zero sales", task: "research keywords and write ad copy", result: "make ads pay for themselves", data: "ASINs and ad reports" },
      { id: "arcs", type: "growth", reel: "LAUNCH REVIEWS", noun: "Launch", thing: "launches with three reviews", task: "recruit early readers and reviewers", result: "launch with 50 reviews in week one", data: "manuscripts and reader lists", supply: "readers who review on time" },
      { id: "blurbs", type: "content", reel: "BLURBS", noun: "Blurb", thing: "blurbs that read like a synopsis", task: "write blurbs and A+ content", result: "turn page views into sales", data: "manuscripts and comparable titles" },
    ],
  },
  {
    id: "instructors", set: "core", label: "driving instructors", reel: "DRIVING INSTRUCTORS", q: "with a full diary", wallet: 2, reach: 2, trust: 1, local: true,
    hang: ["driving instructor Facebook groups", "local learner-driver groups", "instructor forums"],
    sub: ["manual-car instructors", "intensive-course instructors", "instructor franchise owners"],
    when: ["summer after exams", "test-backlog announcements"], ally: "driving schools",
    pains: [
      { id: "cancel", type: "leak", reel: "CANCELLATIONS", noun: "Cancellation", thing: "learners who cancel two hours before", task: "refill cancelled lessons from a waitlist", result: "get paid for every slot", data: "lesson diaries" },
      { id: "progress", type: "growth", reel: "PROGRESS", noun: "Progress Report", thing: "parents asking \"are they ready yet?\"", task: "send progress reports after each lesson", result: "sell block bookings with proof of progress", data: "lesson notes" },
    ],
  },
  {
    id: "tutors", set: "core", label: "private tutors", reel: "TUTORS", q: "teaching 15+ students", wallet: 2, reach: 3, trust: 1,
    hang: ["tutor Facebook groups", "r/Tutoring", "school-parent WhatsApp groups"],
    sub: ["maths tutors", "language tutors", "exam-prep tutors"],
    when: ["mock-exam results week", "September"], ally: "schools and study centres",
    pains: [
      { id: "worksheets", type: "time", reel: "WORKSHEETS", noun: "Worksheet", thing: "Sunday nights spent making worksheets", task: "generate worksheets and mark schemes", result: "prep a week of lessons in an hour", data: "syllabuses and past papers" },
      { id: "parents", type: "growth", reel: "PARENT UPDATES", noun: "Parent Report", thing: "parents who quit after six weeks", task: "send parents weekly progress reports", result: "keep students for the whole school year", data: "lesson notes" },
    ],
  },
  {
    id: "gyms", set: "core", label: "independent gyms", reel: "GYMS", q: "with 200–1,000 members", wallet: 3, reach: 2, trust: 1, local: true,
    hang: ["gym-owner Facebook groups", "fitness-business Slack groups", "local business networking groups"],
    sub: ["CrossFit boxes", "boxing gyms", "24-hour gyms"],
    when: ["January", "the week a budget chain opens nearby"], ally: "local physios and supplement shops",
    pains: [
      { id: "churn", type: "leak", reel: "MEMBER CHURN", noun: "Churn", thing: "members who stop coming three weeks before they cancel", task: "spot members who stopped showing up", result: "save 1 in 4 cancellations", data: "check-in data" },
      { id: "trials", type: "growth", reel: "TRIAL LEADS", noun: "Trial", thing: "ad leads who never show up", task: "follow up trial leads within five minutes", result: "turn half of trials into members", data: "lead forms and CRM" },
    ],
  },
  {
    id: "agencies", set: "core", label: "marketing agencies", reel: "AGENCIES", q: "with 3–20 staff", wallet: 3, reach: 4, trust: 1,
    hang: ["agency-owner Facebook groups", "r/agency", "agency Slack communities"],
    sub: ["SEO agencies", "paid-social agencies", "web-design studios"],
    when: ["January budget resets", "the month a big client churns"], ally: "freelance networks and SaaS vendors",
    pains: [
      { id: "reports", type: "time", reel: "CLIENT REPORTS", noun: "Report", thing: "two days a month building client reports", task: "build monthly client reports", result: "send reports in ten minutes, not two days", data: "ad and analytics dashboards" },
      { id: "scope", type: "leak", reel: "SCOPE CREEP", noun: "Scope", thing: "unbilled \"quick changes\"", task: "track out-of-scope requests", result: "bill for every extra hour", data: "client emails and tickets" },
    ],
  },
  {
    id: "nonprofits", set: "core", label: "small charities", reel: "CHARITIES", q: "under ¤1M a year", wallet: 2, reach: 3, trust: 1,
    hang: ["charity-sector LinkedIn groups", "r/nonprofit", "local volunteer networks"],
    sub: ["animal rescues", "community sports clubs", "arts charities"],
    when: ["grant-deadline season", "December giving season"], ally: "fundraising consultants",
    pains: [
      { id: "grants", type: "growth", reel: "GRANTS", noun: "Grant", thing: "grant money they never applied for", task: "find and draft grant applications", result: "apply for five times more grants", data: "past applications and impact numbers", supply: "grants that fit their mission" },
      { id: "donors", type: "growth", reel: "DONOR UPDATES", noun: "Donor Update", thing: "donors who give once and vanish", task: "send donors real impact updates", result: "turn one-off donors into monthly givers", data: "donor lists and project photos" },
    ],
  },
  {
    id: "parents", set: "core", label: "parents of toddlers", reel: "TODDLER PARENTS", q: "who buy on their phone at 9pm", wallet: 1, reach: 5, trust: 1,
    hang: ["parenting subreddits", "local parent WhatsApp groups", "parenting forums"],
    sub: ["first-time parents", "parents of twins", "working parents"],
    when: ["the first rainy week of the school holidays", "the run-up to birthdays"], ally: "nurseries and toddler groups",
    pains: [
      { id: "activities", type: "time", reel: "RAINY DAYS", noun: "Rainy Day", thing: "another rainy Saturday indoors", task: "plan activities that take five minutes to set up", result: "survive the weekend without screens", data: "toys and ages" },
      { id: "stories", type: "content", reel: "BEDTIME STORIES", noun: "Storybook", thing: "the same five bedtime stories on repeat", task: "make personalised bedtime stories", result: "make their kid the hero of every story", data: "their kid's name and obsessions", merch: "personalised storybooks" },
    ],
  },
  {
    id: "students", set: "core", label: "university students", reel: "STUDENTS", q: "in their first two years", wallet: 1, reach: 5, trust: 1,
    hang: ["university subreddits", "student Discord servers", "campus Instagram pages"],
    sub: ["international students", "medical students", "engineering students"],
    when: ["exam season", "freshers' week"], ally: "student unions and societies",
    pains: [
      { id: "revision", type: "skill", reel: "REVISION", noun: "Revision", thing: "revision that doesn't stick", task: "turn lecture notes into flashcards and quizzes", result: "walk into exams having already tested themselves" },
      { id: "budget", type: "leak", reel: "STUDENT BUDGET", noun: "Budget", thing: "a loan that runs out by week eight", find: "the subscriptions and spending leaks draining the loan", task: "build a term budget", result: "make the loan last all term", data: "bank-app exports" },
    ],
  },
  {
    id: "nurses", set: "core", label: "nurses", reel: "NURSES", q: "working 12-hour shifts", wallet: 1, reach: 4, trust: 1,
    hang: ["r/nursing", "nurse Facebook groups", "hospital staff WhatsApp groups"],
    sub: ["agency nurses", "ICU nurses", "travel nurses"],
    when: ["rota-release day", "the February burnout slump"], ally: "nursing agencies and unions",
    pains: [
      { id: "swaps", type: "time", reel: "SHIFT SWAPS", noun: "Shift Swap", thing: "a rota that ignores their life", task: "swap and pick up shifts", result: "build a rota they can actually live with", data: "rotas and availability", supply: "nurses who want to swap" },
      { id: "cpd", type: "skill", reel: "CPD HOURS", noun: "CPD", thing: "CPD hours scrambled together before revalidation", task: "log CPD and reflections", result: "revalidate without the last-minute panic" },
    ],
  },
  {
    id: "construction", set: "core", label: "construction contractors", reel: "CONTRACTORS", q: "running ¤1M+ of jobs a year", wallet: 4, reach: 2, trust: 2,
    hang: ["contractor Facebook groups", "r/Construction", "trade-association forums"],
    sub: ["groundworks contractors", "fit-out contractors", "roofing contractors"],
    when: ["tender season", "the month materials prices jump"], ally: "quantity surveyors",
    pains: [
      { id: "tenders", type: "growth", reel: "TENDERS", noun: "Tender", thing: "tenders found a day before the deadline", task: "find tenders and draft bid responses", result: "bid on the jobs they can actually win", data: "past bids and capability statements", supply: "public tenders that fit their trade" },
      { id: "variations", type: "leak", reel: "VARIATIONS", noun: "Variation", thing: "site changes that never get paid", task: "log site changes as priced variations", result: "get paid for every change the client asked for", data: "site diaries and photos" },
      { id: "safety", type: "risk", reel: "SITE SAFETY", noun: "Safety Pack", thing: "safety paperwork done in the van at 7am", find: "gaps in risk assessments and method statements", task: "produce risk assessments and method statements", result: "pass every site audit", data: "job specs and site photos" },
    ],
  },
  {
    id: "amazon", set: "core", label: "Amazon sellers", reel: "AMAZON SELLERS", q: "doing ¤20k+ a month", wallet: 3, reach: 4, trust: 1,
    hang: ["r/FulfillmentByAmazon", "Amazon seller Facebook groups", "seller Slack communities"],
    sub: ["private-label sellers", "wholesale sellers", "supplement sellers"],
    when: ["Q4 inventory planning", "the week an account-health warning lands"], ally: "Amazon agencies and prep centres",
    pains: [
      { id: "reimburse", type: "leak", reel: "LOST INVENTORY", noun: "Reimbursement", thing: "lost and damaged inventory Amazon never paid for", task: "find and file reimbursement claims", result: "recover 1–3% of revenue", data: "inventory and settlement reports" },
      { id: "listings", type: "content", reel: "LISTINGS", noun: "Listing", thing: "listings with two bullet points", task: "write listings and A+ content", result: "rank and convert without more PPC", data: "product specs and competitor listings" },
      { id: "health", type: "risk", reel: "ACCOUNT HEALTH", noun: "Account Health", thing: "policy warnings that can freeze the account", task: "monitor account-health warnings", result: "never wake up suspended", data: "Seller Central notifications" },
    ],
  },
  {
    id: "musicians", set: "core", label: "indie musicians", reel: "MUSICIANS", q: "with 1k–50k monthly listeners", wallet: 1, reach: 4, trust: 1,
    hang: ["r/WeAreTheMusicMakers", "musician Discords", "local gig-promoter groups"],
    sub: ["bedroom producers", "wedding bands", "singer-songwriters"],
    when: ["release week", "festival application season"], ally: "distributors and gig promoters",
    pains: [
      { id: "playlists", type: "growth", reel: "PLAYLISTS", noun: "Playlist", thing: "releases that disappear in 48 hours", task: "find and pitch playlist curators", result: "land 10 real playlists per release", data: "release links and genres", supply: "curators who actually listen" },
      { id: "royalties", type: "leak", reel: "ROYALTIES", noun: "Royalty", thing: "royalties nobody ever claimed", task: "register songs and claim royalties", result: "collect the money their songs already earned", data: "catalogues and distributor reports" },
    ],
  },
  {
    id: "hotels", set: "core", label: "boutique hotels", reel: "BOUTIQUE HOTELS", q: "with 10–60 rooms", wallet: 4, reach: 2, trust: 1, local: true,
    hang: ["hotelier LinkedIn groups", "hospitality trade forums", "independent-hotel associations"],
    sub: ["country-house hotels", "city-centre boutique hotels", "glamping sites"],
    when: ["shoulder season", "the month the booking-site commission bill arrives"], ally: "hotel revenue managers",
    pains: [
      { id: "direct", type: "leak", reel: "OTA FEES", noun: "Direct Booking", thing: "15–25% commission on every booking", find: "guests who booked through an agency but could have booked direct", task: "win direct bookings back from the booking sites", result: "save ¤50k a year in commission", data: "booking data and websites" },
      { id: "replies", type: "growth", reel: "REVIEW REPLIES", noun: "Review Reply", thing: "300 unanswered reviews", task: "reply to reviews in the hotel's voice", result: "turn reviews into a ranking signal", data: "review sites" },
    ],
  },

  // Seeded from the mechanisms in the 697-concept "100 Ways to make Income
  // with AI" list (supply-chain visibility, patient communication, law-firm
  // marketing, genealogy, wedding vows...), each given a customer who pays.
  {
    id: "roasters", set: "core", label: "boutique coffee roasters", reel: "COFFEE ROASTERS", q: "doing 1–10 tonnes a year", wallet: 3, reach: 3, trust: 1,
    hang: ["r/roasting", "specialty-coffee roaster Facebook groups", "Specialty Coffee Association forums"],
    sub: ["micro-roasters", "roaster-cafés", "subscription-first roasters"],
    when: ["new-harvest arrival season", "the month green-coffee prices spike"], ally: "green-coffee importers",
    pains: [
      { id: "supply", type: "leak", reel: "SUPPLY CHAIN", noun: "Supply Chain", thing: "green-coffee lots nobody can trace from farm to bag", find: "lots running low, stale stock and shipments stuck in port", task: "track green-coffee lots from port to roaster to bag", result: "never run out of a bestseller mid-month", data: "import documents, roast logs and stock sheets" },
      { id: "wholesale", type: "growth", reel: "WHOLESALE", noun: "Wholesale", thing: "cafés that stay with the roaster down the road", task: "win and keep wholesale café accounts", result: "land ten new café accounts a quarter", data: "café lists and cupping notes", supply: "cafés looking for a new roaster" },
      { id: "subs", type: "leak", reel: "SUBSCRIBERS", noun: "Subscription", thing: "coffee subscribers who cancel after three bags", find: "subscribers about to cancel", task: "keep coffee subscribers past bag three", result: "double what each subscriber is worth", data: "subscription and order data" },
    ],
  },
  {
    id: "nutritionists", set: "core", label: "nutritionists", reel: "NUTRITIONISTS", q: "with 20–60 clients", wallet: 2, reach: 4, trust: 2,
    hang: ["nutritionist and dietitian Facebook groups", "r/nutrition", "wellness-business Slack groups"],
    sub: ["sports nutritionists", "gut-health specialists", "registered dietitians"],
    when: ["January", "the eight weeks before summer"], ally: "personal trainers and GPs",
    pains: [
      { id: "plans", type: "time", reel: "MEAL PLANS", noun: "Meal Plan", thing: "evenings spent writing meal plans by hand", task: "build personalised meal plans and shopping lists", result: "send every client their plan the same day", data: "client intake forms and food preferences" },
      { id: "content", type: "content", reel: "CLIENT CONTENT", noun: "Recipe Post", thing: "a feed full of salad photos", task: "turn their advice into recipes, posts and handouts", result: "attract clients who already trust them", data: "their notes, recipes and client questions" },
    ],
  },
  {
    id: "lawfirms", set: "core", label: "small law firms", reel: "LAW FIRMS", q: "with 2–10 solicitors", wallet: 4, reach: 2, trust: 3, local: true,
    hang: ["solicitor LinkedIn groups", "r/LawFirm", "local law-society networks"],
    sub: ["conveyancing firms", "family-law firms", "immigration practices"],
    when: ["the quarter a senior partner retires", "the week a rule change hits client-care letters"], ally: "legal IT consultants",
    pains: [
      { id: "intake", type: "growth", reel: "NEW ENQUIRIES", noun: "Enquiry", thing: "enquiries answered two days later", task: "answer and qualify new client enquiries within five minutes", result: "sign the client before they call the next firm", data: "enquiry forms and call notes" },
      { id: "bundles", type: "time", reel: "DOC BUNDLES", noun: "Bundle", thing: "paralegal days lost to indexing document bundles", task: "index, paginate and summarise document bundles", result: "turn a two-day bundle into an afternoon", data: "case documents" },
    ],
  },
  {
    id: "physio", set: "core", label: "physio clinics", reel: "PHYSIO CLINICS", q: "with 2–8 practitioners", wallet: 3, reach: 2, trust: 2, local: true,
    hang: ["physio practice-owner Facebook groups", "r/physicaltherapy", "clinic-owner LinkedIn groups"],
    sub: ["sports-injury clinics", "women's health clinics", "chiropractic clinics"],
    when: ["January running-injury season", "marathon training season"], ally: "gyms and running clubs",
    pains: [
      { id: "exercises", type: "time", reel: "HOME EXERCISES", noun: "Rehab Plan", thing: "home-exercise sheets photocopied since 2009", task: "send patients a personalised home-exercise plan after each session", result: "get patients better faster, and rebooking", data: "session notes and exercise libraries" },
      { id: "dropoff", type: "leak", reel: "DROP-OFFS", noun: "Rebooking", thing: "patients who vanish after session two", find: "patients who stopped before finishing their plan", task: "follow up patients who didn't rebook", result: "complete twice as many treatment plans", data: "booking data" },
    ],
  },
  {
    id: "jobseekers", set: "core", label: "job seekers", reel: "JOB SEEKERS", q: "applying to 20+ roles a month", wallet: 1, reach: 5, trust: 1,
    hang: ["r/jobs", "r/resumes", "LinkedIn job-hunting groups"],
    sub: ["new graduates", "career changers", "laid-off tech workers"],
    when: ["January hiring season", "the week after a round of layoffs"], ally: "career coaches and recruiters",
    pains: [
      { id: "interviews", type: "skill", reel: "INTERVIEWS", noun: "Interview", thing: "interviews that go blank at \"tell me about yourself\"", task: "rehearse answers for a specific role", result: "walk into interviews already practised" },
      { id: "applications", type: "time", reel: "APPLICATIONS", noun: "Application", thing: "rewriting the same cover letter 40 times", task: "tailor CVs and cover letters to each job", result: "send 20 tailored applications in the time one used to take", data: "their CV and the job ads" },
    ],
  },
  {
    id: "historians", set: "core", label: "family historians", reel: "FAMILY HISTORY", q: "with a DNA test and a shoebox of photos", wallet: 1, reach: 4, trust: 1,
    hang: ["r/Genealogy", "family-history Facebook groups", "Ancestry community forums"],
    sub: ["adoptees tracing birth family", "retirees writing a memoir", "diaspora families tracing their roots"],
    when: ["Christmas gift season", "a parent's 80th birthday"], ally: "local history societies",
    pains: [
      { id: "memoir", type: "content", reel: "MEMOIRS", noun: "Memoir", thing: "grandparents' stories nobody has written down", task: "turn recorded conversations into a family memoir", result: "hand every grandchild a printed family story", data: "voice notes and old photos", merch: "printed family memoir books" },
      { id: "records", type: "skill", reel: "ANCESTRY", noun: "Ancestry", thing: "a family tree stuck at 1851", task: "search census and parish records", result: "break through the brick wall in the tree" },
    ],
  },
  {
    id: "brewers", set: "core", label: "craft breweries", reel: "CRAFT BREWERIES", q: "brewing 500–5,000 barrels a year", wallet: 3, reach: 3, trust: 2, local: true,
    hang: ["r/TheBrewery", "craft-brewer Facebook groups", "brewers' association forums"],
    sub: ["taproom breweries", "contract brewers", "craft cider makers"],
    when: ["summer festival season", "the month duty rates change"], ally: "beer distributors",
    pains: [
      { id: "kegs", type: "leak", reel: "LOST KEGS", noun: "Keg", thing: "kegs that vanish into pub cellars", find: "kegs sitting unreturned in pubs for 90+ days", task: "track kegs out to pubs and back", result: "stop buying replacement kegs at ¤100 each", data: "delivery notes and keg logs" },
      { id: "duty", type: "risk", reel: "DUTY RETURNS", noun: "Duty Return", thing: "duty returns worked out on a Sunday night", find: "duty miscalculations and missing records", task: "prepare alcohol duty returns from brew logs", result: "file duty on time without overpaying", data: "brew logs and sales records" },
    ],
  },
  {
    id: "engaged", set: "core", label: "engaged couples", reel: "ENGAGED COUPLES", q: "a year out from the wedding", wallet: 2, reach: 5, trust: 1,
    hang: ["r/weddingplanning", "wedding-planning Facebook groups", "wedding TikTok"],
    sub: ["couples marrying abroad", "second-time-around couples", "micro-wedding couples"],
    when: ["January engagement season", "the month before the wedding"], ally: "wedding planners and venues",
    pains: [
      { id: "vows", type: "content", reel: "VOWS", noun: "Vow", thing: "vows still blank a week before the wedding", task: "write vows that sound like them", result: "make the whole room cry (the good kind)", data: "their story and inside jokes" },
      { id: "seating", type: "time", reel: "SEATING PLAN", noun: "Seating Plan", thing: "a seating plan that restarts three family feuds", task: "build a seating plan around the family politics", result: "seat 120 guests without a scene", data: "guest lists and family notes" },
    ],
  },

  // DEGEN: strange, loud customers who are easy to reach and love a bit.
  {
    id: "dating", set: "degen", label: "dating-app users", reel: "DATING APPS", q: "on their third app this year", wallet: 1, reach: 5, trust: 1,
    hang: ["r/Tinder", "r/hingeapp", "dating TikTok"],
    sub: ["recently divorced 40-somethings", "gym guys with zero matches", "people who just moved city"],
    when: ["the week after Valentine's Day", "January"], ally: "photographers and stylists",
    pains: [
      { id: "profile", type: "growth", reel: "DATING PROFILE", noun: "Profile", thing: "a profile with a fish photo and \"just ask\"", task: "rewrite bios and pick the photos that get matches", result: "triple their matches", data: "photos and current bios" },
      { id: "openers", type: "content", reel: "OPENERS", noun: "Opener", thing: "chats that die at \"hey\"", task: "write openers that get replies", result: "turn matches into actual dates", data: "match profiles" },
    ],
  },
  {
    id: "gymbros", set: "degen", label: "gym bros", reel: "GYM BROS", q: "lifting five days a week", wallet: 1, reach: 5, trust: 1,
    hang: ["r/Fitness", "lifting TikTok", "gym Discords"],
    sub: ["powerlifters", "bodybuilding competitors", "calisthenics guys"],
    when: ["the start of a bulk", "summer cut season"], ally: "supplement brands",
    pains: [
      { id: "mealprep", type: "time", reel: "MEAL PREP", noun: "Meal Prep", thing: "chicken and rice for the 400th day", task: "plan high-protein meal prep", result: "hit protein without dying of boredom", data: "macros and foods they tolerate" },
      { id: "prs", type: "mind", reel: "PR BRAGGING", noun: "PR", thing: "a personal record nobody saw", task: "turn PRs into shareable brag cards", result: "get the respect their deadlift deserves", merch: "PR brag posters and shirts" },
    ],
  },
  {
    id: "mystics", set: "degen", label: "astrology and tarot creators", reel: "TAROT & ASTRO", q: "with 5k+ followers", wallet: 1, reach: 5, trust: 1,
    hang: ["r/astrology", "r/tarot", "astrology TikTok"],
    sub: ["tarot readers", "birth-chart astrologers", "crystal sellers"],
    when: ["Mercury retrograde (sales genuinely spike)", "New Year forecast season"], ally: "crystal and candle shops",
    pains: [
      { id: "readings", type: "content", reel: "READINGS", noun: "Reading", thing: "40 custom readings written by hand", task: "draft personalised reading reports", result: "sell ten times more readings without losing the vibe", data: "birth data and card spreads" },
      { id: "zodiac", type: "mind", reel: "ZODIAC MERCH", noun: "Zodiac", thing: "followers who want to feel seen", task: "sell sign-specific products", result: "monetise followers who already engage", merch: "zodiac-sign wall art and planners" },
    ],
  },
  {
    id: "sneakers", set: "degen", label: "sneaker resellers", reel: "SNEAKER FLIPPERS", q: "flipping 20+ pairs a month", wallet: 2, reach: 5, trust: 1,
    hang: ["r/SneakerMarket", "cook-group Discords", "resale threads on X"],
    sub: ["vintage streetwear flippers", "trading-card flippers", "retro console flippers"],
    when: ["release-calendar drops", "tax season (surprise: it's income)"], ally: "consignment stores",
    pains: [
      { id: "fakes", type: "risk", reel: "FAKES", noun: "Legit Check", thing: "buying a ¤400 fake", find: "the tells of a fake", task: "legit-check pairs before buying", result: "never eat a fake again", data: "listing photos" },
      { id: "profit", type: "leak", reel: "FLIP PROFIT", noun: "Flip", thing: "not knowing which flips actually make money", find: "flips that lost money after fees", task: "track real profit per flip after fees", result: "know which drops are worth the L", data: "sales history and fees" },
    ],
  },
  {
    id: "minis", set: "degen", label: "miniature painters", reel: "MINI PAINTERS", q: "with a shelf of unpainted plastic", wallet: 1, reach: 4, trust: 1,
    hang: ["r/Warhammer", "r/minipainting", "hobby Discord servers"],
    sub: ["commission painters", "tournament players", "D&D miniature collectors"],
    when: ["new-army release weekends", "the week before a tournament"], ally: "local game stores",
    pains: [
      { id: "commissions", type: "growth", reel: "COMMISSIONS", noun: "Commission", thing: "commission painters earning ¤4 an hour", task: "price and sell painting commissions", result: "charge what 40 hours of brushwork is worth", data: "portfolio photos", supply: "players who pay to skip painting" },
      { id: "pile", type: "mind", reel: "PILE OF SHAME", noun: "Pile of Shame", thing: "the pile of shame", task: "actually finish painting what they bought", result: "paint one army before buying the next", merch: "pile-of-shame trackers and posters" },
    ],
  },
  {
    id: "ghosts", set: "degen", label: "paranormal investigators", reel: "GHOST HUNTERS", q: "running investigation nights", wallet: 1, reach: 4, trust: 1,
    hang: ["r/Ghosts", "paranormal Facebook groups", "ghost-hunting YouTube communities"],
    sub: ["ghost-tour operators", "haunted-venue owners", "paranormal podcasters"],
    when: ["October", "Friday the 13th"], ally: "haunted venues and castles",
    pains: [
      { id: "nights", type: "growth", reel: "GHOST NIGHTS", noun: "Ghost Night", thing: "half-empty ghost nights", task: "sell tickets to overnight investigations", result: "sell out October twice", data: "venue lists and past events", supply: "venues happy to admit they're haunted" },
      { id: "evidence", type: "content", reel: "EVIDENCE", noun: "Evidence", thing: "hours of footage with nothing on it", task: "cut hours of footage into 60-second clips", result: "grow a channel off one creaky door", data: "investigation footage" },
    ],
  },
  {
    id: "vanlife", set: "degen", label: "van lifers", reel: "VAN LIFERS", q: "living on the road full-time", wallet: 1, reach: 5, trust: 1,
    hang: ["r/vandwellers", "van-life Instagram", "overlander Facebook groups"],
    sub: ["digital nomads in vans", "retired grey nomads", "surfers in vans"],
    when: ["the start of summer", "the first frost"], ally: "van converters",
    pains: [
      { id: "spots", type: "time", reel: "CAMP SPOTS", noun: "Camp Spot", thing: "hunting for a legal place to sleep every night", task: "find legal overnight spots", result: "never get the 2am knock on the window", data: "routes and van sizes", supply: "landowners who host vans" },
      { id: "builds", type: "skill", reel: "VAN BUILDS", noun: "Van Build", thing: "electrics wired from YouTube comments", task: "plan a van build that passes inspection", result: "build it once instead of twice" },
    ],
  },
  {
    id: "crypto", set: "degen", label: "memecoin traders", reel: "MEMECOIN DEGENS", q: "with too many browser tabs", wallet: 1, reach: 5, trust: 1,
    hang: ["crypto X", "Telegram trading groups", "r/CryptoMoonShots"],
    sub: ["Solana degens", "NFT flippers", "airdrop farmers"],
    when: ["the first green day in weeks", "tax season (the reckoning)"], ally: "crypto accountants",
    pains: [
      { id: "rugs", type: "risk", reel: "RUG PULLS", noun: "Rug Check", thing: "rug pulls", find: "rug-pull red flags", task: "check token contracts for red flags before buying", result: "lose money more slowly", data: "contract addresses" },
      { id: "tax", type: "leak", reel: "CRYPTO TAX", noun: "Crypto Tax", thing: "a 4,000-transaction tax nightmare", find: "taxable events, missing cost bases and losses worth claiming", task: "turn wallet chaos into a tax-ready report", result: "stop fearing the tax letter", data: "wallet exports" },
    ],
  },
  {
    id: "bestmen", set: "degen", label: "best men", poss: "best men's", reel: "BEST MEN", q: "with a speech due in three weeks", wallet: 1, reach: 5, trust: 1,
    hang: ["r/weddingplanning", "stag-do WhatsApp groups", "r/AskMen"],
    sub: ["maids of honour", "fathers of the bride", "grooms"],
    when: ["the week before the wedding", "the night before (panic buyers)"], ally: "wedding planners and suit-hire shops",
    pains: [
      { id: "speech", type: "content", reel: "SPEECH", noun: "Speech", thing: "a speech that dies after the first joke", task: "write a wedding speech with jokes that land", result: "get a standing ovation instead of a cringe", data: "stories about the couple" },
    ],
  },
  {
    id: "quitters", set: "degen", label: "job quitters", reel: "QUITTERS", q: "with a resignation draft open", wallet: 1, reach: 5, trust: 1,
    hang: ["r/antiwork", "r/careerguidance", "LinkedIn's \"open to work\" crowd"],
    sub: ["burnt-out consultants", "teachers leaving teaching", "people leaving Big Tech"],
    when: ["Monday morning", "bonus-payout week"], ally: "career coaches",
    pains: [
      { id: "letter", type: "content", reel: "RESIGNATION", noun: "Resignation", thing: "a resignation letter rewritten nine times", task: "write a resignation that burns no bridges", result: "leave with a reference and their dignity", data: "job details" },
      { id: "exit", type: "skill", reel: "EXIT PLAN", noun: "Exit Plan", thing: "quitting with no plan and two months of savings", task: "plan the runway before handing in notice", result: "quit without panic" },
    ],
  },
  {
    id: "petfluencers", set: "degen", label: "pet influencer accounts", reel: "PETFLUENCERS", q: "with 10k+ followers", wallet: 1, reach: 5, trust: 1,
    hang: ["pet Instagram", "pet TikTok", "pet-creator Discords"],
    sub: ["cat accounts", "dog accounts", "exotic pet accounts"],
    when: ["Q4 brand-deal season", "the day a video goes viral"], ally: "pet brands' marketing teams",
    pains: [
      { id: "deals", type: "leak", reel: "BRAND DEALS", noun: "Brand Deal", thing: "a famous dog paid in free treats", find: "brand deals they underpriced", task: "price and pitch brand deals", result: "get paid in money, not kibble", data: "follower stats", supply: "pet brands that pay creators" },
    ],
  },
  {
    id: "streamers", set: "degen", label: "Twitch streamers", reel: "STREAMERS", q: "averaging 20–200 viewers", wallet: 1, reach: 5, trust: 1,
    hang: ["r/Twitch", "streamer Discords", "r/NewTubers"],
    sub: ["VTubers", "speedrunners", "just-chatting streamers"],
    when: ["the week after a big game launch", "sub-a-thon season"], ally: "stream overlay designers",
    pains: [
      { id: "clips", type: "content", reel: "STREAM CLIPS", noun: "Clip", thing: "six-hour VODs nobody rewatches", task: "turn VODs into TikTok clips", result: "grow off the 30 seconds that actually slapped", data: "VODs and chat logs" },
    ],
  },
  {
    id: "situationships", set: "degen", label: "college students", reel: "SITUATIONSHIPS", q: "on their phone at 1am", wallet: 1, reach: 5, trust: 1,
    hang: ["r/college", "r/BreakUps", "campus meme pages"],
    sub: ["freshers in long-distance relationships", "students ending a situationship", "serial situationship survivors"],
    when: ["the week before Valentine's Day", "the end of first semester"], ally: "student meme pages and campus podcasts",
    pains: [
      { id: "breakup", type: "content", reel: "BREAKUP TEXTS", noun: "Breakup Text", thing: "a breakup text drafted and deleted 40 times", task: "write breakup texts that end it kindly and clearly", result: "end it without a 2am essay", data: "the situation, in their own words" },
      { id: "nocontact", type: "mind", reel: "NO CONTACT", noun: "No-Contact", thing: "the 2am urge to text the ex", task: "stick to no-contact", result: "stop texting the ex at 2am", merch: "no-contact streak trackers" },
    ],
  },
  {
    id: "promoters", set: "degen", label: "club-night promoters", reel: "PROMOTERS", q: "throwing two or more nights a month", wallet: 1, reach: 5, trust: 1,
    hang: ["nightlife Instagram", "promoter WhatsApp groups", "r/DJs"],
    sub: ["techno collectives", "student-night promoters", "drag-night hosts"],
    when: ["freshers' week", "New Year's Eve"], ally: "venues and DJs",
    pains: [
      { id: "tickets", type: "growth", reel: "TICKET SALES", noun: "Ticket", thing: "half the tickets sold in the final week", task: "sell out nights before the final week", result: "sell out two weeks early", data: "past guest lists and ticket data" },
      { id: "flyers", type: "content", reel: "FLYERS", noun: "Flyer", thing: "a flyer made at 3am in Canva", task: "make flyers, lineup reveals and hype posts", result: "make every night look like the place to be", data: "lineups, venues and past photos" },
    ],
  },

  // BLACK SHEEP: unglamorous, awkward, often recession-proof. `gentle`
  // niches involve grief, care or family breakdown: the machine refuses to
  // make those degenerate and sells through partners instead of forums.
  {
    id: "funeral", set: "sheep", label: "funeral directors", reel: "FUNERAL HOMES", q: "running an independent funeral home", wallet: 3, reach: 2, trust: 2, local: true, gentle: true,
    hang: ["funeral-director association forums", "funeral-trade LinkedIn groups", "industry trade-show communities"],
    sub: ["independent funeral homes", "direct-cremation providers", "green-burial sites"],
    when: ["winter, their busiest season", "the week a price-transparency rule lands"], ally: "celebrants and florists",
    pains: [
      { id: "tributes", type: "content", reel: "TRIBUTES", noun: "Tribute", thing: "families writing obituaries at midnight", task: "draft obituaries and orders of service with the family", result: "take one painful job off a grieving family", data: "family notes and photos" },
      { id: "prices", type: "risk", reel: "PRICE LISTS", noun: "Price List", thing: "price lists that break transparency rules", task: "publish clear, compliant price lists", result: "stay on the right side of the regulator", data: "service lists and prices" },
    ],
  },
  {
    id: "bereaved", set: "sheep", label: "bereaved families", reel: "DEATH ADMIN", q: "handling a parent's affairs", wallet: 1, reach: 3, trust: 2, gentle: true,
    hang: ["estate-planning Facebook groups", "probate forums", "later-life planning communities"],
    sub: ["executors doing it alone", "families settling an estate from abroad", "only children"],
    when: ["the weeks after the funeral", "probate application time"], ally: "probate solicitors and funeral directors",
    pains: [
      { id: "accounts", type: "time", reel: "DEATH ADMIN", noun: "Death Admin", thing: "the 40 accounts to close after someone dies", task: "close accounts, cancel subscriptions and redirect post", result: "get through the admin without reliving the loss 40 times", data: "a list of the person's accounts" },
      { id: "legacy", type: "risk", reel: "DIGITAL LEGACY", noun: "Digital Legacy", thing: "social accounts still sending birthday reminders", task: "memorialise or close digital accounts", result: "stop the painful notifications", data: "account lists" },
    ],
  },
  {
    id: "divorce", set: "sheep", label: "divorcing parents", reel: "DIVORCE ADMIN", q: "splitting a household with kids", wallet: 2, reach: 3, trust: 2, gentle: true,
    hang: ["co-parenting Facebook groups", "r/Divorce", "separated-parents forums"],
    sub: ["co-parents of teenagers", "separating homeowners", "long-distance co-parents"],
    when: ["the first school holidays apart", "the week the solicitor asks for disclosure"], ally: "family mediators and divorce solicitors",
    pains: [
      { id: "coparent", type: "time", reel: "CO-PARENTING", noun: "Co-Parenting", thing: "schedule fights over text", task: "run custody schedules, expenses and handovers in one place", result: "argue less and screenshot less", data: "custody arrangements and expenses" },
      { id: "disclosure", type: "leak", reel: "ASSET SPLIT", noun: "Disclosure", thing: "a shoebox of paperwork a solicitor bills ¤300 an hour to sort", find: "missing statements and assets the solicitor will ask for", task: "organise finances into a disclosure-ready pack", result: "save thousands in legal fees", data: "bank, pension and mortgage statements" },
    ],
  },
  {
    id: "hoarding", set: "sheep", label: "hoarding cleanup crews", reel: "HOARDING CLEANUP", q: "clearing 5+ properties a month", wallet: 3, reach: 2, trust: 1, local: true, gentle: true,
    hang: ["cleaning-company Facebook groups", "trauma-cleaning forums", "landlord association forums"],
    sub: ["estate-clearance firms", "trauma cleaners", "deep-clean companies"],
    when: ["probate-sale season", "the month after winter evictions"], ally: "estate agents, landlords and council housing officers",
    pains: [
      { id: "quotes", type: "time", reel: "CLEARANCE QUOTES", noun: "Clearance Quote", thing: "quotes guessed from blurry photos", task: "quote clearances from photos and video walk-throughs", result: "quote within the hour and win more jobs", data: "room photos" },
      { id: "referrals", type: "growth", reel: "REFERRALS", noun: "Referral", thing: "work that only comes by word of mouth", task: "win referrals from estate agents, landlords and councils", result: "build a steady pipeline of referrals", data: "past jobs" },
    ],
  },
  {
    id: "pests", set: "sheep", label: "pest control firms", reel: "PEST CONTROL", q: "with 2–10 technicians", wallet: 2, reach: 3, trust: 1, local: true,
    hang: ["pest-control forums", "r/pestcontrol", "hotel and landlord associations"],
    sub: ["bed bug specialists", "rodent-control firms", "commercial-kitchen contractors"],
    when: ["summer bed bug season", "the week a hotel gets a viral review"], ally: "hotel managers and letting agents",
    pains: [
      { id: "contracts", type: "growth", reel: "HOTEL CONTRACTS", noun: "Contract", thing: "one-off callouts instead of contracts", task: "sell monitoring contracts to hotels and landlords", result: "turn callouts into monthly contracts", data: "service histories" },
      { id: "reports", type: "time", reel: "SERVICE REPORTS", noun: "Service Report", thing: "handwritten service reports", task: "turn site photos into inspection reports", result: "send audit-ready reports from the van", data: "site photos and notes" },
    ],
  },
  {
    id: "septic", set: "sheep", label: "septic and grease-trap firms", reel: "SEPTIC & GREASE", q: "serving rural homes and restaurants", wallet: 3, reach: 2, trust: 1, local: true,
    hang: ["wastewater trade forums", "r/septic", "restaurant-owner Facebook groups"],
    sub: ["grease-trap cleaners", "septic pumpers", "portable-toilet companies"],
    when: ["the spring thaw", "restaurant inspection season"], ally: "restaurant consultants and plumbers",
    pains: [
      { id: "logs", type: "risk", reel: "SERVICE LOGS", noun: "Service Log", thing: "restaurants failing inspections over missing grease-trap logs", find: "missing or overdue grease-trap logs", task: "keep compliance logs and reminders for every client", result: "never let a client fail an inspection", data: "service records" },
      { id: "routes", type: "time", reel: "PUMP ROUTES", noun: "Route", thing: "pump trucks zig-zagging across the county", task: "plan pumping routes and reminders", result: "fit two more jobs into every day", data: "client addresses and schedules" },
    ],
  },
  {
    id: "carers", set: "sheep", label: "family carers", reel: "FAMILY CARERS", q: "juggling a job and an ageing parent", wallet: 1, reach: 3, trust: 2, gentle: true,
    hang: ["carer support forums", "r/AgingParents", "carer Facebook groups"],
    sub: ["long-distance carers", "dementia carers", "only children caring alone"],
    when: ["after a hospital discharge", "the first winter alone"], ally: "home-care agencies and GP surgeries",
    pains: [
      { id: "supplies", type: "time", reel: "CARE SUPPLIES", noun: "Care Supply", thing: "emergency 9pm runs for incontinence pads", task: "set up discreet, auto-refilled care supplies", result: "never run out of the things nobody wants to buy in public", data: "care needs and sizes" },
      { id: "rota", type: "time", reel: "CARE ROTA", noun: "Care Rota", thing: "siblings arguing over who visits", task: "coordinate visits, medication reminders and updates between siblings", result: "share the load fairly", data: "family schedules" },
    ],
  },
  {
    id: "petloss", set: "sheep", label: "pet crematoriums", reel: "PET AFTERCARE", q: "running 1–3 independent sites", wallet: 2, reach: 3, trust: 1, gentle: true,
    hang: ["vet practice-manager groups", "pet-aftercare association forums", "veterinary LinkedIn groups"],
    sub: ["horse-cremation services", "exotic-pet aftercare", "home-euthanasia vets"],
    when: ["the run-up to Christmas", "the week a corporate chain buys the local vet"], ally: "independent vets",
    pains: [
      { id: "memorials", type: "content", reel: "PET MEMORIALS", noun: "Memorial", thing: "owners who want more than an urn", task: "create memorial books, portraits and paw-print keepsakes", result: "add a ¤90 keepsake to every cremation", data: "pet photos and stories", merch: "pet memorial prints and keepsakes" },
      { id: "vets", type: "growth", reel: "VET REFERRALS", noun: "Vet Referral", thing: "vets who default to the corporate crematorium", task: "win referrals from independent vets", result: "become the local vets' first call", data: "service lists" },
    ],
  },
  {
    id: "lice", set: "sheep", label: "head lice clinics", reel: "LICE CLINICS", q: "near school catchment areas", wallet: 2, reach: 3, trust: 1, local: true,
    hang: ["school-parent Facebook groups", "lice-clinic owner forums", "local parent WhatsApp groups"],
    sub: ["mobile lice technicians", "nit-comb product sellers", "school-nurse services"],
    when: ["the first week back at school", "the day the \"letter home\" goes out"], ally: "pharmacists and school nurses",
    pains: [
      { id: "outbreaks", type: "growth", reel: "OUTBREAKS", noun: "Outbreak Alert", thing: "panicked parents Googling at 10pm", task: "alert local parents when a school outbreak starts", result: "become the first number parents call", data: "school calendars and local reports" },
    ],
  },
  {
    id: "hr", set: "sheep", label: "HR teams", reel: "HR TEAMS", q: "at 50–500 person companies", wallet: 4, reach: 3, trust: 2, gentle: true,
    hang: ["r/humanresources", "HR LinkedIn groups", "HR professional networks"],
    sub: ["HR at retail chains", "HR at hospitals", "HR at law firms"],
    when: ["the week a tribunal case makes the news", "annual policy review"], ally: "employment lawyers and occupational-health providers",
    pains: [
      { id: "menopause", type: "risk", reel: "MENOPAUSE POLICY", noun: "Menopause Policy", thing: "a workforce going through menopause with no policy", find: "policy gaps that leave menopausal staff unsupported", task: "write a menopause policy, manager training and adjustments guide", result: "keep experienced staff and avoid tribunal claims", data: "current HR policies" },
      { id: "talks", type: "skill", reel: "AWKWARD TALKS", noun: "Awkward Talk", thing: "managers who dodge awkward conversations", task: "train managers for the conversations nobody wants to have", result: "handle it well the first time" },
    ],
  },
  {
    id: "toilets", set: "sheep", label: "portable toilet firms", reel: "PORTALOO HIRE", q: "with 50+ units", wallet: 3, reach: 2, trust: 1, local: true,
    hang: ["event-supplier networks", "construction site-manager groups", "wedding-venue owner groups"],
    sub: ["luxury restroom-trailer hire", "construction-site sanitation", "festival sanitation"],
    when: ["festival booking season in February", "the week before a heatwave"], ally: "event planners and site managers",
    pains: [
      { id: "quotes", type: "time", reel: "EVENT QUOTES", noun: "Event Quote", thing: "quoting every festival by hand", task: "quote units, servicing and delivery for any event size", result: "answer quote requests in minutes", data: "event sizes and durations" },
      { id: "weddings", type: "growth", reel: "LUXURY LOOS", noun: "Luxury Loo", thing: "couples who hate the idea of a portaloo", task: "sell luxury restroom trailers to weddings", result: "charge ¤1,500 a weekend per trailer", data: "venues and guest counts" },
    ],
  },
  {
    id: "wastesites", set: "sheep", label: "waste-site operators", reel: "WASTE SITES", q: "running a permitted transfer station or yard", wallet: 3, reach: 2, trust: 2, local: true,
    hang: ["waste-industry LinkedIn groups", "recycling-trade forums", "trade-association newsletters"],
    sub: ["skip-hire operators", "scrap-metal recyclers", "transfer-station managers"],
    when: ["the week the quarterly permit return is due", "the month gate fees rise"], ally: "environmental consultants",
    pains: [
      { id: "returns", type: "risk", reel: "COMPLIANCE", noun: "Compliance", thing: "permit returns rebuilt from weighbridge tickets by hand", find: "missing waste transfer notes, tonnage gaps and overdue permit returns", task: "compile permit returns and duty-of-care records", result: "file every return on time and pass every site audit", data: "weighbridge tickets and waste transfer notes" },
      { id: "tonnage", type: "leak", reel: "TONNAGE", noun: "Tonnage", thing: "loads charged at the wrong rate", find: "loads invoiced at the wrong rate or not at all", task: "reconcile weighbridge tickets against invoices", result: "bill every tonne that comes through the gate", data: "weighbridge exports and invoices" },
    ],
  },
  {
    id: "couriers", set: "sheep", label: "local courier firms", reel: "COURIERS", q: "running 3–20 vans", wallet: 3, reach: 2, trust: 1, local: true,
    hang: ["courier-owner Facebook groups", "r/couriersofreddit", "logistics LinkedIn groups"],
    sub: ["same-day couriers", "pharmacy delivery firms", "pallet-network members"],
    when: ["peak season in November", "the week fuel prices jump"], ally: "local e-commerce brands",
    pains: [
      { id: "routes", type: "time", reel: "ROUTES", noun: "Route", thing: "drivers planning routes on their phones at 7am", task: "plan multi-drop routes every morning", result: "fit 20% more drops into every van", data: "delivery lists and addresses" },
      { id: "pod", type: "leak", reel: "FAILED DROPS", noun: "Proof-of-Delivery", thing: "\"never arrived\" claims they can't disprove", find: "claims with no photo, signature or GPS trail", task: "capture proof of delivery on every drop", result: "stop paying out for parcels that did arrive", data: "delivery photos and driver logs" },
    ],
  },
  {
    id: "importers", set: "sheep", label: "small importers", reel: "IMPORTERS", q: "bringing in 10+ containers a year", wallet: 3, reach: 2, trust: 2,
    hang: ["import-export LinkedIn groups", "freight-forwarder forums", "r/FulfillmentByAmazon"],
    sub: ["furniture importers", "private-label Amazon importers", "specialty-food importers"],
    when: ["the week tariffs change", "Q3 peak shipping season"], ally: "freight forwarders and customs brokers",
    pains: [
      { id: "customs", type: "risk", reel: "CUSTOMS DOCS", noun: "Customs", thing: "containers held at port over one wrong commodity code", find: "wrong commodity codes and missing certificates", task: "check customs paperwork before a shipment sails", result: "clear customs first time", data: "invoices, packing lists and commodity codes" },
      { id: "duties", type: "leak", reel: "OVERPAID DUTY", noun: "Duty Refund", thing: "import duty overpaid for years", find: "duty overpaid under the wrong tariff code", task: "claim back overpaid import duty", result: "recover years of overpaid duty", data: "import entries and tariff codes" },
    ],
  },
];

// STEAL LIKE AN ENGINEER: a proven model, re-aimed at a niche that
// doesn't have one yet. Named companies are cited only to describe their
// business model; generated product names never use them.
export const MODELS = [
  {
    id: "carfax", source: "Carfax", reel: "CARFAX", format: "audit", what: "a paid history report on an expensive used thing, bought right before the purchase",
    names: ["{N} History Check", "{N} Background Report", "The {N} Pre-Purchase Check"], pay: (b) => ({ one: b.kit * 1.5 }), offer: "{one} per report",
    t1: "{one} per report", t2: "{club}/month watchlist: new listings checked before they see them",
    first: "run 5 free reports for buyers in {hang} and post the most shocking finding (anonymised)",
    targets: [
      { id: "campervan", niche: "vanlife", aim: "used camper van buyers", wallet: 2, noun: "Camper Van", who: "people buying a used camper van for ¤20k+", type: "risk", twist: "A pre-purchase report on used camper vans: damp, dodgy electrics, weight limits and conversion quality, checked before the buyer hands over ¤30k.", thing: "hidden damp, dodgy electrics and an overweight conversion", task: "check a used camper van before buying", result: "buy a van without inheriting someone else's mistakes", data: "listings, seller photos and registration details" },
      { id: "guitar", niche: "musicians", aim: "vintage guitar buyers", wallet: 2, noun: "Vintage Guitar", who: "players buying a vintage guitar for ¤2k+", type: "risk", twist: "A pre-purchase report on vintage guitars: originality, refinishes, swapped parts and stolen-instrument checks, before the money moves.", thing: "refinishes, swapped parts and stolen instruments", task: "check a vintage guitar before buying", result: "pay vintage prices only for genuinely vintage guitars", data: "listing photos and serial numbers" },
      { id: "store", niche: "shopify", aim: "online-store buyers", noun: "Store", who: "people buying an online store for ¤20k–¤200k", type: "risk", twist: "Due-diligence reports for people buying small online stores: real traffic, refund rates, ad dependence and supplier risk, before they wire the money.", thing: "inflated traffic, hidden refunds and one-supplier risk", task: "check an online store before buying it", result: "buy a store that's worth what they paid", data: "store analytics, payouts and supplier contracts" },
      { id: "shortlet", niche: "airbnb", aim: "short-let investors", noun: "Short-Let", who: "investors buying their first short-let property", type: "risk", twist: "A pre-purchase report on would-be short-lets: local licensing rules, realistic occupancy, and what the reviews of the flat next door say.", thing: "licensing bans and fantasy occupancy numbers", task: "check a property's short-let potential before buying", result: "buy a short-let that actually pays", data: "addresses and local listing data" },
    ],
  },
  {
    id: "calendly", source: "Calendly", reel: "CALENDLY", format: "saas", what: "a self-serve booking link that kills the back-and-forth",
    names: ["{N} Booker", "{N} Slots", "Book-A-{N}"], pay: (b) => ({ rec: b.rec * 1.5 }),
    targets: [
      { id: "groom", niche: "groomers", noun: "Groom", type: "time", twist: "A booking link that knows a Newfoundland takes three hours and a chihuahua takes 40 minutes, and takes a deposit for both.", thing: "back-and-forth texts and no-show deposits", task: "take bookings by breed, coat and deposit", result: "fill the diary without a single text", data: "breeds, coat types and durations" },
      { id: "lesson", niche: "instructors", noun: "Lesson", type: "time", twist: "A booking link for driving instructors that handles pick-up points, block bookings and the test-day slot.", thing: "booking lessons by text between lessons", task: "take lesson bookings and payments", result: "never text a booking again", data: "diaries and pick-up points" },
      { id: "session", niche: "therapists", noun: "Session", type: "time", twist: "Booking built for therapy: intake forms, cancellation fees, and reminders that never say \"therapy\" on a lock screen.", thing: "admin that leaks private details", task: "take bookings with intake and cancellation policies", result: "run bookings discreetly", data: "availability and intake forms" },
      { id: "truck", niche: "foodtrucks", noun: "Truck", type: "growth", twist: "A booking link for private events: date, headcount and menu tier, with a deposit that locks the date.", thing: "event enquiries that never commit", task: "take private-event bookings with deposits", result: "turn enquiries into paid dates", data: "menus and availability" },
    ],
  },
  {
    id: "duolingo", source: "Duolingo", reel: "DUOLINGO", format: "saas", what: "a five-minute daily streak that makes learning addictive",
    names: ["{N} Streak", "Daily {N}", "{N} Drills"], pay: (b) => ({ rec: Math.max(5, b.rec) }),
    targets: [
      { id: "revision", niche: "students", noun: "Revision", type: "skill", twist: "Five-minute daily revision streaks built from their own lecture notes, with a leaderboard for their course.", thing: "cramming", task: "revise in five-minute daily streaks", result: "remember it on exam day", data: "lecture notes" },
      { id: "drugcalc", niche: "nurses", noun: "Drug Calc", type: "skill", twist: "Five-minute daily drug-calculation drills with streaks, so the maths is automatic at 3am on a night shift.", thing: "rusty drug-calculation maths", task: "practise drug calculations daily", result: "make the maths automatic", data: "calculation types" },
      { id: "barista", niche: "cafes", aim: "new café staff", noun: "Barista", type: "skill", twist: "Three-minute daily drills for new café staff (menu, allergens and milk ratios) with a streak the manager can see.", thing: "new staff who don't know the allergens", task: "train new staff in three-minute drills", result: "get new staff shift-ready in a week", data: "menus and allergen sheets" },
      { id: "regs", niche: "trades", aim: "trainee electricians", noun: "Wiring Regs", type: "skill", twist: "Five-minute daily drills on wiring regulations for electricians heading into an exam, with streaks.", thing: "exam-day blanks on the regs", task: "drill the regulations daily", result: "pass the regs exam first time", data: "regulation topics" },
    ],
  },
  {
    id: "headspace", source: "Headspace", reel: "HEADSPACE", format: "saas", what: "a subscription of short audio sessions for one specific state of mind",
    names: ["{N} Reset", "Calm {N}", "{N} Mind"], pay: (b) => ({ rec: Math.max(5, b.rec) }),
    targets: [
      { id: "nightshift", niche: "nurses", aim: "night-shift nurses", noun: "Night Shift", type: "mind", twist: "Ten-minute wind-down audio for the drive home after a night shift, plus a sleep plan for rota changes.", thing: "wired-but-exhausted drives home", task: "wind down after night shifts", result: "actually sleep after nights", data: "shift patterns" },
      { id: "datenerves", niche: "dating", aim: "nervous first-daters", noun: "Date Nerves", type: "mind", twist: "Short audio sessions for the 20 minutes before a first date, for people who dread first dates.", thing: "pre-date panic", task: "calm down before a first date", result: "walk in relaxed", data: "date times" },
      { id: "speechnerves", niche: "bestmen", noun: "Speech Nerves", type: "mind", twist: "A seven-day audio course for people terrified of speaking at a wedding, ending with a rehearsal session on the morning.", thing: "wedding-speech terror", task: "rehearse and calm down before the speech", result: "deliver the speech without shaking", data: "the speech draft" },
      { id: "carerreset", niche: "carers", noun: "Carer", type: "mind", twist: "Five-minute resets for family carers, built for the car park after a hard visit.", thing: "carer burnout", task: "decompress after hard visits", result: "keep going without burning out", data: "visit schedules" },
    ],
  },
  {
    id: "dollarshave", source: "Dollar Shave Club", reel: "DOLLAR SHAVE", format: "refill", what: "a cheap subscription that auto-refills a boring consumable",
    names: ["The {N} Club", "{N} Refill", "Never Out Of {N}"],
    targets: [
      { id: "caresupplies", niche: "carers", noun: "Care Supplies", type: "time", twist: "Discreet monthly delivery of incontinence pads, wipes and gloves, sized once and never bought in a supermarket queue again.", thing: "embarrassing, last-minute supply runs", task: "auto-refill care supplies", result: "never run out", data: "sizes and quantities" },
      { id: "turnover", niche: "airbnb", noun: "Turnover Kit", type: "time", twist: "Monthly turnover kits for hosts: toiletries, coffee pods, bin bags and dishwasher tabs, pre-counted per booking.", thing: "supermarket runs between guests", task: "restock between guests", result: "turn over a listing without a shopping trip", data: "booking counts" },
      { id: "packaging", niche: "etsy", noun: "Packaging", type: "time", twist: "Branded packaging on auto-refill, counted from their order volume so they never run out in December.", thing: "running out of mailers mid-rush", task: "keep packaging stocked", result: "ship through Q4 without a packaging panic", data: "order volumes" },
      { id: "truckpack", niche: "foodtrucks", noun: "Truck Consumables", type: "time", twist: "Compostable packaging and napkins on auto-refill, sized to the event calendar.", thing: "running out of boxes mid-festival", task: "keep consumables stocked for every event", result: "never run out of packaging mid-service", data: "event calendars" },
    ],
  },
  {
    id: "zillow", source: "Zillow", reel: "ZESTIMATE", format: "calculator", what: "an instant automated valuation that pulls owners in the door",
    names: ["What's My {N} Worth?", "The {N} Valuer", "The {N} Estimate"],
    first: "share the free valuation tool in {hang} and sell a full report to anyone thinking of selling",
    targets: [
      { id: "newsletter", niche: "newsletters", noun: "Newsletter", type: "growth", twist: "Instant newsletter valuations: subscribers, open rate and niche in, a sale-price range out. Brokers pay for the leads.", thing: "not knowing what the newsletter is worth", task: "value a newsletter in 60 seconds", result: "know their exit number", data: "subscriber and revenue stats" },
      { id: "channel", niche: "youtubers", noun: "Channel", type: "growth", twist: "Instant channel valuations for YouTubers thinking of selling, with a paid due-diligence report for buyers.", thing: "guessing what a channel is worth", task: "value a channel from its stats", result: "know what the channel would sell for", data: "channel analytics" },
      { id: "collection", niche: "sneakers", aim: "sneaker collectors", noun: "Collection", type: "growth", twist: "Instant valuations of a whole sneaker collection from a photo of the shelf, with sell-now or hold advice.", thing: "a shelf of unknown value", task: "value a collection from one photo", result: "know what to sell and what to hold", data: "shelf photos" },
      { id: "saasvalue", niche: "saas", noun: "SaaS", type: "growth", twist: "An instant sale-price estimate for small SaaS from its Stripe numbers, paid for by referring sellers to brokers.", thing: "no idea what the company is worth", task: "value a SaaS from its revenue data", result: "know the exit number before the call", data: "Stripe revenue data" },
    ],
  },
  {
    id: "grammarly", source: "Grammarly", reel: "GRAMMARLY", format: "extension", what: "an assistant that sits where people write and fixes one specific thing",
    names: ["{N} Checker", "{N} Lint", "{N} Proofreader"],
    targets: [
      { id: "notice", niche: "landlords", noun: "Notice", type: "risk", twist: "A writing checker for landlord letters that flags anything that could read as harassment or break notice rules before it's sent.", thing: "letters that turn into legal disputes", task: "check tenant letters before sending", result: "send letters that hold up", data: "draft letters" },
      { id: "therapynote", niche: "therapists", noun: "Note", type: "risk", twist: "A checker for therapy notes that flags identifying details and judgemental language before notes are filed.", thing: "notes that wouldn't survive a subject-access request", task: "check session notes before filing", result: "keep notes safe to share", data: "draft notes" },
      { id: "jobad", niche: "recruiters", noun: "Job Ad", type: "risk", twist: "A checker that flags biased or exclusionary wording in job ads before they go live.", thing: "job ads that quietly shrink the candidate pool", task: "check job ads for biased wording", result: "attract a wider shortlist", data: "job-ad drafts" },
      { id: "listingcheck", niche: "realtors", noun: "Listing", type: "risk", twist: "A checker that flags risky claims and discriminatory wording in property listings before they publish.", thing: "listing claims that invite complaints", task: "check listings before they go live", result: "publish listings without regulator trouble", data: "listing drafts" },
    ],
  },
  {
    id: "rover", source: "Rover", reel: "ROVER", format: "marketplace", what: "a trusted local marketplace for looking after the things people love most",
    names: ["{N} Sitters", "{N} Minders", "Trusted {N} Care"],
    targets: [
      { id: "vansit", niche: "vanlife", noun: "Van", type: "time", twist: "Vetted van-sitters: secure parking, battery checks and a weekly engine start while the owner flies home for a month.", thing: "leaving the van alone for a month", task: "find someone trustworthy to van-sit", result: "fly home without worrying about the van", data: "van details and dates" },
      { id: "commissions", niche: "minis", noun: "Army", type: "growth", twist: "A marketplace for painting commissions: players post an army, vetted painters bid, and payment is held until the photos are approved.", thing: "commissions that go wrong", task: "find a painter they can trust", result: "get an army painted without the risk", data: "army lists and reference photos" },
      { id: "backline", niche: "musicians", noun: "Backline", type: "time", twist: "Musicians renting their backline to touring bands, insured and checked in and out with photos.", thing: "hauling amps across the country", task: "rent backline locally", result: "tour without hauling gear", data: "gear lists and dates" },
    ],
  },
  {
    id: "masterclass", source: "MasterClass", reel: "MASTERCLASS", format: "course", what: "famous-expert video lessons, sold on the name",
    names: ["{N} Masters", "Masters of {N}", "The {N} Masters Series"],
    targets: [
      { id: "trade", niche: "trades", noun: "Trade", type: "skill", twist: "Retired master tradespeople teaching the tricks the apprenticeship skipped, filmed on real jobs.", thing: "tricks that retire with the old-timers", task: "learn from master tradespeople", result: "work faster and price better", data: "job types" },
      { id: "hotelier", niche: "hotels", aim: "small-hotel owners", noun: "Hospitality", type: "skill", twist: "Legendary hoteliers teaching small-hotel owners how they built repeat guests.", thing: "guests who never come back", task: "learn guest loyalty from the best", result: "build a hotel people return to", data: "guest data" },
      { id: "streetfood", niche: "foodtrucks", aim: "street-food traders", noun: "Street Food", type: "skill", twist: "Street-food legends teaching the ops: pitch fees, menus that move fast, and surviving a rained-off festival.", thing: "expensive lessons learned the hard way", task: "learn street-food operations", result: "make money at every event", data: "event types" },
    ],
  },
  {
    id: "canva", source: "Canva", reel: "CANVA", format: "kit", what: "drag-and-drop templates that make non-designers look professional",
    names: ["{N} Studio", "{N} Maker", "Make My {N}"],
    targets: [
      { id: "orderofservice", niche: "funeral", noun: "Order of Service", type: "content", twist: "Order-of-service templates families can fill in on a phone, printed by the funeral home by the next morning.", thing: "orders of service designed at midnight", task: "design an order of service", result: "take one job off the family", data: "photos and readings" },
      { id: "menuboard", niche: "cafes", noun: "Menu Board", type: "content", twist: "Menu-board and specials templates sized for chalkboards, TVs and Instagram at once.", thing: "specials boards nobody can read", task: "design menus and specials", result: "sell the specials", data: "menus" },
      { id: "impact", niche: "nonprofits", noun: "Impact Report", type: "content", twist: "Impact-report templates that turn a spreadsheet of numbers into a donor-ready PDF.", thing: "impact reports nobody reads", task: "turn numbers into an impact report", result: "make donors give again", data: "impact numbers" },
      { id: "overlay", niche: "streamers", noun: "Stream Overlay", type: "content", twist: "Overlay and alert packs for small streamers, themed per game.", thing: "default overlays", task: "brand a stream", result: "look like a bigger channel", data: "game and brand colours" },
    ],
  },
  {
    id: "honey", source: "Honey", reel: "HONEY", format: "extension", what: "a browser extension that finds savings at the exact moment of paying",
    names: ["{N} Saver", "{N} Sniper", "Cheaper {N}"],
    targets: [
      { id: "renewal", niche: "agencies", noun: "SaaS Renewal", type: "leak", twist: "A browser extension that pops up on SaaS renewal pages with the discount other companies negotiated.", thing: "paying list price for every renewal", task: "negotiate SaaS renewals", result: "cut the software bill by 20%", data: "renewal pages" },
      { id: "supplies", niche: "etsy", noun: "Supplies", type: "leak", twist: "Finds the same craft supplies cheaper at wholesalers while they shop.", thing: "paying retail for supplies", task: "find wholesale prices for supplies", result: "widen the margin on every order", data: "shopping carts" },
      { id: "materials", niche: "construction", noun: "Materials", type: "leak", twist: "Compares materials prices across merchants at checkout and flags trade-discount codes.", thing: "overpaying for materials", task: "compare materials prices", result: "buy materials at trade price", data: "merchant carts" },
    ],
  },
  {
    id: "rentit", source: "Airbnb", reel: "AIRBNB", format: "marketplace", what: "renting out an underused asset by the hour or the night",
    names: ["{N} Share", "Rent My {N}", "{N} By The Hour"],
    targets: [
      { id: "kitchen", niche: "cafes", noun: "Kitchen", type: "leak", twist: "Renting café kitchens after closing time to bakers and meal-prep startups, by the hour.", thing: "a kitchen that earns nothing after 4pm", task: "rent out the kitchen after hours", result: "earn from the kitchen while it's closed", data: "kitchen hours and equipment" },
      { id: "studio", niche: "studios", noun: "Studio", type: "leak", twist: "Filling empty studio hours by renting them to therapists, dance teachers and photographers.", thing: "empty studio hours", task: "rent out empty studio hours", result: "earn from every empty hour", data: "studio calendars" },
      { id: "booth", niche: "musicians", aim: "home-studio owners", noun: "Vocal Booth", type: "leak", twist: "Bedroom-studio owners renting their booth by the hour to vocalists and podcasters.", thing: "a studio that sits idle", task: "rent out a home studio by the hour", result: "make the studio pay for itself", data: "studio calendars" },
      { id: "driveway", niche: "landlords", noun: "Parking Space", type: "leak", twist: "Landlords renting unused driveways and garages to commuters and EV owners by the month.", thing: "empty driveways and garages", task: "rent out unused parking", result: "earn from dead space", data: "property lists" },
    ],
  },
  {
    id: "tinder", source: "Tinder", reel: "TINDER", format: "marketplace", what: "swipe-to-match for two sides that need each other",
    names: ["Swipe {N}", "{N} Match", "{N} Swipe"],
    targets: [
      { id: "codev", niche: "gamedev", noun: "Co-Dev", type: "growth", twist: "Swipe-matching for indie devs who need an artist, a composer or a programmer, with portfolios instead of selfies.", thing: "hunting for collaborators on Discord", task: "find a collaborator", result: "find the missing teammate this month", data: "portfolios" },
      { id: "bandmate", niche: "musicians", noun: "Bandmate", type: "growth", twist: "Swipe-matching musicians to bands by genre, gear and how often they actually rehearse.", thing: "bands that fall apart over flaky members", task: "find a committed bandmate", result: "find a bandmate who shows up", data: "genres, gear and schedules" },
      { id: "cofounder", niche: "saas", noun: "Co-Founder", type: "growth", twist: "Swipe-matching technical and non-technical co-founders, with a paid 30-day trial project built in.", thing: "co-founder searches that take a year", task: "find a co-founder", result: "test-drive a co-founder in 30 days", data: "skills and ideas" },
    ],
  },
  {
    id: "turbotax", source: "TurboTax", reel: "TURBOTAX", format: "saas", what: "guided self-serve for scary paperwork, one question at a time",
    names: ["{N} Wizard", "Easy {N}", "{N} Step-By-Step"], pay: (b) => ({ one: b.kit * 3 }), offer: "{one} per case, guided start to finish",
    t1: "{one} per case, guided start to finish", t2: "{club}/month: every deadline tracked until the case closes",
    targets: [
      { id: "probate", niche: "bereaved", aim: "executors", noun: "Probate", type: "risk", twist: "A question-by-question guide through probate paperwork, with a checklist of every account to close (information, not legal advice).", thing: "probate paperwork", task: "work through probate step by step", result: "finish probate without a ¤3k bill", data: "estate details" },
      { id: "cryptotax", niche: "crypto", noun: "Crypto Tax", type: "risk", twist: "Question-by-question crypto tax filing built for people with 4,000 memecoin trades.", thing: "a tax return they can't face", task: "file crypto taxes step by step", result: "file without the panic", data: "wallet exports" },
      { id: "disclosure", niche: "divorce", noun: "Financial Disclosure", type: "risk", twist: "A guided, question-by-question financial disclosure pack, so the solicitor starts from a finished file.", thing: "disclosure paperwork billed by the hour", task: "prepare financial disclosure step by step", result: "cut the legal bill", data: "financial statements" },
    ],
  },
  {
    id: "strava", source: "Strava", reel: "STRAVA", format: "saas", what: "social tracking that turns a solitary hobby into a feed and a leaderboard",
    names: ["{N} Log", "{N} Feed", "{N} Leaderboard"],
    targets: [
      { id: "paintlog", niche: "minis", noun: "Paint", type: "mind", twist: "A feed where painters log hours and finished models, with streaks to beat the pile of shame.", thing: "painting alone with no motivation", task: "log painting sessions", result: "finish more models", data: "painting sessions" },
      { id: "investigation", niche: "ghosts", noun: "Investigation", type: "growth", twist: "A feed of investigations with evidence uploads, venue leaderboards and the most active locations this month.", thing: "evidence that dies on a hard drive", task: "log and share investigations", result: "build a following of fellow investigators", data: "evidence clips" },
      { id: "route", niche: "vanlife", noun: "Route", type: "time", twist: "A social route log for van lifers: legal overnight spots, water points and who's parked nearby.", thing: "travelling solo with no local knowledge", task: "log and share routes", result: "always know the next safe spot", data: "routes and spots" },
    ],
  },
  // Massive SaaS, scaled down to one micro-niche.
  {
    id: "salesforce", source: "Salesforce", reel: "SALESFORCE", format: "saas", what: "a CRM that remembers every customer and tells you who to call next",
    names: ["{N} CRM", "{N} Book", "{N} HQ"], pay: (b) => ({ rec: b.rec * 1.5 }),
    targets: [
      { id: "mobilegroom", niche: "groomers", aim: "mobile dog groomers", noun: "Groom", who: "mobile dog groomers running one or two vans", type: "time", twist: "A CRM built around the van: every dog's coat, temperament and vaccination date, tomorrow's route, and an automatic text when each dog is due back.", thing: "client details scattered across texts, a paper diary and the van's dashboard", task: "keep every dog, owner and due date in one place", result: "rebook every dog before it's matted", data: "client texts, diaries and breed notes" },
      { id: "boilers", niche: "trades", aim: "heating engineers", noun: "Boiler", who: "heating engineers servicing 300+ boilers a year", type: "leak", twist: "A CRM of every boiler they've ever fitted: its warranty, its annual service, and reminders that book the job for them.", thing: "annual services nobody reminded the customer about", task: "track every installed boiler and its service date", result: "turn every install into a yearly service", data: "job sheets and install records" },
      { id: "couples", niche: "weddingphoto", noun: "Wedding", type: "growth", twist: "A CRM for the wedding pipeline: every couple's date, venue and contract stage, and the one follow-up that turns an enquiry into a booking.", thing: "enquiries lost between Instagram DMs and email", task: "track every couple from enquiry to gallery", result: "book more of the couples who already enquired", data: "enquiry emails and contracts" },
      { id: "families", niche: "tutors", noun: "Tutor", type: "growth", twist: "A CRM for tutoring: every student's exam date, weak topics and parent contact, plus the invoice that's overdue.", thing: "students, parents and invoices tracked in three apps", task: "keep every student, parent and payment in one place", result: "keep families booked all year", data: "lesson notes and invoices" },
    ],
  },
  {
    id: "mailchimp", source: "Mailchimp", reel: "MAILCHIMP", format: "saas", what: "email marketing that turns a customer list into repeat sales",
    names: ["{N} Mail", "{N} Letter", "The {N} Post"], pay: (b) => ({ rec: b.rec }),
    targets: [
      { id: "pastclients", niche: "realtors", noun: "Market Update", type: "growth", twist: "A monthly local-market update, written from this month's sales and sent to every past client, so the next listing comes back to them.", thing: "past clients who forget their agent within a year", task: "email past clients a local-market update every month", result: "win the repeat and referral listings", data: "past-client lists and local sales data" },
      { id: "regulars", niche: "cafes", noun: "Regulars", type: "growth", twist: "A weekly specials email and a free birthday coffee, sent from the till's customer list.", thing: "regulars who drift to the chain", task: "email regulars the week's specials", result: "bring regulars back every week", data: "till customer lists" },
      { id: "patients", niche: "physio", noun: "Patient", type: "leak", twist: "Rehab tips and a rebooking nudge that land the week a patient's plan runs out.", thing: "patients who never come back for their last sessions", task: "email patients before their plan runs out", result: "finish more treatment plans", data: "booking data" },
    ],
  },
  {
    id: "quickbooks", source: "QuickBooks", reel: "QUICKBOOKS", format: "saas", what: "bookkeeping software that turns receipts into a tax-ready ledger",
    names: ["{N} Books", "{N} Ledger", "Easy {N} Books"], pay: (b) => ({ rec: b.rec }),
    targets: [
      { id: "sellerbooks", niche: "etsy", noun: "Seller", type: "leak", twist: "Bookkeeping that reconciles every order, fee and ad click per listing, so they know which products actually make money.", thing: "a profit number nobody can explain", task: "reconcile orders, fees and ad spend per listing", result: "know their real profit per product", data: "Etsy CSV exports" },
      { id: "brewbooks", niche: "brewers", noun: "Brewery", type: "risk", twist: "Duty, keg deposits and taproom sales in one ledger, with the duty return drafted each month.", thing: "duty and keg deposits tracked in a spreadsheet", task: "keep duty, deposits and sales in one ledger", result: "file duty with numbers they trust", data: "brew logs and sales records" },
      { id: "flipbooks", niche: "sneakers", noun: "Flip", type: "leak", twist: "Every pair's buy price, fees and sale in one ledger, with the tax figure ready in April.", thing: "a year of flips and no idea what was profit", task: "log every flip's buy price, fees and sale", result: "hand the accountant one clean number", data: "sales history and fees" },
    ],
  },
];

// Alternative pricing reached through MUTATE.
export const PRICING = {
  result: "free audit, then 20% of whatever it recovers",
  trial: "{cur}1 first month, then {rec}/month",
  pwyw: "pay what you want, suggested {anchor}",
  premium: "{premium} done-for-you setup, then {rec}/month",
  premiumOnce: "{premium} done-for-you version",
  names: [null, "PAY WHEN IT WORKS", "PREMIUM DONE-FOR-YOU"],
};

// MAKE IT CHEAPER walks down a stack ladder, per format kind: from the
// format's own `tier` (a custom SaaS, say) to Make.com + a Tally form, to a
// Notion template run by hand, to a presale that builds nothing at all.
export const LEAN = [
  null,
  {
    tier: { software: "MAKE.COM + TALLY FORM", service: "MAKE.COM + TALLY FORM", product: "NOTION TEMPLATE" },
    why: { software: "Make.com and a Tally form instead of custom code.", service: "Make.com and a Tally form instead of a coded pipeline.", product: "A Notion template instead of a designed product." },
    mvp: { product: ["a Gumroad page", "a Notion template", "a one-page quick-start"] },
  },
  {
    tier: { software: "NOTION TEMPLATE + YOU", service: "TALLY FORM + YOU", product: "ONE GOOGLE DOC" },
    why: { software: "A Notion template, with you doing what the software would.", service: "You do the work by hand behind a Tally form.", product: "One Google Doc, delivered by hand." },
    mvp: { software: ["a Notion page", "a Tally form", "you running it by hand"], service: ["a Carrd page", "a Tally form", "you doing it by hand"], product: ["a Google Doc", "a Stripe Payment Link", "you emailing it"] },
  },
  {
    tier: { software: "STRIPE LINK PRESALE", service: "STRIPE LINK PRESALE", product: "STRIPE LINK PRESALE" },
    why: { software: "Nothing gets built until three people pay.", service: "Nothing gets built until three people pay.", product: "Nothing gets built until three people pay." },
    mvp: { software: ["a Google Doc offer", "a Stripe Payment Link", "20 DMs"], service: ["a Google Doc offer", "a Stripe Payment Link", "20 DMs"], product: ["a Google Doc offer", "a Stripe Payment Link", "20 DMs"] },
  },
];
export const LEAN_MAXED = "ALREADY AT ¤0. THE ONLY THING LEFT TO CUT IS EXCUSES.";
const NO_CODE = [["Page", "Carrd"], ["Forms", "Tally"], ["Automation", "Make.com (free tier)"], ["Data", "Google Sheets or Airtable"], ["Payments", "Stripe Payment Links"], ["Intelligence", "A Claude step inside Make"]];
const PRESALE = [["Offer", "A Google Doc"], ["Payments", "A Stripe Payment Link"], ["Sales", "Your DMs"]];
export const LEAN_STACK = [
  null,
  { software: NO_CODE, service: NO_CODE, product: [["Product", "A Notion template (duplicate link)"], ["Storefront", "Gumroad"], ["Design", "Canva"], ["Email", "Gumroad workflows"]] },
  {
    software: [["Page", "A public Notion page"], ["Forms", "Tally"], ["Payments", "Stripe Payment Links"], ["Delivery", "You, working from a Notion template"], ["Intelligence", "Claude in a chat window"]],
    service: [["Page", "Carrd"], ["Forms", "Tally"], ["Payments", "Stripe Payment Links"], ["Delivery", "Gmail + you"], ["Intelligence", "Claude in a chat window"]],
    product: [["Product", "One Google Doc"], ["Payments", "A Stripe Payment Link"], ["Delivery", "You, by email"]],
  },
  { software: PRESALE, service: PRESALE, product: PRESALE },
];

export const DEGEN = {
  notes: [null, "DEGEN LVL 1: NO MORE MR NICE GUY", "DEGEN LVL 2: GOBLIN MODE", "DEGEN LVL 3: FULLY FERAL"],
  maxed: "PEAK DEGENERACY. ANY FURTHER AND IT STOPS BEING LEGAL.",
  refused: "REFUSED. SOME NICHES DON'T GET ROASTED. THIS IS ONE.",
  adjectives: ["Feral", "Unhinged", "Rogue", "Menace-Grade"],
  names: [null, null, ["{N} Goblin", "{N} Gremlin", "{N} Raccoon", "Goblin {N} Club"], ["{N} Goblin 9000", "Extremely Legal {N} Goblin", "The {N} Goblin Syndicate", "{N} Goblin (Final Form)"]],
  angles: [
    null,
    ["No fluff, no mercy.", "Brutal, fast, slightly rude.", "Says what everyone else is too polite to say."],
    ["Marketed exclusively through public roasts (with permission).", "The brand voice is a disappointed parent.", "Every report ends with an opt-in leaderboard of shame."],
    ["The mascot is a goblin in a tie. The goblin has opinions.", "The price ends in .66. Nobody knows why. It works.", "The pitch deck is one slide: a screenshot of the money."],
  ],
  tactics: [
    "roast 10 {label} publicly (with their permission) and let the comments do the selling",
    "run a weekly anonymised hall of shame in {hang}, with the fix attached",
    "livestream fixing one problem for {label} every day for 30 days",
    "put a {cur}50 bounty on referrals and announce every payout",
    "start a meme page for {label} and sell to the followers",
    "answer the 20 most-upvoted complaints about {thing} in {hang} with a genuinely useful free fix",
  ],
  pricing: {
    service: "{cur}1 to start, then 25% of whatever it saves or finds: no win, no fee",
    software: "{cur}6.66/month or {cur}666 lifetime, first 66 buyers only",
    product: "pay what you want, minimum {cur}1, suggested {anchor}",
  },
  guardrail: "Degen guardrail: roast with permission, anonymise everything, and never fake results, reviews or scarcity.",
};

// Go-to-market for gentle niches: through the people who already serve them.
export const GENTLE_FIRST = "offer {ally} the first 3 cases free for their clients, then ask for referrals";

export const HEADLINES = {
  leak: "You're losing money to {thing}.",
  time: "Never {task} by hand again.",
  growth: "{Result}.",
  content: "Never {task} from scratch again.",
  risk: "Stop worrying about {thing}.",
  skill: "{Result}. Finally.",
  mind: "{Result}.",
};

export const FAKE_IT = {
  service: ["You do the work behind the form until customer 10", "Reports and deliverables come from templates, not software"],
  product: ["Hand-deliver the first 10 copies with a personal note", "Answer every buyer question yourself; they become the FAQ"],
  software: ["Onboard every customer by hand on a call", "Run the \"automation\" manually for the first 5 customers"],
};

export const CUT = {
  service: ["A client portal", "Custom software", "A logo. Seriously."],
  product: ["A course platform", "A custom website", "Bonus #7"],
  software: ["User accounts (use magic links)", "Dashboards and settings pages", "A mobile app", "Team features"],
};
