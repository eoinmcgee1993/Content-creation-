import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface GeminiResult {
  is_viable: boolean;
  product_name: string;
  headline: string;
  transformation_bullets: string[];
  slug: string;
  compiled_asset_content: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY") ?? "";
    const checkoutBaseUrl =
      Deno.env.get("CHECKOUT_BASE_URL") ?? "https://checkout.yourplatform.com/buy";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { record } = await req.json();

    // ── Step 1: Ask Gemini to validate the signal and compile the full product ──
    const generationPrompt = `
You are an expert product developer and niche content creator.
Analyze this problem statement: "${record.raw_text}".

Perform two tasks:
1. Determine whether this pain point is commercially viable as a digital product.
2. Write the COMPLETE markdown content for a high-utility digital product
   (comprehensive checklist, step-by-step guide, or copy-pasteable AI prompt
   suite) that provides a definitive solution. Write every word — no
   summaries, no placeholders.

Return strict JSON matching this schema exactly:
{
  "is_viable": boolean,
  "product_name": "string",
  "headline": "string",
  "transformation_bullets": ["string", "string", "string"],
  "slug": "string (url-safe kebab-case)",
  "compiled_asset_content": "string (complete markdown product file)"
}`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: generationPrompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "object",
              properties: {
                is_viable: { type: "boolean" },
                product_name: { type: "string" },
                headline: { type: "string" },
                transformation_bullets: {
                  type: "array",
                  items: { type: "string" },
                },
                slug: { type: "string" },
                compiled_asset_content: { type: "string" },
              },
              required: [
                "is_viable",
                "product_name",
                "headline",
                "transformation_bullets",
                "slug",
                "compiled_asset_content",
              ],
            },
          },
        }),
      }
    );

    const geminiRaw = await geminiResponse.json();
    const result: GeminiResult = JSON.parse(
      geminiRaw.candidates[0].content.parts[0].text
    );

    if (!result.is_viable) {
      await supabase
        .from("scraped_signals")
        .update({ processing_status: "failed" })
        .eq("id", record.id);
      return new Response(JSON.stringify({ status: "skipped" }), {
        headers: corsHeaders,
      });
    }

    // ── Step 2: Upload compiled product content to private storage bucket ──
    const filePath = `${result.slug}-${crypto.randomUUID()}.md`;
    const fileBytes = new TextEncoder().encode(result.compiled_asset_content);

    const { error: uploadError } = await supabase.storage
      .from("digital-assets")
      .upload(filePath, fileBytes, {
        contentType: "text/markdown",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // ── Step 3: Insert live sales funnel record ──
    const checkoutUrl = `${checkoutBaseUrl}/${result.slug}`;

    const { error: insertError } = await supabase
      .from("sales_funnels")
      .insert({
        signal_id: record.id,
        slug: result.slug,
        product_name: result.product_name,
        headline: result.headline,
        transformation_bullets: result.transformation_bullets,
        price_cents: 2700,
        checkout_url: checkoutUrl,
        storage_file_path: filePath,
      });

    if (insertError) throw insertError;

    await supabase
      .from("scraped_signals")
      .update({ processing_status: "processed" })
      .eq("id", record.id);

    return new Response(
      JSON.stringify({ status: "success", product: result.product_name }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
