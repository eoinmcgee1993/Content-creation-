# Publication history

One JSON file per publication, written by `../ingest.js` and read by the
dashboard. **This is the database.** It is committed on purpose: the repository
is private, the volume is trivial (one publication is roughly 365 rows a year),
and `git log -p` on a file here is a free audit trail of every revision of every
number — which the Postgres version would have needed a schema change to get.

`example-publication.json` is the seeded sample publication, produced by running
`ingest.js` over `sample-data.js`. It exists so the file path can be driven end
to end without a Substack account: serve this directory and open
`index.html?pub=example-publication`. Nothing in it is real.

## Shape

```jsonc
{
  "publication": "the-brief",
  "daily": {
    "2026-03-01": {            // keyed by the date, which is what makes a
      "metric_date": "2026-03-01",   // re-ingest an update rather than a
      "subscribers": 12304,          // duplicate row
      "arr_cents": 7190400,    // integer minor units. Never a float.
      "captured_at": "2026-03-01T06:00:00.000Z"
    }
  },
  "posts": { "the-ai-revolution": { "post_id": "the-ai-revolution", "views": 18604 } }
}
```

A row carries only the fields some ingest actually supplied. A missing key means
nobody has reported that metric for that day — **not zero.** A day with no
snapshot did not have zero subscribers, and a chart drawing it as zero is lying.

## Editing by hand

Don't. Send a payload through `ingest.js`, which validates every field and
refuses a typo'd currency, a fractional money value or a duplicate date rather
than storing it. Hand-editing bypasses all of that, and the failure shows up
later as a number on a dashboard that nobody can source.

If a file does get corrupted, the fix is `git checkout` — which is exactly why
`ingest.js` refuses to overwrite a store it cannot parse.
