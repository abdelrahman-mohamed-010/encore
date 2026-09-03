import type Stripe from "stripe";
import { getStripe } from "@/lib/payments/stripe";
import { failOrderPayment, finalizeOrderPayment, recordRefund, syncPaymentAccount } from "@/lib/payments/rpc";
import { fail, ok } from "@/lib/api";

/**
 * Stripe webhook. Every handler is idempotent because Stripe retries, and the
 * database RPCs already no-op on replay.
 *
 * Configure with:
 *   stripe listen --forward-to <site>/api/webhooks/stripe
 * and set STRIPE_WEBHOOK_SECRET.
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return fail("Stripe webhooks are not configured on this deployment.", 501);
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return fail("Missing stripe-signature header.", 400);

  // The raw body is required for signature verification.
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    return fail(`Signature verification failed: ${(error as Error).message}`, 400);
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const intent = event.data.object;
        const orderId = intent.metadata?.order_id;
        if (orderId) {
          await finalizeOrderPayment(orderId, intent.id, event.account ?? null);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const intent = event.data.object;
        const orderId = intent.metadata?.order_id;
        if (orderId) {
          await failOrderPayment(
            orderId,
            intent.last_payment_error?.message ?? "The payment failed.",
          );
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object;
        const orderId = charge.metadata?.order_id;
        if (orderId && charge.amount_refunded > 0) {
          await recordRefund(
            orderId,
            charge.amount_refunded,
            "Refunded in Stripe",
            charge.id,
          );
        }
        break;
      }

      case "account.updated": {
        const account = event.data.object;
        await syncPaymentAccount(account.id, {
          chargesEnabled: account.charges_enabled ?? false,
          payoutsEnabled: account.payouts_enabled ?? false,
          detailsSubmitted: account.details_submitted ?? false,
          requirements: account.requirements?.currently_due ?? [],
        });
        break;
      }

      default:
        // Unhandled event types are acknowledged so Stripe stops retrying.
        break;
    }
  } catch (error) {
    // Return 500 so Stripe retries genuine failures.
    return fail((error as Error).message, 500);
  }

  return ok({ received: true, type: event.type });
}
