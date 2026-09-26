// A Substack publication's history as one JSON file.
//
// WHY THERE IS NO DATABASE HERE.
//
// One publication writing one snapshot a day is about 365 rows a year. That is
// not a database workload; it is a file. Postgres was never here for scale — it
// was here to keep the history Substack will not let you query, and a file in a
// private repository does that just as well while adding an audit log for free:
// `git log -p substack-os/data/<publication>.json` is every revision of every
// number, which the database version would have needed a schema change to get.
//
// What it removes matters more than what it adds: no project to become
// unreachable, no service-role key, no shared secrets, no HTTPS round trip that
// has to be driven before anyone can trust the numbers.
//
// The trade is deliberate and has a real edge: a file is single-writer and
// local. Two people ingesting at once, or a dashboard on a phone that has no
// checkout, both want the hosted path — which still exists, unchanged, in
// supabase/. This module and that route produce identical rows on purpose, so
// moving between them is a config change rather than a rewrite.

import { shape } from "./payload.js";

export const DEFAULT_DAYS = 90;
export const MAX_DAYS = 730;
export const POST_LIMIT = 200;

/** A store with no history yet. */
export function empty(publication) {
  return { publication, daily: {}, posts: {} };
}

/**
 * Merge a validated payload into a store, upsert semantics.
 *
 * @returns {{error: string} | {store, daily: number, posts: number}}
 *   `store` is a new object; the input is not mutated, so a caller that fails
 *   to write the file has not already corrupted the copy in memory.
 */
export function merge(store, body, { now = new Date() } = {}) {
  const shaped = shape(body, { now });
  if ("error" in shaped) return shaped;

  // The file is per publication, and its name is what a reader trusts. A
  // payload naming a different one is the file equivalent of overriding the
  // authenticated publication: refuse it rather than writing B's numbers into
  // A's history, where nothing downstream could ever tell them apart.
  if (store.publication && store.publication !== shaped.publication) {
    return {
      error: `store holds ${store.publication}, payload is for ${shaped.publication}`,
    };
  }

  const next = {
    publication: shaped.publication,
    daily: { ...(store.daily ?? {}) },
    posts: { ...(store.posts ?? {}) },
  };

  // Spreading incoming over existing IS the upsert: the shaped row carries only
  // the fields its caller supplied, so an absent key leaves the stored value
  // alone and an explicit null clears it. Assigning the row wholesale instead
  // would make a one-metric refresh erase everything an earlier run captured.
  for (const row of shaped.daily) {
    next.daily[row.metric_date] = { ...(next.daily[row.metric_date] ?? {}), ...row };
  }
  for (const row of shaped.posts) {
    next.posts[row.post_id] = { ...(next.posts[row.post_id] ?? {}), ...row };
  }

  return { store: next, daily: shaped.daily.length, posts: shaped.posts.length };
}

/**
 * Read a window out of a store, in the exact envelope substack-metrics returns.
 *
 * Identical on purpose. The dashboard should not be able to tell which backend
 * it is pointed at, or the two would drift into telling different stories about
 * the same week — the same reason every derived number lives in engine.js.
 */
export function read(store, { days, now = new Date() } = {}) {
  const requested = Number(days);
  const window_days = Number.isInteger(requested) && requested > 0
    ? Math.min(requested, MAX_DAYS)
    : DEFAULT_DAYS;

  const since = new Date(now.getTime() - window_days * 86_400_000)
    .toISOString().slice(0, 10);

  const daily = Object.values(store.daily ?? {})
    .filter((r) => typeof r.metric_date === "string" && r.metric_date >= since)
    .sort((a, b) => a.metric_date.localeCompare(b.metric_date));

  // published_at descending, nulls last, capped — matching the index the hosted
  // read path uses and the order it returns.
  const posts = Object.values(store.posts ?? {})
    .filter((r) => r.published_at == null || r.published_at >= `${since}T00:00:00Z`)
    .sort((a, b) => {
      if (a.published_at == null) return b.published_at == null ? 0 : 1;
      if (b.published_at == null) return -1;
      return b.published_at.localeCompare(a.published_at);
    })
    .slice(0, POST_LIMIT);

  return {
    publication: store.publication,
    daily,
    posts,
    window_days,
    since,
    generated_at: now.toISOString(),
  };
}

/**
 * The on-disk form: keys sorted, two-space indent, trailing newline.
 *
 * Deterministic on purpose. Object key order is insertion order, so without
 * this a re-ingest could rewrite the whole file and every day's diff would look
 * like every day changed — which would make the git history useless as the
 * audit log that justifies keeping the data in the repository at all.
 */
export function serialise(store) {
  const byKey = (map) => Object.fromEntries(
    Object.keys(map ?? {}).sort().map((k) => [k, sortKeys(map[k])]),
  );
  const sortKeys = (row) => Object.fromEntries(
    Object.keys(row ?? {}).sort().map((k) => [k, row[k]]),
  );
  return `${JSON.stringify({
    publication: store.publication,
    daily: byKey(store.daily),
    posts: byKey(store.posts),
  }, null, 2)}\n`;
}
