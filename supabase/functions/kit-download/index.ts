import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Releases a finished kit SVG, but only for an order Stripe has confirmed paid.
//
// verify_jwt is disabled because this is called from a plain static page with no
// signed-in user. Its authentication is the pair (order_id, download_token):
// the token is a UUID generated in the customer's browser and stored with the
// order, so knowing a guessable order id alone is not enough.

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

  if (!orderId || !UUID_RE.test(token)) {
    return json({ error: "order_id and a valid token are required" }, 400);
  }

  // Both must match. A wrong or missing token looks identical to a wrong order:
  // we do not reveal whether the order exists.
  const { data: order, error: orderErr } = await supabase
    .from("crf_orders")
    .select("id, payment_status, fulfilment")
    .eq("id", orderId)
    .eq("download_token", token)
    .maybeSingle();

  if (orderErr) {
    console.error("order lookup failed", orderErr);
    return json({ error: "Lookup failed" }, 500);
  }
  if (!order) return json({ error: "No such order" }, 404);

  if (order.payment_status !== "paid") {
    return json(
      { error: "This order has not been paid yet.", payment_status: order.payment_status },
      402,
    );
  }

  const { data: file, error: fileErr } = await supabase
    .from("crf_order_files")
    .select("svg")
    .eq("order_id", orderId)
    .maybeSingle();

  if (fileErr) {
    console.error("file lookup failed", fileErr);
    return json({ error: "Lookup failed" }, 500);
  }
  if (!file?.svg) return json({ error: "No file stored for this order" }, 404);

  return new Response(file.svg, {
    status: 200,
    headers: {
      ...CORS,
      "Content-Type": "image/svg+xml",
      "Content-Disposition": `attachment; filename="crf250l-kit-${orderId}.svg"`,
      "Cache-Control": "no-store",
    },
  });
});
