export async function GET() {
  return Response.json({ ok: true, service: "degen-diaries", timestamp: new Date().toISOString() });
}
