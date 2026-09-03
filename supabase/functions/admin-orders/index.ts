import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Reads the order queues for whoever is running the shop.
//
// Orders were previously read by opening a SQL console. That works at low
// volume and stops working the moment you want to check something from a
// phone.
//
// The obvious shortcut — let the operator page read the tables directly with
// the publishable key — is the exact hole the whole design exists to close. A
// SELECT grant to anon cannot be given to one page; it is given to everyone
// who views source. So the read happens here, under the service-role key,
// behind a shared secret.
//
// The secret lives in crf_config as operator_key, like every other secret in
// this system: rotatable with one UPDATE, never in the repository, readable
// only by a service-role client inside a function.
//
// This endpoint is read-only. It cannot change an order, and in particular it
// cannot touch payment_status or artwork_status — those belong to the Stripe
// webhook and the customer's own approval respectively.

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

const LIMIT = 100;

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "no-store" },
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
    .from("crf_config")
    .select("value")
    .eq("key", "operator_key")
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

  const [kits, wear] = await Promise.all([
    supabase
      .from("crf_orders")
      .select(
        "id, created_at, model, fulfilment, customer_name, customer_email, " +
        "notes, payment_status, paid_at, stripe_session_id",
      )
      .order("created_at", { ascending: false })
      .limit(LIMIT),
    supabase
      .from("crf_apparel_orders")
      .select(
        "id, created_at, garment, club_name, customer_name, customer_email, " +
        "unit_count, unit_price_cents, total_cents, currency, payment_status, " +
        "paid_at, artwork_status, artwork_note, artwork_reviewed_at, " +
        "approval_email_sent_at",
      )
      .order("created_at", { ascending: false })
      .limit(LIMIT),
  ]);

  if (kits.error || wear.error) {
    console.error("queue read failed", kits.error ?? wear.error);
    return json({ error: "Could not read orders" }, 500);
  }

  // Tokens are deliberately absent from both selects above. This view is for
  // seeing what needs doing, not for handing out anyone's download or
  // approval link.
  const kitRows = kits.data ?? [];
  const wearRows = wear.data ?? [];

  return json({
    generated_at: new Date().toISOString(),
    kits: kitRows,
    apparel: wearRows,
    counts: {
      kits_unpaid: kitRows.filter((o) => o.payment_status === "unpaid").length,
      kits_paid: kitRows.filter((o) => o.payment_status === "paid").length,
      apparel_awaiting_approval: wearRows.filter((o) => o.artwork_status === "pending").length,
      apparel_approved_unpaid: wearRows.filter(
        (o) => o.artwork_status === "approved" && o.payment_status === "unpaid",
      ).length,
    },
  }, 200);
});
