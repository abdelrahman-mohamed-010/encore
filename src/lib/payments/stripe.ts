import Stripe from "stripe";
import type { PaymentProvider, PaymentStatus } from "./types";

let cached: Stripe | null = null;

/** Platform-level Stripe client, or null when this deployment has no keys. */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!cached) {
    // Pin to the SDK's own pinned version rather than a literal, so an
    // SDK bump never fails the build on a stale API-version string.
    cached = new Stripe(key, { typescript: true });
  }
  return cached;
}

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function isStripeConnectConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_CONNECT_CLIENT_ID);
}

function mapStatus(status: Stripe.PaymentIntent.Status): PaymentStatus {
  switch (status) {
    case "succeeded":
      return "succeeded";
    case "processing":
    case "requires_capture":
      return "processing";
    case "canceled":
      return "failed";
    default:
      return "requires_payment";
  }
}

/**
 * Charges on the organizer's own connected account using a destination charge:
 * the customer pays, the organizer receives the funds, and Encore keeps
 * `application_fee_amount`. The organizer's Stripe account — not ours — is the
 * merchant of record for the ticket sale.
 */
export const stripeProvider: PaymentProvider = {
  id: "stripe",

  async createIntent({ order, connectedAccountId, returnUrl }) {
    const stripe = getStripe();
    if (!stripe) throw new Error("Stripe is not configured on this deployment.");
    if (!connectedAccountId) {
      throw new Error("This organizer has not connected a Stripe account.");
    }

    const intent = await stripe.paymentIntents.create(
      {
        amount: order.total_cents,
        currency: order.currency.toLowerCase(),
        automatic_payment_methods: { enabled: true },
        application_fee_amount: order.application_fee_cents || undefined,
        transfer_data: { destination: connectedAccountId },
        receipt_email: order.buyer_email,
        description: `Encore order ${order.order_number}`,
        metadata: {
          order_id: order.id,
          order_number: order.order_number,
          event_id: order.event_id,
          organizer_id: order.organizer_id,
        },
      },
      { idempotencyKey: `order_${order.id}_${order.total_cents}` },
    );

    return {
      reference: intent.id,
      clientSecret: intent.client_secret ?? undefined,
      connectedAccountId,
      requiresClientConfirmation: true,
      returnUrl,
    } as Awaited<ReturnType<PaymentProvider["createIntent"]>>;
  },

  async getStatus(reference) {
    const stripe = getStripe();
    if (!stripe) throw new Error("Stripe is not configured on this deployment.");
    const intent = await stripe.paymentIntents.retrieve(reference);
    return mapStatus(intent.status);
  },

  async refund({ order, amountCents, reason }) {
    const stripe = getStripe();
    if (!stripe) throw new Error("Stripe is not configured on this deployment.");
    if (!order.payment_intent_id) throw new Error("This order has no payment to refund.");

    const refund = await stripe.refunds.create({
      payment_intent: order.payment_intent_id,
      amount: amountCents,
      // Pull the platform fee back proportionally with the refund.
      refund_application_fee: true,
      reverse_transfer: true,
      metadata: { order_id: order.id, reason: reason ?? "" },
    });

    return { refundId: refund.id };
  },
};
