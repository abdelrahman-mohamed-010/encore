import type { Order } from "@/lib/types";

export type PaymentIntentResult = {
  /** Provider-side identifier stored on the order. */
  reference: string;
  /** Present for Stripe: handed to the Payment Element in the browser. */
  clientSecret?: string;
  /** The connected account the charge was created on, when applicable. */
  connectedAccountId?: string;
  /** Sandbox settles synchronously; Stripe needs a client-side confirmation. */
  requiresClientConfirmation: boolean;
};

export type PaymentStatus = "requires_payment" | "processing" | "succeeded" | "failed";

export type CreateIntentInput = {
  order: Order;
  connectedAccountId: string | null;
  /** Absolute URL to return to once the customer finishes payment. */
  returnUrl: string;
};

export type RefundInput = {
  order: Order;
  amountCents: number;
  reason?: string;
};

/**
 * A payment rail. Encore ships two: `stripe`, which charges on the
 * organizer's own connected account and takes a platform application fee, and
 * `sandbox`, which simulates the same lifecycle so the product is fully
 * usable before any organizer has connected Stripe.
 */
export interface PaymentProvider {
  readonly id: "stripe" | "sandbox";
  createIntent(input: CreateIntentInput): Promise<PaymentIntentResult>;
  getStatus(reference: string, connectedAccountId?: string | null): Promise<PaymentStatus>;
  refund(input: RefundInput): Promise<{ refundId: string }>;
}
