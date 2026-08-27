import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Records a customer's decision on their racewear artwork.
//
// The racewear page promises the customer approves the artwork before paying,
// and the terms say approval is what we produce from. This is where that
// approval is actually recorded.
//
// verify_jwt is disabled because the customer is not signed in: they arrive
// from a link. Authentication is the pair (order_id, approval_token) — a UUID
// generated in their browser and stored with the order, so knowing an order id
// alone is not enough. This function can move artwork_status; it can never
// touch payment_status.

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ACTIONS = new Set(["view", "approve", "request_changes"]);
const NOTE_MAX = 2000;

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
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

  const orderId = typeof body?.order_id === "string" ? body.order_id.trim() : "";
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  const action = typeof body?.action === "string" ? body.action.trim() : "view";
  const note = typeof body?.note === "string" ? body.note.trim().slice(0, NOTE_MAX) : "";

  if (!orderId || !UUID_RE.test(token)) {
    return json({ error: "order_id and a valid token are required" }, 400);
  }
  if (!ACTIONS.has(action)) return json({ error: "Unknown action" }, 400);

  // Both must match. A wrong token is indistinguishable from a wrong order:
  // we never reveal whether an order exists.
  const { data: order, error: readErr } = await supabase
    .from("crf_apparel_orders")
    .select(
      "id, created_at, garment, club_name, customer_name, notes, zones, roster, " +
      "unit_count, unit_price_cents, total_cents, currency, fx_usd_per_thb, " +
      "artwork_status, artwork_note, artwork_reviewed_at, payment_status",
    )
    .eq("id", orderId)
    .eq("approval_token", token)
    .maybeSingle();

  if (readErr) {
    console.error("order lookup failed", readErr);
    return json({ error: "Lookup failed" }, 500);
  }
  if (!order) return json({ error: "No such order" }, 404);

  if (action === "view") return json({ order }, 200);

  // Approval is a one-way door: once the customer has approved, the order goes
  // into production and re-deciding it here would misrepresent what they
  // agreed to. Changes requested can still be revisited.
  if (order.artwork_status === "approved") {
    return json(
      { error: "This artwork has already been approved.", order },
      409,
    );
  }

  const patch = action === "approve"
    ? { artwork_status: "approved", artwork_reviewed_at: new Date().toISOString(), artwork_note: note || null }
    : { artwork_status: "changes_requested", artwork_reviewed_at: new Date().toISOString(), artwork_note: note || null };

  const { data: updated, error: writeErr } = await supabase
    .from("crf_apparel_orders")
    .update(patch)
    .eq("id", orderId)
    .eq("approval_token", token)
    .select("id, artwork_status, artwork_note, artwork_reviewed_at, payment_status")
    .maybeSingle();

  if (writeErr) {
    console.error("approval write failed", writeErr);
    return json({ error: "Could not record that. Try again." }, 500);
  }

  return json({ order: { ...order, ...updated } }, 200);
});
