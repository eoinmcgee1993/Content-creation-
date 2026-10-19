# Content-creation-

This repository is a multi-project workspace rather than a single app. Different
subdirectories are intentionally independent and may use different runtimes,
hosting strategies, and deployment constraints.

## Repo health snapshot

- `crf-builder/` is a static, browser-first product with explicit architecture
  rules and a Vercel-oriented deployment model.
- `substack-os/` is intentionally file-based and dependency-light.
- Several folders are experiment, tooling, or product prototypes and are not
  meant to be merged into one global build pipeline.

## Constraints to keep in mind

- Do not assume every folder shares the same runtime or deployment target.
- Keep service credentials out of source control.
- Prefer project-local config over repo-root assumptions.
- If a directory is static-only, do not add bundlers or build tooling unless the
  project explicitly requires it.

## Deployment note

The historical Netlify configuration in this repo is intentionally deprecated.
Use the project-specific deployment setup for the live app, and do not treat
root-level Netlify config as a current production target.
