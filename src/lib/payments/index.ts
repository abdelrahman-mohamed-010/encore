import type { Order } from "@/lib/types";
import { sandboxProvider } from "./sandbox";
import { stripeProvider, isStripeConfigured } from "./stripe";
import type { PaymentProvider } from "./types";

export * from "./types";
export { sandboxProvider, sandboxDecline, isSandboxCardAccepted } from "./sandbox";
export { getStripe, isStripeConfigured, isStripeConnectConfigured } from "./stripe";

/**
 * Pick the rail for an order. The database already decided this when the order
 * was created (`orders.payment_provider`), so the two never disagree; we fall
 * back to the sandbox if Stripe keys are missing at runtime.
 */
export function providerForOrder(order: Pick<Order, "payment_provider">): PaymentProvider {
  if (order.payment_provider === "stripe" && isStripeConfigured()) return stripeProvider;
  return sandboxProvider;
}
