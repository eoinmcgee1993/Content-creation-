import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Reads the publication history back out, for the dashboard and for anything
// else that wants the numbers.
//
// The browser cannot read these tables — anon holds no grant on them at all —
// so the read happens here under the service-role key, behind a shared secret,
// the same shape the CRF order desk uses.
//
// This returns ROWS, not conclusions. Growth rates, conversion, anomalies and
// attribution are all computed by substack-os/engine.js on whichever front end
// asked. Doing the arithmetic here as well would give us two implementations
// to keep in agreement, and the first time they disagreed we would not know
// which one was lying.
//
// Read-only by construction: this function holds no write path.

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

const DEFAULT_DAYS = 90;
const MAX_DAYS = 730;
const POST_LIMIT = 200;

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
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
    .eq("key", "dashboard_key")
    .maybeSingle();

  if (cfgErr) {
    console.error("config read failed", cfgErr);
    return json({ error: "Configuration unavailable" }, 500);
  }
  const expected = (cfg?.value ?? "").trim();
  if (!expected || !(await sameSecret(key, expected))) {
    return json({ error: "Not authorised" }, 401);
  }

  const publication = typeof body?.publication === "string" ? body.publication.trim() : "";
  if (!publication) return json({ error: "publication is required" }, 400);
  // Same cap the write path enforces. This endpoint is reachable from any
  // origin, and its input validation should not be weaker than the one
  // guarding writes on the very same field.
  if (publication.length > 200) return json({ error: "publication is too long" }, 400);

  const requested = Number(body?.days);
  const days = Number.isInteger(requested) && requested > 0
    ? Math.min(requested, MAX_DAYS)
    : DEFAULT_DAYS;

  const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);

  const [daily, posts] = await Promise.all([
    supabase
      .from("substack_daily_metrics")
      .select(
        "metric_date, subscribers, paid_subscribers, free_subscribers, " +
        "new_subscribers, unsubscribes, views, arr_cents, currency, source",
      )
      .eq("publication", publication)
      .gte("metric_date", since)
      .order("metric_date", { ascending: true }),
    supabase
      .from("substack_posts")
      .select(
        "post_id, title, published_at, views, likes, comments, shares, " +
        "free_signups, paid_signups, revenue_cents, currency, traffic_source, category",
      )
      .eq("publication", publication)
      // Windowed like the daily rows. Returning every post ever while the
      // daily figures covered 30 days meant the dashboard printed "AI and
      // Money account for 71% of signups" — computed over three years of
      // posts — directly beneath a 30-day net-growth tile, with nothing in
      // the payload saying the two covered different spans.
      .gte("published_at", `${since}T00:00:00Z`)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(POST_LIMIT),
  ]);

  if (daily.error || posts.error) {
    console.error("read failed", daily.error ?? posts.error);
    return json({ error: "Could not read metrics" }, 500);
  }

  return json({
    generated_at: new Date().toISOString(),
    publication,
    window_days: days,
    since,
    daily: daily.data ?? [],
    posts: posts.data ?? [],
  }, 200);
});
