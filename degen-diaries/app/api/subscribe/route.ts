export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!body.email || typeof body.email !== "string") return Response.json({ error: "Valid email required" }, { status: 400 });
  return Response.json({ ok: true, message: "Subscription endpoint ready for Stripe checkout integration." });
}
