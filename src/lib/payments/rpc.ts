import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Wrappers for the secret-gated database RPCs. These move money-critical state
 * (issuing tickets, failing an order, recording a refund) and are only ever
 * called from route handlers after the payment provider has been consulted.
 * The shared secret lives in SUPABASE_SERVER_SECRET and never reaches a browser.
 */
function serverSecret() {
  const secret = process.env.SUPABASE_SERVER_SECRET;
  if (!secret) {
    throw new Error(
      "SUPABASE_SERVER_SECRET is not set. Payment finalisation is disabled until it is.",
    );
  }
  return secret;
}

export async function finalizeOrderPayment(
  orderId: string,
  paymentIntentId: string | null,
  connectedAccountId?: string | null,
) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("finalize_order_payment", {
    p_order_id: orderId,
    // The SQL does `coalesce(p_payment_intent_id, payment_intent_id)`, so NULL
    // means "leave the stored reference alone". The generated types type this
    // as a plain string, hence the cast — an empty string would wipe the value.
    p_payment_intent_id: (paymentIntentId ?? null) as unknown as string,
    p_secret: serverSecret(),
    p_connected_account: connectedAccountId ?? undefined,
  });
  if (error) throw new Error(error.message);
  return data as {
    order_id: string;
    order_number: string;
    status: string;
    already_finalized: boolean;
    ticket_count: number;
  };
}

export async function failOrderPayment(orderId: string, reason: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("fail_order_payment", {
    p_order_id: orderId,
    p_reason: reason,
    p_secret: serverSecret(),
  });
  if (error) throw new Error(error.message);
  return data as { order_id: string; status: string; changed: boolean };
}

export async function recordRefund(
  orderId: string,
  amountCents: number,
  reason: string,
  providerRefundId: string,
) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("record_refund", {
    p_order_id: orderId,
    p_amount_cents: amountCents,
    p_reason: reason,
    p_refund_id: providerRefundId,
    p_secret: serverSecret(),
  });
  if (error) throw new Error(error.message);
  return data as { order_id: string; refunded_cents: number; full_refund: boolean };
}

export async function syncPaymentAccount(
  stripeAccountId: string,
  fields: {
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    detailsSubmitted: boolean;
    requirements: unknown;
  },
) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("sync_payment_account", {
    p_stripe_account_id: stripeAccountId,
    p_charges_enabled: fields.chargesEnabled,
    p_payouts_enabled: fields.payoutsEnabled,
    p_details_submitted: fields.detailsSubmitted,
    p_requirements: fields.requirements as never,
    p_secret: serverSecret(),
  });
  if (error) throw new Error(error.message);
  return data as { updated: boolean; payment_account_id: string | null };
}
