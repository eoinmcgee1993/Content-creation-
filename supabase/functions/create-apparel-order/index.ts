import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "apikey, authorization, content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GARMENTS: Record<string, { name: string; base: number; kind: "top" | "bottom" }> = {
  "mx-jersey": { name: "MX Race Jersey", base: 129000, kind: "top" },
  "mx-pants": { name: "MX Race Pants", base: 289000, kind: "bottom" },
  "bmx-jersey": { name: "BMX Race Jersey", base: 109000, kind: "top" },
  "adv-shirt": { name: "Adventure Shirt", base: 149000, kind: "top" },
};
const TIERS = [
  { min: 1, mult: 1 },
  { min: 5, mult: 0.92 },
  { min: 10, mult: 0.84 },
  { min: 20, mult: 0.75 },
  { min: 50, mult: 0.68 },
];
const SIZES_TOP = new Set(["YS", "YM", "YL", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"]);
const SIZES_BOTTOM = new Set(['20"', '22"', '24"', '26"', '28"', '30"', '32"', '34"', '36"', '38"', '40"']);

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function unitPrice(base: number, count: number) {
  let mult = TIERS[0].mult;
  for (const tier of TIERS) if (count >= tier.min) mult = tier.mult;
  return Math.round(base * mult / 100) * 100;
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

  const garmentKey = typeof body?.garment_key === "string" ? body.garment_key : "";
  const garment = GARMENTS[garmentKey];
  const name = typeof body?.customer_name === "string" ? body.customer_name.trim().slice(0, 200) : "";
  const email = typeof body?.customer_email === "string" ? body.customer_email.trim().slice(0, 320) : "";
  const roster = Array.isArray(body?.roster) ? body.roster : [];
  const zones = body?.zones && typeof body.zones === "object" ? body.zones : {};

  if (!garment || !name || !EMAIL_RE.test(email) || roster.length < 1 || roster.length > 100) {
    return json({ error: "Invalid order details" }, 400);
  }

  const cleanRoster = roster.map((r: any) => ({
    name: typeof r?.name === "string" ? r.name.trim().slice(0, 100) : "",
    number: typeof r?.number === "string" ? r.number.replace(/\D/g, "").slice(0, 3) : "",
    size: typeof r?.size === "string" ? r.size.slice(0, 8) : "",
    qty: Number.isInteger(r?.qty) ? r.qty : 0,
  }));
  const sizes = garment.kind === "top" ? SIZES_TOP : SIZES_BOTTOM;
  if (cleanRoster.some((r: any) => !r.name || r.qty < 1 || r.qty > 99 || !sizes.has(r.size))) {
    return json({ error: "Invalid rider roster" }, 400);
  }

  const unitCount = cleanRoster.reduce((sum: number, r: any) => sum + r.qty, 0);
  if (unitCount < 1 || unitCount > 9900) return json({ error: "Invalid rider quantities" }, 400);
  const unitPriceCents = unitPrice(garment.base, unitCount);

  const { data, error } = await supabase
    .from("crf_apparel_orders")
    .insert({
      garment: garment.name,
      club_name: typeof body?.club_name === "string" ? body.club_name.trim().slice(0, 200) || null : null,
      customer_name: name,
      customer_email: email,
      notes: typeof body?.notes === "string" ? body.notes.trim().slice(0, 2000) || null : null,
      zones,
      roster: cleanRoster,
      unit_count: unitCount,
      unit_price_cents: unitPriceCents,
      total_cents: unitPriceCents * unitCount,
      currency: "THB",
      fx_usd_per_thb: 32.8,
    })
    .select("id, approval_token")
    .single();

  if (error || !data) {
    console.error("apparel order insert failed", error);
    return json({ error: "Could not save order" }, 500);
  }
  return json({ order_id: data.id, approval_token: data.approval_token }, 201);
});
