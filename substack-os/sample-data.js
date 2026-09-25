// Deterministic sample data, for driving the dashboard with no backend.
//
// This exists because of a practical problem: Substack's official MCP is
// limited to Bestseller publications, so the moment you cannot connect it you
// also cannot see whether any of this renders. A seeded generator means the
// page can be opened, checked and screenshotted today, and that two runs
// produce identical output so a visual change is attributable to a code change.
//
// Obviously fake on purpose. Nothing here should ever reach the database.

/** Mulberry32 — small, seeded, good enough to make a chart wobble believably. */
function rng(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CATEGORIES = ["AI", "Money", "Culture", "Craft"];
const TITLES = [
  "The AI Revolution Nobody Asked For", "Money Is Changing Shape",
  "The Death Of The Quiet Afternoon", "What Your Tools Believe",
  "Against The Productivity Industry", "A Short History Of Being Paid",
  "The Machine That Writes Back", "Small Numbers, Loud Conclusions",
  "On Keeping A Notebook", "The Cost Of Being Everywhere",
  "Why Your Best Post Failed", "The Long Tail Was A Lie",
];

/**
 * `everyNDays` produces the gappy case: snapshots taken every few days rather
 * than daily. The engine's window walks array positions, so a 30-position
 * baseline is then 120 calendar days back — which the dashboard has to say
 * out loud instead of labelling "30d".
 */
export function sampleDaily({ days = 120, seed = 7, everyNDays = 1 } = {}) {
  const rand = rng(seed);
  const rows = [];
  let subscribers = 9_400;
  let paid = 680;
  const start = Date.UTC(2026, 4, 1);

  for (let i = 0; i < days; i++) {
    const date = new Date(start + i * everyNDays * 86_400_000);
    // One deliberate spike, so anomaly detection has something true to find.
    const spike = i === days - 6 ? 140 : 0;
    const gained = Math.round(18 + rand() * 22) + spike;
    const lost = Math.round(3 + rand() * 6);

    subscribers += gained - lost;
    if (i % 4 === 0) paid += Math.round(rand() * 5);

    rows.push({
      metric_date: date.toISOString().slice(0, 10),
      subscribers,
      paid_subscribers: paid,
      free_subscribers: subscribers - paid,
      new_subscribers: gained,
      unsubscribes: lost,
      views: Math.round(2_000 + rand() * 3_500),
      arr_cents: paid * 8_00 * 12,
      currency: "usd",
      source: "sample",
    });
  }
  return rows;
}

export function samplePosts({ seed = 11 } = {}) {
  const rand = rng(seed);
  const start = Date.UTC(2026, 4, 5);

  return TITLES.map((title, i) => {
    const published = new Date(start + i * 7 * 86_400_000 + (i % 5) * 86_400_000);
    const category = CATEGORIES[i % CATEGORIES.length];
    // AI and Money posts convert better — the pattern the insight panel exists
    // to notice.
    const hot = category === "AI" || category === "Money";
    const views = Math.round((hot ? 14_000 : 6_000) + rand() * 9_000);
    const rate = (hot ? 0.024 : 0.009) + rand() * 0.004;
    const free = Math.round(views * rate);
    const paid = Math.round(free * (hot ? 0.11 : 0.05));

    return {
      post_id: `sample-${i + 1}`,
      title,
      published_at: published.toISOString(),
      views,
      likes: Math.round(views * 0.03),
      comments: Math.round(views * 0.004),
      shares: Math.round(views * 0.006),
      free_signups: free,
      paid_signups: paid,
      revenue_cents: paid * 8_00 * 12,
      currency: "usd",
      traffic_source: i % 3 === 0 ? "substack_network" : i % 3 === 1 ? "direct" : "search",
      category,
    };
  });
}
