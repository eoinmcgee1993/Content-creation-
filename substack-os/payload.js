// Validates and shapes an ingest payload. No database, no host APIs, no I/O.
//
// This is the middle of supabase/functions/substack-ingest/index.ts — the part
// between "is the caller authorised" and "write it somewhere" — lifted out so
// the file-backed store enforces the same rules as the HTTP route rather than
// growing its own second opinion.
//
// Every refusal here was a defect once. The comments say which, because the
// tempting "simplification" in each case is to accept the value and move on,
// and that is precisely what produced a dashboard quoting numbers that were
// not true. store.test.js pins these outcomes against the deployed handler's,
// so the two cannot drift apart unnoticed.

export const MAX_DAILY = 400;
export const MAX_POSTS = 500;

export const DAILY_INT_FIELDS = [
  "subscribers", "paid_subscribers", "free_subscribers",
  "new_subscribers", "unsubscribes", "views", "arr_cents",
];

export const POST_INT_FIELDS = [
  "views", "likes", "comments", "shares",
  "free_signups", "paid_signups", "revenue_cents",
];

const POST_TEXT_FIELDS = [["title", 500], ["traffic_source", 100], ["category", 100]];

function text(v, max) {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s === "" || s.length > max ? null : s;
}

// Absent or empty is null; present but too long is `undefined`, which the
// caller must refuse rather than store as null. Collapsing those two into null
// silently dropped an over-long category, so the post fell out of the
// attribution figures the system exists to produce — while still answering ok.
function optionalText(v, max) {
  if (v === null || v === undefined) return null;
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  if (s === "") return null;
  return s.length > max ? undefined : s;
}

// Counts are non-negative integers. A float means the caller derived a number
// it should have sent raw, and money as a float is the bug the whole
// minor-units rule exists to prevent — so both are refused, not rounded.
function count(v) {
  if (v === null || v === undefined) return null;
  if (typeof v !== "number" || !Number.isInteger(v) || v < 0) return undefined;
  return v;
}

// Absent means the default; present-but-invalid is null, which the caller must
// report. Falling back to the default on a bad value meant `"dollars"` was
// accepted and stored as usd — silently relabelling a publication's revenue.
function label(v, fallback, pattern) {
  if (v === null || v === undefined) return fallback;
  if (typeof v !== "string") return null;
  const s = v.trim().toLowerCase();
  return pattern.test(s) ? s : null;
}

function isDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

// Two rows sharing a conflict key in one payload used to reach Postgres, which
// raised "ON CONFLICT DO UPDATE command cannot affect row a second time" — an
// opaque 500 with nothing stored, so the caller retried the bad payload
// forever. Name the duplicate instead.
function firstDuplicate(rows, key) {
  const seen = new Set();
  for (const r of rows) {
    if (seen.has(r[key])) return r[key];
    seen.add(r[key]);
  }
  return null;
}

/**
 * @returns {{error: string} | {publication, currency, source, daily, posts}}
 *   A refusal names the offending field. Never a partial success: if one row is
 *   bad, nothing is returned to store, because a half-applied snapshot leaves a
 *   history that looks complete and is not.
 */
export function shape(body, { now = new Date() } = {}) {
  const captured_at = now.toISOString();

  const publication = text(body?.publication, 200);
  if (!publication) return { error: "publication is required" };

  const source = label(body?.source, "substack_mcp", /^[a-z0-9_-]{1,40}$/);
  if (source === null) return { error: "source must be 1-40 chars of a-z, 0-9, _ or -" };

  const currency = label(body?.currency, "usd", /^[a-z]{3}$/);
  if (currency === null) return { error: "currency must be a 3-letter ISO code" };

  // Present but not an array is refused, not skipped. An assistant holding a
  // single snapshot naturally emits `"daily": {…}`; that used to be dropped to
  // [] and, if `posts` was non-empty, answered ok with the day silently lost.
  for (const field of ["daily", "posts"]) {
    const v = body?.[field];
    if (v !== undefined && v !== null && !Array.isArray(v)) {
      return { error: `${field} must be an array` };
    }
  }

  const dailyIn = Array.isArray(body?.daily) ? body.daily : [];
  const postsIn = Array.isArray(body?.posts) ? body.posts : [];

  if (dailyIn.length > MAX_DAILY) return { error: `daily exceeds ${MAX_DAILY} rows` };
  if (postsIn.length > MAX_POSTS) return { error: `posts exceeds ${MAX_POSTS} rows` };
  if (dailyIn.length === 0 && postsIn.length === 0) return { error: "nothing to ingest" };

  const daily = [];
  for (const [i, row] of dailyIn.entries()) {
    const metric_date = text(row?.metric_date, 10);
    if (!metric_date || !isDate(metric_date)) {
      return { error: `daily[${i}]: metric_date must be YYYY-MM-DD` };
    }
    const out = { publication, metric_date, currency, source, captured_at };
    // Only the columns the caller actually sent. Writing every known column on
    // every merge means a narrower re-ingest — a refresh of one metric —
    // overwrites everything an earlier run captured with null.
    for (const f of DAILY_INT_FIELDS) {
      if (!(f in (row ?? {}))) continue;
      const v = count(row?.[f]);
      if (v === undefined) return { error: `daily[${i}].${f} must be a non-negative integer` };
      out[f] = v;
    }
    daily.push(out);
  }

  const posts = [];
  for (const [i, row] of postsIn.entries()) {
    const post_id = text(row?.post_id, 200);
    if (!post_id) return { error: `posts[${i}]: post_id is required` };

    const out = { publication, post_id, currency, captured_at };

    if ("published_at" in (row ?? {})) {
      if (row.published_at === null) {
        out.published_at = null;
      } else {
        const raw = text(row.published_at, 40);
        const d = raw ? new Date(raw) : null;
        if (!d || Number.isNaN(d.getTime())) {
          return { error: `posts[${i}].published_at is not a valid timestamp` };
        }
        out.published_at = d.toISOString();
      }
    }

    for (const [f, max] of POST_TEXT_FIELDS) {
      if (!(f in (row ?? {}))) continue;
      const v = optionalText(row?.[f], max);
      if (v === undefined) {
        return { error: `posts[${i}].${f} must be a string of at most ${max} characters` };
      }
      out[f] = v;
    }

    for (const f of POST_INT_FIELDS) {
      if (!(f in (row ?? {}))) continue;
      const v = count(row?.[f]);
      if (v === undefined) return { error: `posts[${i}].${f} must be a non-negative integer` };
      out[f] = v;
    }
    posts.push(out);
  }

  const dupDate = firstDuplicate(daily, "metric_date");
  if (dupDate !== null) return { error: `daily contains ${dupDate} more than once` };

  const dupPost = firstDuplicate(posts, "post_id");
  if (dupPost !== null) return { error: `posts contains ${dupPost} more than once` };

  return { publication, currency, source, daily, posts };
}
