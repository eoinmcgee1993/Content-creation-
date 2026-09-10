# Legal drafts — not deployed

`privacy.html`, `terms.html` and `legal-details.js` live here, outside
`crf-builder/`, and that location is the point. They used to sit next to the
pages that ship, and they reached production twice that way: at the time of
writing `https://crf-garage.netlify.app/privacy` was publicly serving a policy
naming the data controller as `[LEGAL ENTITY NAME]` at `[REGISTERED ADDRESS]`,
with the developer note "Before publishing: replace ..." visible on the page.

An ignore file would have prevented that. So would a careful deploy. Both had
to be remembered every time, by whoever was deploying, on every host. Being
outside the publish root does not.

## What is missing

Four facts about the business. Until they exist these documents cannot be
published, because a privacy policy whose data controller is a placeholder is
worse than no privacy policy:

1. the legal entity name
2. a registered or service address
3. a contact email that reaches a person
4. the governing law

They are blocked on the trading name, which is also what blocks the domain,
the email sending domain and the merchant name a buyer sees at checkout.

**Do not invent any of them.** `legal-details.js` renders each blank in red
with a banner across the page, so a half-finished draft is loud rather than
plausible.

## Publishing them, when those four facts exist

1. Fill the placeholders in both documents.
2. Check the factual claims still match the system. Both were written against
   Netlify Forms and Netlify hosting; if the site has moved host, or the ECU
   email capture has moved to Supabase, the "who processes your data" tables
   are wrong and must be corrected before publishing.
3. Move all three files into `crf-builder/`.
4. Link them from the page footers.
5. Deploy, and confirm `/privacy` and `/terms` answer 200 with no red blanks.
