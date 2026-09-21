# DEGEN DIARIES Architecture

## Production stack

- Next.js: reader, newsroom and API
- Neon Postgres: production relational database
- Drizzle ORM: schema and migrations
- Clerk: authentication and subscriber identity
- Cloudflare R2: issue PDFs, images and source assets
- Stripe: €3.99/month subscription
- Resend: transactional and issue-delivery email
- n8n: editorial automation and scheduling
- Gotenberg: HTML to A4 PDF
- PostHog: product analytics
- Gmail/Superhuman Mail: newsroom source inbox

## Editorial pipeline

1. INGEST: newsletters, tips and approved feeds arrive in the newsroom inbox.
2. EXTRACT: normalize URLs, dates, authors, claims and source metadata.
3. SCORE: rank stories by relevance, novelty, verification quality and reader value.
4. DRAFT: generate a structured editorial object, never a free-form newspaper.
5. VERIFY: require source links and flag unsupported claims.
6. EDIT: headline, dek, body, image and section are finalized.
7. COMPOSE: place approved stories into the 12-page issue template.
8. RENDER: generate web edition and A4 PDF.
9. QA: reject missing sources, overflow, duplicate stories, broken images or empty pages.
10. PUBLISH: web, PDF and subscriber email.
11. ARCHIVE: preserve the immutable issue and all source references.

## Core principle

The AI is the newsroom machinery, not the publisher. Every story retains its source trail and can be killed before publication.
