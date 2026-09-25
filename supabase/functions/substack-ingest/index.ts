import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Writes a Substack snapshot into the history tables.
//
// WHO CALLS THIS, AND WHY IT IS NOT A CRON JOB.
//
// The obvious design is a 06:00 scheduler that pulls yesterday's numbers from
// Substack's MCP endpoint and posts them here. That design does not work, and
// it is worth being exact about why before someone spends a week on it.
//
// MCP is spoken by an AI assistant acting for a signed-in user. Substack's
// official MCP is read-only and documents no server-to-server token flow, so a
// cron job has nothing to authenticate WITH — there is no API key to put in a
// scheduler. The assistant is the only thing that can read the publication.
//
// So the assistant is the ingest agent: it reads through MCP and posts the
// result here, on a schedule of its own. This endpoint is the seam between the
// half that needs a human's session and the half that does not. If Substack
// ever ships a token-authenticated HTTP API, a real scheduler can post to this
// same endpoint and nothing downstream changes.
//
// Deliberately no CORS headers. Every caller is a server or an assistant's
// HTTP client; no page should be able to reach a write endpoint from a
// browser at all, even one that would fail the secret check.

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const MAX_DAILY = 400;
const MAX_POSTS = 500;

// Columns this endpoint is willing to write. Anything else in the payload is
// dropped rather than forwarded: an unrecognised key would fail the upsert,
// and a recognised-but-unintended one is worse.
const DAILY_INT_FIELDS = [
  "subscribers", "paid_subscribers", "free_subscribers",
  "new_subscribers", "unsubscribes", "views", "arr_cents",
] as const;

const POST_INT_FIELDS = [
  "views", "likes", "comments", "shares",
  "free_signups", "paid_signups", "revenue_cents",
] as const;

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

// Compare without leaking where two strings first differ. Lengths are hashed
// in rather than compared, so a wrong length is not distinguishable either.
async function sameSecret(a: string, b: string) {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  const x = new Uint8Array(ha), y = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

function text(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s === "" || s.length > max ? null : s;
}

/**
 * An optional free-text field. Absent or empty is null; present but too long
 * is `undefined`, which the caller must refuse rather than store as null.
 *
 * text() collapses "absent" and "longer than max" into the same null, so an
 * over-long category was silently dropped and the post fell out of the
 * "posts about X generated N% of signups" figure the system exists to
 * produce — while the response still said {ok:true}. Same silent-substitution
 * defect the currency check above exists to prevent.
 */
function optionalText(v: unknown, max: number): string | null | undefined {
  if (v === null || v === undefined) return null;
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  if (s === "") return null;
  return s.length > max ? undefined : s;
}

// Counts are non-negative integers. A float here means the caller derived a
// number it should have sent raw, and money as a float is the bug the whole
// minor-units rule exists to prevent — so both are refused rather than rounded.
function count(v: unknown): number | null | undefined {
  if (v === null || v === undefined) return null;
  if (typeof v !== "number" || !Number.isInteger(v) || v < 0) return undefined;
  return v;
}

/**
 * A caller-supplied label. Absent means the default; present-but-invalid is
 * null, which the caller must report rather than quietly replace.
 *
 * The earlier version of this fell back to the default on a bad value, which
 * meant `"currency": "dollars"` was accepted and stored as usd — silently
 * relabelling a publication's revenue rather than refusing a typo.
 */
function label(v: unknown, fallback: string, pattern: RegExp): string | null {
  if (v === null || v === undefined) return fallback;
  if (typeof v !== "string") return null;
  const s = v.trim().toLowerCase();
  return pattern.test(s) ? s : null;
}

function isDate(s: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const key = typeof body?.key === "string" ? body.key : "";
  if (!key) return json({ error: "Not authorised" }, 401);

  const { data: cfg, error: cfgErr } = await supabase
    .from("substack_config")
    .select("value")
    .eq("key", "ingest_key")
    .maybeSingle();

  if (cfgErr) {
    console.error("config read failed", cfgErr);
    return json({ error: "Configuration unavailable" }, 500);
  }
  // No key configured means no access, not open access.
  const expected = (cfg?.value ?? "").trim();
  if (!expected || !(await sameSecret(key, expected))) {
    return json({ error: "Not authorised" }, 401);
  }

  const publication = text(body?.publication, 200);
  if (!publication) return json({ error: "publication is required" }, 400);

  const source = label(body?.source, "substack_mcp", /^[a-z0-9_-]{1,40}$/);
  if (source === null) return json({ error: "source must be 1-40 chars of a-z, 0-9, _ or -" }, 400);

  const currency = label(body?.currency, "usd", /^[a-z]{3}$/);
  if (currency === null) return json({ error: "currency must be a 3-letter ISO code" }, 400);

  // Present but not an array is refused, not skipped. An assistant holding a
  // single snapshot naturally emits `"daily": {…}`; that used to be dropped
  // to [] and, if `posts` was non-empty, answered {ok:true, daily:0} — the
  // day lost with no error and a permanent hole in the history.
  for (const field of ["daily", "posts"] as const) {
    const v = body?.[field];
    if (v !== undefined && v !== null && !Array.isArray(v)) {
      return json({ error: `${field} must be an array` }, 400);
    }
  }

  const dailyIn = Array.isArray(body?.daily) ? body.daily : [];
  const postsIn = Array.isArray(body?.posts) ? body.posts : [];

  if (dailyIn.length > MAX_DAILY) return json({ error: `daily exceeds ${MAX_DAILY} rows` }, 400);
  if (postsIn.length > MAX_POSTS) return json({ error: `posts exceeds ${MAX_POSTS} rows` }, 400);
  if (dailyIn.length === 0 && postsIn.length === 0) {
    return json({ error: "nothing to ingest" }, 400);
  }

  const daily = [];
  for (const [i, row] of dailyIn.entries()) {
    const metric_date = text(row?.metric_date, 10);
    if (!metric_date || !isDate(metric_date)) {
      return json({ error: `daily[${i}]: metric_date must be YYYY-MM-DD` }, 400);
    }
    const out: Record<string, unknown> = {
      publication, metric_date, currency, source, captured_at: new Date().toISOString(),
    };
    // Only columns the caller actually sent. Writing every whitelisted column
    // on every upsert means a narrower re-ingest — a refresh of one metric —
    // overwrites everything the earlier run captured with null.
    for (const f of DAILY_INT_FIELDS) {
      if (!(f in (row ?? {}))) continue;
      const v = count(row?.[f]);
      if (v === undefined) return json({ error: `daily[${i}].${f} must be a non-negative integer` }, 400);
      out[f] = v;
    }
    daily.push(out);
  }

  const posts = [];
  for (const [i, row] of postsIn.entries()) {
    const post_id = text(row?.post_id, 200);
    if (!post_id) return json({ error: `posts[${i}]: post_id is required` }, 400);

    const out: Record<string, unknown> = {
      publication, post_id, currency, captured_at: new Date().toISOString(),
    };

    if ("published_at" in (row ?? {})) {
      if (row.published_at === null) {
        out.published_at = null;
      } else {
        const raw = text(row.published_at, 40);
        const d = raw ? new Date(raw) : null;
        if (!d || Number.isNaN(d.getTime())) {
          return json({ error: `posts[${i}].published_at is not a valid timestamp` }, 400);
        }
        out.published_at = d.toISOString();
      }
    }

    for (const [f, max] of [["title", 500], ["traffic_source", 100], ["category", 100]] as const) {
      if (!(f in (row ?? {}))) continue;
      const v = optionalText(row?.[f], max);
      if (v === undefined) {
        return json({ error: `posts[${i}].${f} must be a string of at most ${max} characters` }, 400);
      }
      out[f] = v;
    }

    for (const f of POST_INT_FIELDS) {
      if (!(f in (row ?? {}))) continue;
      const v = count(row?.[f]);
      if (v === undefined) return json({ error: `posts[${i}].${f} must be a non-negative integer` }, 400);
      out[f] = v;
    }
    posts.push(out);
  }

  // Two rows sharing a conflict key in ONE payload make Postgres raise
  // "ON CONFLICT DO UPDATE command cannot affect row a second time"
  // (SQLSTATE 21000). That surfaced as an opaque 500 with nothing stored, so
  // the caller retried the same bad payload forever. Name the duplicate.
  const firstDuplicate = (rows: Record<string, unknown>[], key: string) => {
    const seen = new Set<unknown>();
    for (const r of rows) {
      if (seen.has(r[key])) return r[key];
      seen.add(r[key]);
    }
    return null;
  };

  const dupDate = firstDuplicate(daily, "metric_date");
  if (dupDate !== null) {
    return json({ error: `daily contains ${dupDate} more than once` }, 400);
  }
  const dupPost = firstDuplicate(posts, "post_id");
  if (dupPost !== null) {
    return json({ error: `posts contains ${dupPost} more than once` }, 400);
  }

  // Rows now carry only the columns their caller supplied, so a batch can hold
  // more than one column shape. PostgREST needs one shape per request, so
  // upsert each shape separately — in practice one group, since a caller
  // sends uniform rows.
  async function upsertByShape(
    table: string,
    rows: Record<string, unknown>[],
    onConflict: string,
  ) {
    const groups = new Map<string, Record<string, unknown>[]>();
    for (const r of rows) {
      const key = Object.keys(r).sort().join(",");
      (groups.get(key) ?? groups.set(key, []).get(key)!).push(r);
    }
    for (const group of groups.values()) {
      const { error } = await supabase.from(table).upsert(group, { onConflict });
      if (error) return error;
    }
    return null;
  }

  // Upsert, not insert. Re-running a day is the normal case, not an error:
  // Substack revises recent numbers, and an ingest that failed halfway has to
  // be safe to repeat.
  if (daily.length) {
    const error = await upsertByShape(
      "substack_daily_metrics", daily, "publication,metric_date",
    );
    if (error) {
      console.error("daily upsert failed", error);
      return json({ error: "Could not store daily metrics" }, 500);
    }
  }

  if (posts.length) {
    const error = await upsertByShape("substack_posts", posts, "publication,post_id");
    if (error) {
      console.error("post upsert failed", error);
      return json({ error: "Could not store posts" }, 500);
    }
  }

  return json({ ok: true, publication, daily: daily.length, posts: posts.length }, 200);
});
