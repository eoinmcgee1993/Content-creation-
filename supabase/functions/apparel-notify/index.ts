import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Sends the racewear approval notification to the email stored on the order.
// The approval link remains on the confirmation page as a fallback.
//
// The racewear page tells the customer "we check your artwork at print size
// and email you to approve it". The link is shown on screen, while this
// function notifies the customer without turning the public endpoint into a
// recipient-controlled mail relay.
//
// Three properties matter more than the mail itself:
//
//   1. The recipient is read from the authenticated order row, never from
//      the request body, so this endpoint cannot be used as an open relay.
//   2. The approval link is built from a base URL held in crf_config, not
//      from anything the caller supplies, so a link we send can never point
//      somewhere else.
//   3. It sends once. approval_email_sent_at is stamped on the order, and a
//      second call is a no-op rather than a way to mail someone repeatedly.
//
// Authentication is the same pair the approval page uses: (order_id,
// approval_token). verify_jwt is off because the customer is not signed in.
//
// Configuration lives in crf_config, alongside the Stripe webhook secret, so
// that turning this on is a database change and not a deploy, and so no key
// is ever in the repository:
//
//   resend_api_key     the sending key
//   notify_from        e.g. "Orders <orders@example.com>" — a verified sender
//   site_base_url      e.g. "https://example.com" — used to build the link
//
// With any of those missing the function returns 200 and sends nothing, so
// the ordering flow keeps working while the sending domain does not exist.

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "apikey, authorization, content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CONFIG_KEYS = ["resend_api_key", "notify_from", "site_base_url"];

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function esc(s: unknown) {
  return String(s ?? "").replace(/[&<>"']/g, (m) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]!)
  );
}

function baht(cents: number) {
  return "THB " + (cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

async function loadConfig() {
  const { data, error } = await supabase
    .from("crf_config")
    .select("key, value")
    .in("key", CONFIG_KEYS);
  if (error) throw error;
  const cfg: Record<string, string> = {};
  for (const row of data ?? []) {
    const v = (row.value ?? "").trim();
    if (v) cfg[row.key] = v;
  }
  return cfg;
}

async function send(apiKey: string, payload: Record<string, unknown>) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    // Log the status, never the key or the body we sent.
    console.error("send failed", res.status, (await res.text()).slice(0, 300));
    return false;
  }
  return true;
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

  // Same rule as the approval endpoint: a wrong token and a wrong order id
  // give the same answer, so this cannot be used to discover order ids.
  const { data: order, error: readErr } = await supabase
    .from("crf_apparel_orders")
    .select(
      "id, garment, club_name, customer_name, customer_email, unit_count, " +
      "total_cents, currency, approval_email_sent_at",
    )
    .eq("id", orderId)
    .eq("approval_token", token)
    .maybeSingle();

  if (readErr) {
    console.error("order lookup failed", readErr);
    return json({ error: "Lookup failed" }, 500);
  }
  if (!order) return json({ error: "No such order" }, 404);

  if (order.approval_email_sent_at) return json({ sent: false, reason: "already_sent" }, 200);

  const claimTime = new Date().toISOString();
  const { data: claim, error: claimErr } = await supabase
    .from("crf_apparel_orders")
    .update({ approval_email_sent_at: claimTime })
    .eq("id", order.id)
    .eq("approval_token", token)
    .is("approval_email_sent_at", null)
    .select("id")
    .maybeSingle();
  if (claimErr) {
    console.error("notification claim failed", claimErr);
    return json({ error: "Notification unavailable" }, 500);
  }
  if (!claim) return json({ sent: false, reason: "already_sent" }, 200);

  async function releaseClaim() {
    const { error } = await supabase
      .from("crf_apparel_orders")
      .update({ approval_email_sent_at: null })
      .eq("id", order.id)
      .eq("approval_email_sent_at", claimTime);
    if (error) console.error("notification claim release failed", error);
  }

  let cfg: Record<string, string>;
  try {
    cfg = await loadConfig();
  } catch (e) {
    console.error("config read failed", e);
    await releaseClaim();
    return json({ error: "Configuration unavailable" }, 500);
  }

  const missing = CONFIG_KEYS.filter((k) => !cfg[k]);
  if (missing.length) {
    // Not an error. Sending is not switched on yet; the order is still saved
    // and the customer still has their link on screen.
    console.log("notify skipped, unset config:", missing.join(", "));
    await releaseClaim();
    return json({ sent: false, reason: "not_configured" }, 200);
  }

  const base = cfg.site_base_url.replace(/\/+$/, "");
  const link = `${base}/approve?order=${encodeURIComponent(order.id)}` +
    `&token=${encodeURIComponent(token)}`;

  const total = order.currency === "THB"
    ? baht(order.total_cents)
    : `${order.currency} ${(order.total_cents / 100).toFixed(2)}`;

  const customerSent = await send(cfg.resend_api_key, {
    from: cfg.notify_from,
    to: [order.customer_email],
    subject: `Your order ${order.id} — approve your artwork`,
    html: `
      <p>Thanks ${esc(order.customer_name)} — we have your order.</p>
      <p><b>${esc(order.id)}</b><br>
         ${esc(order.unit_count)} × ${esc(order.garment)}${
      order.club_name ? `<br>${esc(order.club_name)}` : ""
    }<br>
         ${esc(total)}</p>
      <p>We check your artwork at print size before anything is produced.
         Open the link below to see it and approve it — or ask for changes.
         <b>You pay after approval, not before.</b></p>
      <p><a href="${esc(link)}">${esc(link)}</a></p>
      <p>Keep that link. It is the only way back to your approval page.</p>
    `.trim(),
  });

  if (!customerSent) await releaseClaim();

  return json({ sent: customerSent }, 200);
});
