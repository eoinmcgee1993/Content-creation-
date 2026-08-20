import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Stripe webhook receiver for CRF Garage.
//
// verify_jwt is disabled because Stripe cannot send a Supabase JWT. This
// function implements its own authentication instead: every request must carry
// a valid Stripe-Signature computed with our webhook signing secret. An
// unsigned or wrongly-signed request is rejected before anything is read.

const TOLERANCE_SECONDS = 300; // reject events older than 5 minutes (replay guard)

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmacHex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Verify a Stripe-Signature header: "t=<ts>,v1=<sig>[,v1=<sig>...]"
async function verifyStripeSignature(
  rawBody: string,
  header: string | null,
  secret: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!header) return { ok: false, reason: "missing Stripe-Signature header" };

  let timestamp = "";
  const provided: string[] = [];
  for (const part of header.split(",")) {
    const [k, v] = part.split("=", 2).map((x) => x?.trim());
    if (k === "t") timestamp = v ?? "";
    else if (k === "v1" && v) provided.push(v);
  }
  if (!timestamp || provided.length === 0) {
    return { ok: false, reason: "malformed Stripe-Signature header" };
  }

  const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp));
  if (!Number.isFinite(age) || age > TOLERANCE_SECONDS) {
    return { ok: false, reason: "timestamp outside tolerance" };
  }

  const expected = await hmacHex(secret, `${timestamp}.${rawBody}`);
  if (!provided.some((p) => timingSafeEqual(p, expected))) {
    return { ok: false, reason: "signature mismatch" };
  }
  return { ok: true };
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Read the body exactly as sent: signature is over the raw bytes.
  const rawBody = await req.text();

  const { data: cfg, error: cfgErr } = await supabase
    .from("crf_config")
    .select("value")
    .eq("key", "stripe_webhook_secret")
    .maybeSingle();

  if (cfgErr || !cfg?.value) {
    console.error("webhook secret unavailable", cfgErr);
    return new Response("Webhook not configured", { status: 500 });
  }

  const verdict = await verifyStripeSignature(
    rawBody,
    req.headers.get("Stripe-Signature"),
    cfg.value,
  );
  if (!verdict.ok) {
    console.warn("rejected webhook:", verdict.reason);
    return new Response(`Signature verification failed: ${verdict.reason}`, { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // Only completed, actually-paid checkouts mark an order paid.
  if (event?.type !== "checkout.session.completed") {
    return new Response(JSON.stringify({ ignored: event?.type ?? "unknown" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const session = event?.data?.object ?? {};
  const orderId = session.client_reference_id;

  if (session.payment_status !== "paid") {
    return new Response(JSON.stringify({ ignored: "not paid", order: orderId ?? null }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (!orderId) {
    console.warn("paid session with no client_reference_id", session.id);
    return new Response(JSON.stringify({ ignored: "no client_reference_id" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: updated, error: updErr } = await supabase
    .from("crf_orders")
    .update({
      payment_status: "paid",
      stripe_session_id: session.id ?? null,
      stripe_payment_intent: session.payment_intent ?? null,
      paid_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .select("id");

  if (updErr) {
    console.error("failed to mark order paid", orderId, updErr);
    // 500 so Stripe retries rather than dropping a real payment.
    return new Response("Could not update order", { status: 500 });
  }

  return new Response(
    JSON.stringify({ order: orderId, marked_paid: (updated?.length ?? 0) > 0 }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
