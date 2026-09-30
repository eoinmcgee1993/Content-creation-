// The file-backed store: upsert semantics, the read envelope, and every refusal.
// Run: npm test

import { test } from "node:test";
import assert from "node:assert/strict";

import { DEFAULT_DAYS, MAX_DAYS, POST_LIMIT, empty, merge, read, serialise } from "./store.js";
import { MAX_DAILY } from "./payload.js";

const NOW = new Date("2026-03-15T00:00:00Z");
const opts = { now: NOW };

/** Merge and assert it was accepted, returning the new store. */
function ok(store, body) {
  const r = merge(store, body, opts);
  assert.equal(r.error, undefined, `unexpectedly refused: ${r.error}`);
  return r.store;
}

const daily = (rows) => ({ publication: "the-brief", daily: rows });
const posts = (rows) => ({ publication: "the-brief", posts: rows });

/* ------------------------------- upserting ------------------------------- */

test("a second identical ingest changes nothing", () => {
  const body = daily([{ metric_date: "2026-03-01", subscribers: 1200 }]);
  const once = ok(empty("the-brief"), body);
  const twice = ok(once, body);
  assert.deepEqual(twice, once);
  assert.equal(Object.keys(twice.daily).length, 1);
});

test("a narrower re-ingest does not null what an earlier run captured", () => {
  // The whole reason rows carry only the fields their caller sent. A views
  // refresh that wrote every known column would erase title and category, and
  // the post would vanish from the attribution figures with no error anywhere.
  let s = ok(empty("the-brief"), posts([
    { post_id: "x", title: "T", category: "AI", published_at: "2026-03-01T09:00:00Z", views: 900 },
  ]));
  s = ok(s, posts([{ post_id: "x", views: 20100 }]));

  assert.equal(s.posts.x.views, 20100);
  assert.equal(s.posts.x.title, "T");
  assert.equal(s.posts.x.category, "AI");
  assert.equal(s.posts.x.published_at, "2026-03-01T09:00:00.000Z");
});

test("an explicit null still clears a field", () => {
  let s = ok(empty("the-brief"), posts([{ post_id: "x", title: "T" }]));
  s = ok(s, posts([{ post_id: "x", title: null }]));
  assert.equal("title" in s.posts.x, true);
  assert.equal(s.posts.x.title, null);
});

test("merge does not mutate the store it was given", () => {
  const before = ok(empty("the-brief"), daily([{ metric_date: "2026-03-01", subscribers: 1 }]));
  const snapshot = JSON.parse(JSON.stringify(before));
  merge(before, daily([{ metric_date: "2026-03-02", subscribers: 2 }]), opts);
  assert.deepEqual(before, snapshot, "a failed write must not have already altered memory");
});

test("a payload for another publication is refused", () => {
  const s = ok(empty("the-brief"), daily([{ metric_date: "2026-03-01" }]));
  const r = merge(s, { publication: "other", daily: [{ metric_date: "2026-03-02" }] }, opts);
  assert.match(r.error, /store holds the-brief, payload is for other/);
});

test("stored rows cannot carry an unlisted field", () => {
  const s = ok(empty("the-brief"), daily([
    { metric_date: "2026-03-01", subscribers: 5, is_admin: true, captured_at: "1999-01-01" },
  ]));
  const row = s.daily["2026-03-01"];
  assert.equal(row.is_admin, undefined);
  assert.equal(row.captured_at, NOW.toISOString());
});

/* -------------------------------- reading -------------------------------- */

test("read returns the same envelope the hosted route returns", () => {
  const s = ok(empty("the-brief"), daily([{ metric_date: "2026-03-01", subscribers: 1200 }]));
  const out = read(s, { days: 30, now: NOW });
  assert.deepEqual(Object.keys(out).sort(), [
    "daily", "generated_at", "posts", "publication", "since", "window_days",
  ]);
  assert.equal(out.publication, "the-brief");
  assert.equal(out.window_days, 30);
  assert.equal(out.since, "2026-02-13");
  assert.equal(out.daily.length, 1);
});

test("read clamps an absurd window and defaults a nonsense one", () => {
  const s = ok(empty("the-brief"), daily([{ metric_date: "2026-03-01" }]));
  assert.equal(read(s, { days: 999_999, now: NOW }).window_days, MAX_DAYS);
  for (const days of [-5, 0, "lots", 1.5, null, undefined]) {
    assert.equal(read(s, { days, now: NOW }).window_days, DEFAULT_DAYS, `days=${days}`);
  }
});

test("read excludes days outside the window", () => {
  let s = ok(empty("the-brief"), daily([{ metric_date: "2026-01-01", subscribers: 1 }]));
  s = ok(s, daily([{ metric_date: "2026-03-10", subscribers: 2 }]));
  const out = read(s, { days: 30, now: NOW });
  assert.deepEqual(out.daily.map((r) => r.metric_date), ["2026-03-10"]);
});

test("read sorts days ascending however they were ingested", () => {
  let s = ok(empty("the-brief"), daily([{ metric_date: "2026-03-10" }]));
  s = ok(s, daily([{ metric_date: "2026-03-02" }]));
  s = ok(s, daily([{ metric_date: "2026-03-07" }]));
  assert.deepEqual(
    read(s, { days: 30, now: NOW }).daily.map((r) => r.metric_date),
    ["2026-03-02", "2026-03-07", "2026-03-10"],
  );
});

test("read orders posts newest first with undated ones last", () => {
  const s = ok(empty("the-brief"), posts([
    { post_id: "old", published_at: "2026-03-02T09:00:00Z" },
    { post_id: "undated" },
    { post_id: "new", published_at: "2026-03-09T09:00:00Z" },
  ]));
  assert.deepEqual(
    read(s, { days: 30, now: NOW }).posts.map((r) => r.post_id),
    ["new", "old", "undated"],
  );
});

test("read caps the posts it returns", () => {
  const rows = Array.from({ length: POST_LIMIT + 25 }, (_, i) => ({ post_id: `p${i}` }));
  const s = ok(empty("the-brief"), posts(rows));
  assert.equal(read(s, { days: 30, now: NOW }).posts.length, POST_LIMIT);
});

/* ------------------------------ the file form ---------------------------- */

test("serialise is stable regardless of ingest order", () => {
  let a = ok(empty("the-brief"), daily([{ metric_date: "2026-03-02", subscribers: 2 }]));
  a = ok(a, daily([{ metric_date: "2026-03-01", subscribers: 1 }]));

  let b = ok(empty("the-brief"), daily([{ metric_date: "2026-03-01", subscribers: 1 }]));
  b = ok(b, daily([{ metric_date: "2026-03-02", subscribers: 2 }]));

  assert.equal(serialise(a), serialise(b), "diffs would be unreadable and the audit log useless");
  assert.match(serialise(a), /\n$/);
});

test("a serialised store round-trips back through merge", () => {
  const s = ok(empty("the-brief"), daily([{ metric_date: "2026-03-01", subscribers: 1200 }]));
  const reloaded = JSON.parse(serialise(s));
  const after = ok(reloaded, daily([{ metric_date: "2026-03-01", paid_subscribers: 90 }]));
  assert.equal(after.daily["2026-03-01"].subscribers, 1200, "reload lost an earlier field");
  assert.equal(after.daily["2026-03-01"].paid_subscribers, 90);
});

/* --------------------------- every refusal, named ------------------------ */
//
// There is one write path now, so these are direct expectations rather than a
// comparison against a second implementation.
//
// The wording is asserted, not merely the failure. Every one of these was a real
// defect, and in each case the value was accepted and quietly altered rather
// than refused — a currency typo stored as usd, an over-long category dropped to
// null, a day silently discarded. A message naming the field is the difference
// between a five-minute fix and a week of not knowing which number lied.

const CASES = [
  ["a minimal day", daily([{ metric_date: "2026-03-01" }]), null],
  ["a full snapshot", {
    publication: "the-brief",
    currency: "gbp",
    daily: [{ metric_date: "2026-03-01", subscribers: 1200, arr_cents: 8_640_000 }],
    posts: [{ post_id: "p1", title: "Hello", published_at: "2026-03-01T09:00:00Z", views: 900 }],
  }, null],
  ["no publication", { daily: [{ metric_date: "2026-03-01" }] },
    "publication is required"],
  ["an empty payload", { publication: "the-brief", daily: [], posts: [] },
    "nothing to ingest"],
  ["fractional money", daily([{ metric_date: "2026-03-01", arr_cents: 1999.5 }]),
    "daily[0].arr_cents must be a non-negative integer"],
  ["a negative count", daily([{ metric_date: "2026-03-01", subscribers: -5 }]),
    "daily[0].subscribers must be a non-negative integer"],
  ["a numeric string", daily([{ metric_date: "2026-03-01", subscribers: "1200" }]),
    "daily[0].subscribers must be a non-negative integer"],
  ["a typo'd currency", { publication: "the-brief", currency: "dollars", daily: [{ metric_date: "2026-03-01" }] },
    "currency must be a 3-letter ISO code"],
  ["a bad source", { publication: "the-brief", source: "Not A Source", daily: [{ metric_date: "2026-03-01" }] },
    "source must be 1-40 chars of a-z, 0-9, _ or -"],
  ["a non-ISO date", daily([{ metric_date: "01/03/2026" }]),
    "daily[0]: metric_date must be YYYY-MM-DD"],
  ["a date that does not exist", daily([{ metric_date: "2026-02-30" }]),
    "daily[0]: metric_date must be YYYY-MM-DD"],
  ["a present-but-not-array daily", { publication: "the-brief", daily: { metric_date: "2026-03-01" }, posts: [{ post_id: "x" }] },
    "daily must be an array"],
  ["a duplicate date", daily([{ metric_date: "2026-03-01" }, { metric_date: "2026-03-01" }]),
    "daily contains 2026-03-01 more than once"],
  ["a duplicate post", posts([{ post_id: "x", views: 1 }, { post_id: "x", views: 2 }]),
    "posts contains x more than once"],
  ["a post with no id", posts([{ title: "x" }]),
    "posts[0]: post_id is required"],
  ["an unparseable published_at", posts([{ post_id: "a", published_at: "soon" }]),
    "posts[0].published_at is not a valid timestamp"],
  ["an over-long category", posts([{ post_id: "x", category: "c".repeat(101) }]),
    "posts[0].category must be a string of at most 100 characters"],
  ["an over-long title", posts([{ post_id: "x", title: "t".repeat(501) }]),
    "posts[0].title must be a string of at most 500 characters"],
  ["an oversized batch", daily(Array.from({ length: MAX_DAILY + 1 }, () => ({ metric_date: "2026-03-01" }))),
    "daily exceeds 400 rows"],
];

for (const [name, body, expected] of CASES) {
  test(expected === null ? `accepts ${name}` : `refuses ${name}`, () => {
    const r = merge(empty("the-brief"), body, opts);
    assert.equal(r.error, expected ?? undefined);
    if (expected !== null) {
      assert.equal(r.store, undefined, "a refusal must store nothing at all");
    }
  });
}

/* --------------------------- runs in a browser --------------------------- */

test("the store modules stay browser-safe", async () => {
  // index.html imports store.js directly, and store.js imports payload.js. A
  // `node:` import in either would work in every test here and fail only in the
  // browser, which is the one place the dashboard actually runs.
  const { readFileSync } = await import("node:fs");
  for (const f of ["store.js", "payload.js"]) {
    const src = readFileSync(new URL(`./${f}`, import.meta.url), "utf8");
    assert.equal(/from\s+["']node:/.test(src), false, `${f} imports a Node builtin`);
    assert.equal(/require\(/.test(src), false, `${f} uses require()`);
  }
});
