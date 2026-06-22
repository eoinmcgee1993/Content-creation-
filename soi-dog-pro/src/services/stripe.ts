import { supabase } from './supabase';

const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!;

export { STRIPE_PUBLISHABLE_KEY };

export type DonationPayload = {
  missionId: string;
  amountCents: number;
  userId: string;
};

// Calls a Supabase Edge Function that creates a Stripe PaymentIntent server-side.
// The client never touches the secret key.
export async function createPaymentIntent(
  payload: DonationPayload
): Promise<{ clientSecret: string }> {
  const { data, error } = await supabase.functions.invoke('create-payment-intent', {
    body: payload,
  });

  if (error) throw new Error(error.message);
  return data as { clientSecret: string };
}

export function formatAmount(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
