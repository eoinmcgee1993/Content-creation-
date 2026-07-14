import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

// Signed download links expire after 24 hours
const SIGNED_URL_TTL_SECONDS = 86400;

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "";
    const fromEmail =
      Deno.env.get("FROM_EMAIL") ?? "fulfillment@yourdomain.com";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const payload = await req.json();

    // Only process completed purchase events
    if (payload.meta?.event_name !== "order_created") {
      return new Response(JSON.stringify({ skipped: true }), { status: 200 });
    }

    const targetSlug: string = payload.meta.custom_data?.slug;
    const buyerEmail: string = payload.data.attributes.user_email;

    if (!targetSlug || !buyerEmail) {
      return new Response(
        JSON.stringify({ error: "Missing slug or email in webhook payload" }),
        { status: 400 }
      );
    }

    // Retrieve the sales funnel record
    const { data: funnel, error: fetchError } = await supabase
      .from("sales_funnels")
      .select("*")
      .eq("slug", targetSlug)
      .single();

    if (fetchError || !funnel) {
      throw new Error(`Funnel record not found for slug: ${targetSlug}`);
    }

    // Generate a time-locked signed download URL from private storage
    const { data: signedData, error: storageError } = await supabase.storage
      .from("digital-assets")
      .createSignedUrl(funnel.storage_file_path, SIGNED_URL_TTL_SECONDS);

    if (storageError) throw storageError;

    // Dispatch the download link via Resend
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Delivery Core <${fromEmail}>`,
        to: [buyerEmail],
        subject: `Access Confirmed: Download ${funnel.product_name}`,
        html: `
          <h3>Your Order Is Ready</h3>
          <p>Your workspace asset has been generated and compiled successfully.</p>
          <p>
            <a href="${signedData.signedUrl}">
              Click here to download ${funnel.product_name}
            </a>
          </p>
          <p><small>This secure link expires in 24 hours.</small></p>
        `,
      }),
    });

    if (!emailRes.ok) {
      const detail = await emailRes.text();
      throw new Error(`Resend API error: ${emailRes.status} — ${detail}`);
    }

    return new Response(JSON.stringify({ processed: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
    });
  }
});
