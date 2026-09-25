// The analytics engine. One engine, any number of front ends.
//
// Every claim the proposed dashboards make — the KPI row, the sparkline, "one
// article is outperforming its baseline", "posts about X generated 71% of new
// subscriptions" — is computed here and nowhere else. A front end formats what
// these functions return; it does not do arithmetic of its own. That is what
// makes a Claude artifact and a ChatGPT app agree about what happened.
//
// Plain ES module, no dependencies, no build step. It runs in the browser from
// a <script type="module"> and under `node --test` unchanged.
//
// Two rules the whole file obeys:
//   - Money is integer minor units. Never a float.
//   - Missing data is null, never 0 and never NaN. A day with no snapshot did
//     not have zero subscribers, and a chart that draws it as zero is lying.

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Number or null. Treats undefined, null, "" and NaN alike. */
function num(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function div(a, b) {
  if (a === null || b === null || b === 0) return null;
  return a / b;
}

function sub(a, b) {
  if (a === null || b === null) return null;
  return a - b;
}

/**
 * Fractional change from `before` to `now`, e.g. 0.087 for +8.7%.
 * Null when there is no honest answer: growth from zero is not "infinite
 * percent", it is undefined, and a dashboard that prints Infinity has a bug.
 */
export function pctChange(now, before) {
  const a = num(now), b = num(before);
  if (a === null || b === null || b === 0) return null;
  return (a - b) / b;
}

function sum(rows, key) {
  let total = null;
  for (const r of rows) {
    const v = num(r[key]);
    if (v === null) continue;
    total = (total ?? 0) + v;
  }
  return total;
}

function median(values) {
  const xs = values.filter((v) => v !== null).sort((a, b) => a - b);
  if (xs.length === 0) return null;
  const mid = xs.length >> 1;
  return xs.length % 2 ? xs[mid] : (xs[mid - 1] + xs[mid]) / 2;
}

function mean(values) {
  const xs = values.filter((v) => v !== null);
  if (xs.length === 0) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

/** Population standard deviation. Null below two points, where spread is meaningless. */
function stddev(values) {
  const xs = values.filter((v) => v !== null);
  if (xs.length < 2) return null;
  const m = xs.reduce((a, b) => a + b, 0) / xs.length;
  return Math.sqrt(xs.reduce((acc, x) => acc + (x - m) ** 2, 0) / xs.length);
}

/**
 * A calendar date as YYYY-MM-DD, from whatever a row source hands over.
 *
 * ARCHITECTURE.md lists an n8n Function node and a CSV import as row sources,
 * and both hand over a Date object for a date column. The previous version
 * sliced String(value), which turns a Date into "Mon Mar 02" — wrong text, and
 * wrong ORDER too, because "Mon" sorts before "Sun". Anything that is not a
 * real date returns null and its row is dropped: a row that cannot be placed
 * in time cannot be placed in the ordering either.
 */
function toISODate(v) {
  if (v instanceof Date) {
    return Number.isNaN(v.getTime()) ? null : v.toISOString().slice(0, 10);
  }
  if (typeof v === "number") {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  }
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

/**
 * Sort daily snapshots oldest-first and attach the fields the schema
 * deliberately does not store, because they are derived and would drift.
 *
 * churn_rate is measured against the PREVIOUS day's subscriber count, not the
 * current one — the people who could leave today are the ones who were here
 * yesterday. Using today's count flatters the number on a growing publication.
 */
export function normaliseDaily(rows) {
  return [...(rows ?? [])]
    .filter((r) => r && r.metric_date !== null && r.metric_date !== undefined)
    .map((r) => ({ row: r, date: toISODate(r.metric_date) }))
    .filter((x) => x.date !== null)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(({ row: r, date }, i, all) => {
      const subscribers = num(r.subscribers);
      const paid = num(r.paid_subscribers);
      const free = num(r.free_subscribers) ?? sub(subscribers, paid);
      const gained = num(r.new_subscribers);
      const lost = num(r.unsubscribes);
      const prevSubs = i > 0 ? num(all[i - 1].row.subscribers) : null;
      return {
        ...r,
        metric_date: date,
        subscribers,
        paid_subscribers: paid,
        free_subscribers: free,
        new_subscribers: gained,
        unsubscribes: lost,
        views: num(r.views),
        arr_cents: num(r.arr_cents),
        net_growth: sub(gained, lost),
        paid_conversion: div(paid, subscribers),
        churn_rate: div(lost, prevSubs),
      };
    });
}

/** The trailing `days` snapshots, oldest-first. */
export function lastDays(daily, days) {
  return days > 0 ? daily.slice(-days) : [];
}

/**
 * Headline numbers and how they moved, comparing the latest snapshot against
 * the one `days` earlier. Returns nulls rather than throwing on a short or
 * empty history — a publication three days old is not an error state.
 */
export function summarise(daily, days = 30) {
  const rows = normaliseDaily(daily);
  if (rows.length === 0) {
    return {
      latest: null, baseline_date: null, window_days: days, span_days: null,
      current: {}, change: {}, totals: {},
    };
  }

  const latest = rows[rows.length - 1];
  // Not named `window`: this runs in a browser too, where that shadows the
  // global inside this function and quietly hands an array to anything here
  // that later expects the real one.
  const windowRows = lastDays(rows, days + 1);
  // The comparison point is the row that opens the window, not "days ago" by
  // date. Snapshots can be missing; walking the array cannot silently compare
  // against a gap.
  const baseline = windowRows.length > 1 ? windowRows[0] : null;
  const period = windowRows.length > 1 ? windowRows.slice(1) : windowRows;

  // window_days is what was ASKED for; span_days is what was actually
  // compared. On a history with gaps — snapshots every four days, say — the
  // baseline sits 31 array positions back but 120 calendar days back, and
  // labelling that "30d" is a lie a front end had no way to catch, because
  // the baseline date was not in the return shape either.
  const spanDays = baseline
    ? Math.round(
        (Date.parse(`${latest.metric_date}T00:00:00Z`) -
          Date.parse(`${baseline.metric_date}T00:00:00Z`)) / 86_400_000,
      )
    : null;

  return {
    latest: latest.metric_date,
    baseline_date: baseline?.metric_date ?? null,
    window_days: days,
    span_days: spanDays,
    current: {
      subscribers: latest.subscribers,
      paid_subscribers: latest.paid_subscribers,
      free_subscribers: latest.free_subscribers,
      arr_cents: latest.arr_cents,
      currency: latest.currency ?? "usd",
      paid_conversion: latest.paid_conversion,
    },
    change: {
      subscribers: sub(latest.subscribers, baseline?.subscribers ?? null),
      subscribers_pct: pctChange(latest.subscribers, baseline?.subscribers ?? null),
      paid_subscribers: sub(latest.paid_subscribers, baseline?.paid_subscribers ?? null),
      arr_cents: sub(latest.arr_cents, baseline?.arr_cents ?? null),
      arr_pct: pctChange(latest.arr_cents, baseline?.arr_cents ?? null),
    },
    totals: {
      new_subscribers: sum(period, "new_subscribers"),
      unsubscribes: sum(period, "unsubscribes"),
      // Derived from the two figures above, NOT summed from each row's own
      // net_growth. Summing per-row net_growth silently skips every day
      // missing either side, so the tile could read "75" directly above the
      // words "210 in, 15 out". Whatever this reports now equals what is
      // rendered beside it.
      net_growth: sub(sum(period, "new_subscribers"), sum(period, "unsubscribes")),
      views: sum(period, "views"),
    },
  };
}

/** A metric as a plain series, for a sparkline. Gaps stay null. */
export function series(daily, metric = "subscribers", days = 30) {
  return lastDays(normaliseDaily(daily), days)
    .map((r) => ({ date: r.metric_date, value: num(r[metric]) }));
}

/**
 * Days where a metric broke from its own recent baseline.
 *
 * The baseline for a given day is the `baseline` days BEFORE it, excluding the
 * day itself — a point must not be allowed to drag the mean it is measured
 * against, or a genuine spike partly hides itself. Days with a flat baseline
 * (sd = 0) are skipped rather than reported as infinitely unusual.
 *
 * `baseline` counts array positions; `minSamples` counts how many of them
 * actually carry a value. Without the second guard two real points among
 * twelve nulls produce a confident 9σ, and a publication with sparse ingest
 * fills the panel with meaningless sigma figures.
 */
export function detectAnomalies(
  daily,
  { metric = "new_subscribers", baseline = 14, threshold = 2, minSamples = 8 } = {},
) {
  const rows = normaliseDaily(daily);
  const out = [];

  for (let i = baseline; i < rows.length; i++) {
    const value = num(rows[i][metric]);
    if (value === null) continue;

    const prior = rows.slice(i - baseline, i).map((r) => num(r[metric]));
    if (prior.filter((v) => v !== null).length < minSamples) continue;
    const m = mean(prior);
    const sd = stddev(prior);
    if (m === null || sd === null || sd === 0) continue;

    const z = (value - m) / sd;
    if (Math.abs(z) >= threshold) {
      out.push({
        date: rows[i].metric_date,
        metric,
        value,
        baseline_mean: m,
        z,
        direction: z > 0 ? "above" : "below",
      });
    }
  }

  return out.sort((a, b) => Math.abs(b.z) - Math.abs(a.z));
}

/**
 * Per-post derived performance.
 *
 * vs_baseline compares a post's views to the MEDIAN post, not the mean. View
 * counts are long-tailed — one post that went wide drags a mean up far enough
 * that every ordinary post looks like a failure against it.
 */
export function postPerformance(posts) {
  const rows = (posts ?? []).filter(Boolean);
  const medianViews = median(rows.map((p) => num(p.views)));

  return rows.map((p) => {
    const views = num(p.views);
    const free = num(p.free_signups);
    const paid = num(p.paid_signups);
    const signups = free === null && paid === null ? null : (free ?? 0) + (paid ?? 0);
    return {
      ...p,
      views,
      free_signups: free,
      paid_signups: paid,
      signups,
      revenue_cents: num(p.revenue_cents),
      published_at: p.published_at ?? null,
      conversion: div(signups, views),
      paid_conversion: div(paid, views),
      revenue_per_view_cents: div(num(p.revenue_cents), views),
      vs_baseline: medianViews ? div(views, medianViews) : null,
    };
  });
}

/**
 * Top posts by any numeric field, highest first. Posts missing it are dropped,
 * not zeroed.
 *
 * `minViews` matters when ranking by a RATE: a one-view post converts at 100%
 * and otherwise tops the list the dashboard quotes as a sentence. It defaults
 * to 0 so ranking by a count is unaffected.
 */
export function rankPosts(posts, { by = "views", limit = 10, minViews = 0 } = {}) {
  return postPerformance(posts)
    .filter((p) => num(p[by]) !== null)
    .filter((p) => minViews <= 0 || (p.views !== null && p.views >= minViews))
    .sort((a, b) => num(b[by]) - num(a[by]))
    .slice(0, limit);
}

/**
 * Share of a metric by group — the shape behind "posts about AI and money
 * generated 71% of new subscriptions".
 *
 * `share` is of the total across groups that HAVE a value, so an uncategorised
 * post cannot quietly inflate everyone else's percentage.
 */
export function attributionBy(posts, groupFn, metric = "signups") {
  const rows = postPerformance(posts);
  const groups = new Map();

  for (const p of rows) {
    const key = groupFn(p);
    if (key === null || key === undefined) continue;
    const value = num(p[metric]);
    if (value === null) continue;
    const g = groups.get(key) ?? { key, total: 0, posts: 0 };
    g.total += value;
    g.posts += 1;
    groups.set(key, g);
  }

  const overall = [...groups.values()].reduce((a, g) => a + g.total, 0);
  return [...groups.values()]
    .map((g) => ({ ...g, metric, share: overall === 0 ? null : g.total / overall }))
    .sort((a, b) => b.total - a.total);
}

export function byCategory(posts, metric = "signups") {
  return attributionBy(posts, (p) => p.category ?? null, metric);
}

/** Day-of-week attribution, in UTC so the answer does not move with the reader. */
export function byDayOfWeek(posts, metric = "signups") {
  return attributionBy(posts, (p) => {
    if (!p.published_at) return null;
    const d = new Date(p.published_at);
    return Number.isNaN(d.getTime()) ? null : DAY_NAMES[d.getUTCDay()];
  }, metric);
}

/**
 * Everything the morning brief needs, in one object.
 *
 * This returns facts, not sentences. Turning "category AI holds 0.71 of
 * signups" into a paragraph is the AI layer's job; keeping the prose out of
 * here is what stops two front ends telling the same user different stories.
 */
export function brief(daily, posts, { days = 30, topN = 3 } = {}) {
  const rows = normaliseDaily(daily);
  // Scale the conversion floor to the publication rather than hard-coding a
  // constant, with a small absolute minimum so a brand-new publication whose
  // median post has 8 views does not quote a 1-view post as its best.
  const medianViews = median(postPerformance(posts).map((p) => p.views));
  const minViews = medianViews ? Math.max(30, Math.round(medianViews * 0.1)) : 0;
  return {
    generated_for: rows.length ? rows[rows.length - 1].metric_date : null,
    summary: summarise(rows, days),
    yesterday: rows.length ? rows[rows.length - 1] : null,
    anomalies: [
      ...detectAnomalies(rows, { metric: "new_subscribers" }),
      ...detectAnomalies(rows, { metric: "unsubscribes" }),
    ].sort((a, b) => Math.abs(b.z) - Math.abs(a.z)).slice(0, 5),
    top_posts: rankPosts(posts, { by: "views", limit: topN }),
    best_converting: rankPosts(posts, { by: "conversion", limit: topN, minViews }),
    by_category: byCategory(posts).slice(0, 5),
    by_day: byDayOfWeek(posts),
  };
}
