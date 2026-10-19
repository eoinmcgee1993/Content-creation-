---
files: llm-wiki/sources/2026-09-29-crf-live-check.txt
commit: ec4767c
sha256: f86066d01b868fe92c4a7a9cff01facf759531da58b8ccae175772d1f8d4c545
ingested: 2026-09-29
---

# CRF live check, 2026-09-29

HTTP status codes, page titles and the state of the legal facts on the two
hosts the CRF docs name, captured to settle where the site is live.

## Provenance

- Raw file: `llm-wiki/sources/2026-09-29-crf-live-check.txt`. It was captured
  at 2026-09-29 20:35 UTC from a Claude Code cloud session with `curl`, with a
  retry on no response (`000`). A run a minute earlier recorded one transient
  `000` on the Vercel not-found path. Three retries returned 404, and that run
  was discarded before ingest.
- Origin: the validation routine in root `CLAUDE.md` §9 and in
  `docs/crf/DEPLOYMENT.md` "Verification", run against both hosts, plus
  `/privacy`, `/terms` and a path that should not exist.
- The capture deliberately records only whether each legal fact is set, not
  its value, because the values are a person's name, postal address and email.
- It is a snapshot, and says nothing about any other date.

## Status codes

- `crf-garage.netlify.app` returned 404 on all nine paths, including `/`.
- `crf-eoins-projects-99ff5888.vercel.app` returned 200 on `/`, `/apparel`,
  `/ecu`, `/mods`, `/approve`, `/desk`, `/privacy` and `/terms`. It returned
  404 on the made-up path, so the 200s are real pages, not a catch-all.

## Page titles

- `/` is "StreetSweeperCustoms — CRF250L Kit Builder".
- `/privacy` is "StreetSweeperCustoms — Privacy Policy".
- `/terms` is "StreetSweeperCustoms — Terms of Sale".
- The not-found page is "v0 App".

## Legal facts

- On the Vercel host, `legal-details.js` has all four facts set: `entity`,
  `address`, `email` and `law`.

## Connections

It settles hosting in favour of [[sources/crf-deployment-plan]], over
[[sources/root-claude-md]], [[sources/crf-system]] and
[[sources/productized-audit]]. It also shows the legal pages published, with a
trading name, on the live site. Feeds [[entities/crf-storefront]],
[[entities/vercel]] and [[entities/netlify]].
