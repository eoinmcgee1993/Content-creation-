// Run: node --test substack-os/
//
// These cover the arithmetic that is easy to get quietly wrong: growth from
// zero, a metric compared against a baseline that includes itself, a mean
// dragged by one viral post, and missing days being read as zeroes.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  attributionBy, brief, byCategory, byDayOfWeek, detectAnomalies,
  normaliseDaily, pctChange, postPerformance, rankPosts, series, summarise,
} from "./engine.js";

const day = (date, over = {}) => ({
  publication: "test", metric_date: date, subscribers: 1000, paid_subscribers: 100,
  free_subscribers: 900, new_subscribers: 10, unsubscribes: 2, views: 500,
  arr_cents: 1_000_00, currency: "usd", ...over,
});

test("pctChange refuses to divide by zero", () => {
  assert.equal(pctChange(50, 0), null);
  assert.equal(pctChange(0, 0), null);
  assert.equal(pctChange(110, 100), 0.1);
  assert.equal(pctChange(90, 100), -0.1);
});

test("pctChange treats missing values as unknown, not zero", () => {
  assert.equal(pctChange(null, 100), null);
  assert.equal(pctChange(100, null), null);
  assert.equal(pctChange(100, undefined), null);
});

test("normaliseDaily sorts oldest-first regardless of input order", () => {
  const rows = normaliseDaily([day("2026-03-03"), day("2026-03-01"), day("2026-03-02")]);
  assert.deepEqual(rows.map((r) => r.metric_date), ["2026-03-01", "2026-03-02", "2026-03-03"]);
});

test("normaliseDaily derives net growth and paid conversion", () => {
  const [row] = normaliseDaily([day("2026-03-01", { new_subscribers: 40, unsubscribes: 15 })]);
  assert.equal(row.net_growth, 25);
  assert.equal(row.paid_conversion, 0.1);
});

test("churn is measured against yesterday's subscribers, not today's", () => {
  const rows = normaliseDaily([
    day("2026-03-01", { subscribers: 1000 }),
    day("2026-03-02", { subscribers: 1200, unsubscribes: 50 }),
  ]);
  // 50 of yesterday's 1000 left. Against today's 1200 it would read 4.2%.
  assert.equal(rows[1].churn_rate, 0.05);
  assert.equal(rows[0].churn_rate, null, "first row has no prior day to measure against");
});

test("a missing metric stays null and never becomes zero", () => {
  const [row] = normaliseDaily([day("2026-03-01", { subscribers: null, arr_cents: undefined })]);
  assert.equal(row.subscribers, null);
  assert.equal(row.arr_cents, null);
  assert.equal(row.paid_conversion, null);
});

test("summarise survives an empty history", () => {
  const s = summarise([]);
  assert.equal(s.latest, null);
  assert.deepEqual(s.current, {});
});

test("summarise compares the latest snapshot against the window's opening row", () => {
  const rows = [
    day("2026-03-01", { subscribers: 1000, arr_cents: 500_00 }),
    day("2026-03-02", { subscribers: 1100, arr_cents: 550_00 }),
    day("2026-03-03", { subscribers: 1200, arr_cents: 600_00 }),
  ];
  const s = summarise(rows, 2);
  assert.equal(s.current.subscribers, 1200);
  assert.equal(s.change.subscribers, 200);
  assert.equal(s.change.subscribers_pct, 0.2);
  assert.equal(s.change.arr_cents, 100_00);
  // new_subscribers summed over the period after the baseline row, not all three.
  assert.equal(s.totals.new_subscribers, 20);
});

test("detectAnomalies finds a spike against its own trailing baseline", () => {
  const rows = [];
  for (let i = 1; i <= 14; i++) {
    rows.push(day(`2026-03-${String(i).padStart(2, "0")}`, { new_subscribers: 10 + (i % 3) }));
  }
  rows.push(day("2026-03-15", { new_subscribers: 147 }));

  const hits = detectAnomalies(rows, { metric: "new_subscribers", baseline: 14, threshold: 2 });
  assert.equal(hits.length, 1);
  assert.equal(hits[0].date, "2026-03-15");
  assert.equal(hits[0].direction, "above");
  assert.ok(hits[0].z > 2);
});

test("a spike does not get to sit in the baseline it is measured against", () => {
  const rows = [];
  for (let i = 1; i <= 14; i++) {
    rows.push(day(`2026-03-${String(i).padStart(2, "0")}`, { new_subscribers: 10 + (i % 3) }));
  }
  rows.push(day("2026-03-15", { new_subscribers: 147 }));

  const [hit] = detectAnomalies(rows, { metric: "new_subscribers", baseline: 14, threshold: 2 });
  // Baseline mean must be ~11 (the quiet fortnight), not pulled up by the 147.
  assert.ok(hit.baseline_mean < 12, `baseline leaked the spike: ${hit.baseline_mean}`);
});

test("a perfectly flat baseline reports nothing rather than infinity", () => {
  const rows = [];
  for (let i = 1; i <= 14; i++) {
    rows.push(day(`2026-03-${String(i).padStart(2, "0")}`, { new_subscribers: 10 }));
  }
  rows.push(day("2026-03-15", { new_subscribers: 999 }));

  const hits = detectAnomalies(rows, { metric: "new_subscribers", baseline: 14 });
  assert.deepEqual(hits, [], "zero standard deviation must not produce a z-score");
});

test("detectAnomalies needs a full baseline before it says anything", () => {
  const rows = [day("2026-03-01"), day("2026-03-02", { new_subscribers: 900 })];
  assert.deepEqual(detectAnomalies(rows, { baseline: 14 }), []);
});

test("vs_baseline uses the median post, so one viral post does not bury the rest", () => {
  const posts = [
    { post_id: "a", views: 100 }, { post_id: "b", views: 100 },
    { post_id: "c", views: 100 }, { post_id: "d", views: 100_000 },
  ];
  const perf = postPerformance(posts);
  const ordinary = perf.find((p) => p.post_id === "a");
  // Median views is 100, so an ordinary post sits at 1.0. Against the mean
  // (25_075) it would read 0.004 and look like a catastrophe.
  assert.equal(ordinary.vs_baseline, 1);
  assert.equal(perf.find((p) => p.post_id === "d").vs_baseline, 1000);
});

test("postPerformance derives conversion and leaves unknowable rates null", () => {
  const [withViews, noViews] = postPerformance([
    { post_id: "a", views: 1000, free_signups: 40, paid_signups: 10, revenue_cents: 20_00 },
    { post_id: "b", views: 0, free_signups: 5, paid_signups: 0 },
  ]);
  assert.equal(withViews.signups, 50);
  assert.equal(withViews.conversion, 0.05);
  assert.equal(withViews.paid_conversion, 0.01);
  assert.equal(withViews.revenue_per_view_cents, 2);
  assert.equal(noViews.conversion, null, "conversion on zero views is undefined, not zero");
});

test("rankPosts drops posts missing the ranking field instead of scoring them zero", () => {
  const ranked = rankPosts(
    [{ post_id: "a", views: 10 }, { post_id: "b" }, { post_id: "c", views: 30 }],
    { by: "views" },
  );
  assert.deepEqual(ranked.map((p) => p.post_id), ["c", "a"]);
});

test("attribution share ignores ungrouped posts rather than inflating the rest", () => {
  const posts = [
    { post_id: "a", category: "ai", views: 1, free_signups: 30, paid_signups: 0 },
    { post_id: "b", category: "money", views: 1, free_signups: 10, paid_signups: 0 },
    { post_id: "c", category: null, views: 1, free_signups: 60, paid_signups: 0 },
  ];
  const groups = byCategory(posts);
  assert.deepEqual(groups.map((g) => g.key), ["ai", "money"]);
  assert.equal(groups[0].share, 0.75);
  assert.equal(groups[1].share, 0.25);
});

test("attributionBy returns a null share when the grouped total is zero", () => {
  const groups = attributionBy(
    [{ post_id: "a", category: "ai", views: 5, free_signups: 0, paid_signups: 0 }],
    (p) => p.category,
  );
  assert.equal(groups[0].share, null);
});

test("day-of-week attribution is computed in UTC", () => {
  // 2026-03-02T23:30Z is a Monday in UTC and a Tuesday east of it.
  const groups = byDayOfWeek([
    { post_id: "a", published_at: "2026-03-02T23:30:00Z", views: 1, free_signups: 5, paid_signups: 0 },
  ]);
  assert.equal(groups[0].key, "Monday");
});

test("day-of-week attribution skips posts with no or unparseable date", () => {
  const groups = byDayOfWeek([
    { post_id: "a", published_at: null, views: 1, free_signups: 5, paid_signups: 0 },
    { post_id: "b", published_at: "not a date", views: 1, free_signups: 5, paid_signups: 0 },
  ]);
  assert.deepEqual(groups, []);
});

test("series keeps gaps as gaps", () => {
  const s = series([day("2026-03-01"), day("2026-03-02", { subscribers: null })], "subscribers", 30);
  assert.deepEqual(s, [
    { date: "2026-03-01", value: 1000 },
    { date: "2026-03-02", value: null },
  ]);
});

test("brief assembles without throwing on empty inputs", () => {
  const b = brief([], []);
  assert.equal(b.generated_for, null);
  assert.deepEqual(b.top_posts, []);
  assert.deepEqual(b.anomalies, []);
});
