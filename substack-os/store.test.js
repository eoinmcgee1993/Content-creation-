// The file-backed store: upsert semantics, the read envelope, and parity with
// the hosted route. Run: npm test

import { test, before, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { DEFAULT_DAYS, MAX_DAYS, POST_LIMIT, empty, merge, read, serialise } from "./store.js";
import { MAX_DAILY } from "./payload.js";
import { loadFunction, post, reset } from "./function-harness.js";

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

/* ---------------------- parity with the hosted route --------------------- */
//
// Two write paths mean two chances to disagree about what is acceptable, and the
// eight defects this system already shipped were mostly validation defects. So
// rather than trusting that both stay fixed, every case below is driven through
// the real Edge Function handler AND through merge(), and the two must agree on
// the verdict and on the wording.

const CASES = [
  ["minimal day", daily([{ metric_date: "2026-03-01" }])],
  ["a full snapshot", {
    publication: "the-brief",
    currency: "gbp",
    daily: [{ metric_date: "2026-03-01", subscribers: 1200, arr_cents: 8_640_000 }],
    posts: [{ post_id: "p1", title: "Hello", published_at: "2026-03-01T09:00:00Z", views: 900 }],
  }],
  ["no publication", { daily: [{ metric_date: "2026-03-01" }] }],
  ["nothing to ingest", { publication: "the-brief", daily: [], posts: [] }],
  ["fractional money", daily([{ metric_date: "2026-03-01", arr_cents: 1999.5 }])],
  ["negative count", daily([{ metric_date: "2026-03-01", subscribers: -5 }])],
  ["numeric string", daily([{ metric_date: "2026-03-01", subscribers: "1200" }])],
  ["typo'd currency", { publication: "the-brief", currency: "dollars", daily: [{ metric_date: "2026-03-01" }] }],
  ["bad source", { publication: "the-brief", source: "Not A Source", daily: [{ metric_date: "2026-03-01" }] }],
  ["non-ISO date", daily([{ metric_date: "01/03/2026" }])],
  ["impossible date", daily([{ metric_date: "2026-02-30" }])],
  ["non-array daily", { publication: "the-brief", daily: { metric_date: "2026-03-01" }, posts: [{ post_id: "x" }] }],
  ["duplicate date", daily([{ metric_date: "2026-03-01" }, { metric_date: "2026-03-01" }])],
  ["duplicate post", posts([{ post_id: "x", views: 1 }, { post_id: "x", views: 2 }])],
  ["post with no id", posts([{ title: "x" }])],
  ["unparseable published_at", posts([{ post_id: "a", published_at: "soon" }])],
  ["over-long category", posts([{ post_id: "x", category: "c".repeat(101) }])],
  ["over-long title", posts([{ post_id: "x", title: "t".repeat(501) }])],
  ["oversized batch", daily(Array.from({ length: MAX_DAILY + 1 }, () => ({ metric_date: "2026-03-01" })))],
];

let ingest;
before(async () => { ingest = await loadFunction("substack-ingest"); });
beforeEach(() => reset());

for (const [name, body] of CASES) {
  test(`parity: ${name}`, async () => {
    const hosted = await post(ingest, { key: "correct-horse", ...body });
    const local = merge(empty("the-brief"), body, opts);

    if (hosted.status === 200) {
      assert.equal(local.error, undefined, `hosted accepted ${name}, file store refused it`);
      return;
    }
    assert.equal(hosted.status, 400, `unexpected status ${hosted.status} for ${name}`);
    assert.equal(
      local.error, hosted.body.error,
      `the two write paths disagree about ${name}`,
    );
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
