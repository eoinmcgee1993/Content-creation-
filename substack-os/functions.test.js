// Integration tests for the two Edge Functions. Run: npm test
//
// These drive the real handler from supabase/functions/*/index.ts with a
// stubbed database client — every refusal, both happy paths, and the defects
// found reviewing the merged code. They are not a substitute for driving the
// deployed functions over HTTPS (docs/substack-os/README.md has those curls),
// but they mean a change to either route cannot land untested.

import { test, before, beforeEach } from "node:test";
import assert from "node:assert/strict";

import {
  calls, failWrites, loadFunction, post, reset, respond, setConfig, upsertedRows,
} from "./function-harness.js";

const KEY = "correct-horse";
let ingest;
let metrics;

before(async () => {
  ingest = await loadFunction("substack-ingest");
  metrics = await loadFunction("substack-metrics");
});
beforeEach(() => reset());

/* -------------------------- substack-ingest: auth ------------------------ */

test("ingest refuses a GET", async () => {
  assert.equal((await respond(ingest, new Request("https://x/fn"))).status, 405);
});

test("ingest refuses malformed JSON", async () => {
  const r = await respond(ingest, new Request("https://x/fn", { method: "POST", body: "{oh no" }));
  assert.equal(r.status, 400);
});

test("ingest refuses a missing or wrong key", async () => {
  assert.equal((await post(ingest, { publication: "p" })).status, 401);
  assert.equal((await post(ingest, { key: "guess", publication: "p" })).status, 401);
});

test("ingest treats an unconfigured key as no access, not open access", async () => {
  setConfig(null);
  assert.equal((await post(ingest, { key: "", publication: "p" })).status, 401);
  setConfig({ value: "" });
  assert.equal((await post(ingest, { key: "anything", publication: "p" })).status, 401);
});

test("ingest offers no CORS on a write endpoint", async () => {
  const r = await post(ingest, { key: KEY, publication: "p", daily: [{ metric_date: "2026-03-01" }] });
  assert.equal(r.headers.get("Access-Control-Allow-Origin"), null);
});

/* ----------------------- substack-ingest: validation --------------------- */

test("ingest requires a publication and something to ingest", async () => {
  assert.equal((await post(ingest, { key: KEY, daily: [{ metric_date: "2026-03-01" }] })).status, 400);
  const r = await post(ingest, { key: KEY, publication: "p", daily: [], posts: [] });
  assert.equal(r.status, 400);
  assert.match(r.body.error, /nothing to ingest/);
});

test("ingest refuses a non-ISO date", async () => {
  for (const d of ["01/03/2026", "2026-3-1", "2026-02-30", "yesterday"]) {
    const r = await post(ingest, { key: KEY, publication: "p", daily: [{ metric_date: d }] });
    assert.equal(r.status, 400, `accepted ${d}`);
  }
});

test("ingest refuses fractional money rather than rounding it", async () => {
  const r = await post(ingest, {
    key: KEY, publication: "p", daily: [{ metric_date: "2026-03-01", arr_cents: 1999.5 }],
  });
  assert.equal(r.status, 400);
  assert.match(r.body.error, /arr_cents/);
});

test("ingest refuses a negative count and a numeric string", async () => {
  for (const v of [-5, "1200"]) {
    const r = await post(ingest, {
      key: KEY, publication: "p", daily: [{ metric_date: "2026-03-01", subscribers: v }],
    });
    assert.equal(r.status, 400, `accepted ${JSON.stringify(v)}`);
  }
});

test("ingest refuses a typo'd currency rather than storing usd", async () => {
  const r = await post(ingest, {
    key: KEY, publication: "p", currency: "dollars", daily: [{ metric_date: "2026-03-01" }],
  });
  assert.equal(r.status, 400);
});

test("ingest refuses an oversized batch", async () => {
  const daily = Array.from({ length: 401 }, () => ({ metric_date: "2026-03-01" }));
  const r = await post(ingest, { key: KEY, publication: "p", daily });
  assert.equal(r.status, 400);
  assert.match(r.body.error, /exceeds 400/);
});

test("ingest refuses a post with no id and an unparseable published_at", async () => {
  assert.equal((await post(ingest, { key: KEY, publication: "p", posts: [{ title: "x" }] })).status, 400);
  const r = await post(ingest, {
    key: KEY, publication: "p", posts: [{ post_id: "a", published_at: "soon" }],
  });
  assert.equal(r.status, 400);
});

test("ingest drops unlisted fields and cannot have its publication overridden", async () => {
  await post(ingest, {
    key: KEY,
    publication: "p",
    daily: [{ metric_date: "2026-03-01", subscribers: 5, is_admin: true, publication: "spoofed", captured_at: "1999-01-01" }],
  });
  const row = upsertedRows("substack_daily_metrics")[0];
  assert.equal(row.is_admin, undefined);
  assert.equal(row.publication, "p");
  assert.notEqual(row.captured_at, "1999-01-01");
});

/* ------------------------ substack-ingest: regressions ------------------- */

test("ingest names an in-batch duplicate instead of failing opaquely", async () => {
  // Two rows sharing a conflict key made Postgres raise SQLSTATE 21000, which
  // surfaced as a 500 with nothing stored — so the caller retried forever.
  const r = await post(ingest, {
    key: KEY,
    publication: "p",
    daily: [
      { metric_date: "2026-03-01", subscribers: 100 },
      { metric_date: "2026-03-01", subscribers: 101 },
    ],
  });
  assert.equal(r.status, 400);
  assert.match(r.body.error, /2026-03-01 more than once/);
  assert.equal(upsertedRows("substack_daily_metrics").length, 0, "nothing should be written");
});

test("ingest names a duplicate post_id too", async () => {
  const r = await post(ingest, {
    key: KEY, publication: "p", posts: [{ post_id: "x", views: 1 }, { post_id: "x", views: 2 }],
  });
  assert.equal(r.status, 400);
  assert.match(r.body.error, /x more than once/);
});

test("a narrower re-ingest does not null out columns an earlier run captured", async () => {
  // A views refresh used to wipe title, category and published_at, because
  // every whitelisted column was written on every upsert.
  await post(ingest, { key: KEY, publication: "p", posts: [{ post_id: "x", views: 20100 }] });
  const row = upsertedRows("substack_posts")[0];

  assert.equal(row.views, 20100);
  for (const absent of ["title", "category", "traffic_source", "published_at", "free_signups"]) {
    assert.equal(absent in row, false, `${absent} would be overwritten with null`);
  }
});

test("an explicit null still clears a column", async () => {
  await post(ingest, {
    key: KEY, publication: "p", posts: [{ post_id: "x", title: null, published_at: null }],
  });
  const row = upsertedRows("substack_posts")[0];
  assert.equal("title" in row, true);
  assert.equal(row.title, null);
  assert.equal(row.published_at, null);
});

test("ingest refuses an over-long label rather than silently storing null", async () => {
  // A 101-character category was dropped to null and answered {ok:true}, so
  // the post vanished from the attribution figures with no error.
  const r = await post(ingest, {
    key: KEY, publication: "p", posts: [{ post_id: "x", category: "c".repeat(101) }],
  });
  assert.equal(r.status, 400);
  assert.match(r.body.error, /category/);
});

test("ingest refuses a present-but-not-array daily", async () => {
  // Easy shape for an assistant holding one snapshot. It used to be dropped
  // silently and answered {ok:true, daily:0} when posts was non-empty.
  const r = await post(ingest, {
    key: KEY,
    publication: "p",
    daily: { metric_date: "2026-03-01", subscribers: 1200 },
    posts: [{ post_id: "x", views: 1 }],
  });
  assert.equal(r.status, 400);
  assert.match(r.body.error, /daily must be an array/);
});

/* ------------------------ substack-ingest: happy path -------------------- */

test("ingest stores both tables, upserts, and reports counts", async () => {
  const r = await post(ingest, {
    key: KEY,
    publication: "the-brief",
    currency: "GBP",
    daily: [{ metric_date: "2026-03-01", subscribers: 1200, paid_subscribers: 90, arr_cents: 8_640_000 }],
    posts: [{ post_id: "p1", title: "Hello", published_at: "2026-03-01T09:00:00Z", views: 900 }],
  });
  assert.equal(r.status, 200);
  assert.deepEqual({ ok: r.body.ok, daily: r.body.daily, posts: r.body.posts }, { ok: true, daily: 1, posts: 1 });

  const d = calls.find((c) => c.table === "substack_daily_metrics" && c.op === "upsert");
  assert.equal(d.opts.onConflict, "publication,metric_date", "must upsert, not insert");
  assert.equal(d.rows[0].currency, "gbp");
  assert.equal(d.rows[0].subscribers, 1200);

  const p = calls.find((c) => c.table === "substack_posts" && c.op === "upsert");
  assert.equal(p.opts.onConflict, "publication,post_id");
  assert.equal(p.rows[0].published_at, "2026-03-01T09:00:00.000Z");
});

test("rows of differing shapes are upserted as separate groups", async () => {
  // PostgREST needs one column shape per request.
  await post(ingest, {
    key: KEY,
    publication: "p",
    posts: [{ post_id: "a", views: 1 }, { post_id: "b", views: 2, title: "T" }],
  });
  const groups = calls.filter((c) => c.table === "substack_posts" && c.op === "upsert");
  assert.equal(groups.length, 2);
  for (const g of groups) {
    const shapes = new Set(g.rows.map((r) => Object.keys(r).sort().join(",")));
    assert.equal(shapes.size, 1, "a group must be uniform");
  }
});

test("a write failure is a 500 that does not leak the driver error", async () => {
  failWrites({ message: "relation does not exist" });
  const r = await post(ingest, { key: KEY, publication: "p", daily: [{ metric_date: "2026-03-01" }] });
  assert.equal(r.status, 500);
  assert.equal(r.body.error, "Could not store daily metrics");
  assert.equal(JSON.stringify(r.body).includes("relation does not exist"), false);
});

/* --------------------------- substack-metrics ---------------------------- */

test("metrics answers a CORS preflight", async () => {
  const r = await metrics(new Request("https://x/fn", { method: "OPTIONS" }));
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("Access-Control-Allow-Origin"), "*");
});

test("metrics refuses a GET, a wrong key and an unconfigured key", async () => {
  assert.equal((await respond(metrics, new Request("https://x/fn"))).status, 405);
  assert.equal((await post(metrics, { key: "nope", publication: "p" })).status, 401);
  setConfig({ value: "   " });
  assert.equal((await post(metrics, { key: "   ", publication: "p" })).status, 401);
});

test("metrics requires a publication and caps its length like the write path", async () => {
  assert.equal((await post(metrics, { key: KEY })).status, 400);
  const r = await post(metrics, { key: KEY, publication: "p".repeat(201) });
  assert.equal(r.status, 400);
  assert.match(r.body.error, /too long/);
});

test("metrics clamps an absurd window and defaults a nonsense one", async () => {
  assert.equal((await post(metrics, { key: KEY, publication: "p", days: 999_999 })).body.window_days, 730);
  for (const days of [-5, 0, "lots", 1.5, null]) {
    assert.equal((await post(metrics, { key: KEY, publication: "p", days })).body.window_days, 90, `days=${days}`);
  }
});

test("metrics windows the posts, not just the daily rows", async () => {
  // Returning every post ever alongside 30 days of daily figures meant the
  // dashboard computed attribution over a different span than the KPI row.
  const r = await post(metrics, { key: KEY, publication: "p", days: 30 });
  const windowed = calls.filter((c) => c.op === "gte").map((c) => c.table);
  assert.ok(windowed.includes("substack_posts"), "posts query is not windowed");
  assert.ok(r.body.since, "the response should say what the window covers");
});

test("metrics returns rows and says nothing about how they were computed", async () => {
  const r = await post(metrics, { key: KEY, publication: "the-brief", days: 30 });
  assert.equal(r.status, 200);
  assert.equal(r.body.publication, "the-brief");
  assert.ok(Array.isArray(r.body.daily) && Array.isArray(r.body.posts));
  assert.ok(!Number.isNaN(Date.parse(r.body.generated_at)));
});
