// Supabase Edge Function: create-payment-intent
// Deploy with: supabase functions deploy create-payment-intent
// Requires env var STRIPE_SECRET_KEY set in Supabase dashboard

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  try {
    const { amountCents, missionId, userId } = await req.json();

    if (!amountCents || amountCents < 50) {
      return new Response(JSON.stringify({ error: 'Minimum donation is $0.50' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const stripeRes = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: String(amountCents),
        currency: 'usd',
        'metadata[mission_id]': missionId,
        'metadata[user_id]': userId,
        automatic_payment_methods: 'true',
      }).toString(),
    });

    const intent = await stripeRes.json();

    if (!stripeRes.ok) {
      throw new Error(intent.error?.message ?? 'Stripe error');
    }

    return new Response(JSON.stringify({ clientSecret: intent.client_secret }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
