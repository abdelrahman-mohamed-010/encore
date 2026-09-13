import { fail, ok } from "@/lib/api";
import { requireUserJson } from "@/lib/api-guards";
import { providerForOrder, isStripeConfigured } from "@/lib/payments";

/** Creates a Stripe PaymentIntent on the organizer's connected account. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;

  if (!isStripeConfigured()) {
    return fail("Stripe is not configured on this deployment.", 501);
  }

  const auth = await requireUserJson();
  if (auth.response) return auth.response;
  const { supabase, user } = auth.data;

  const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!order) return fail("Order not found.", 404);
  if (order.user_id !== user.id) return fail("This order belongs to someone else.", 403);
  if (order.status !== "pending") return fail(`This order is ${order.status}.`, 409);

  const { data: account } = await supabase
    .from("payment_accounts")
    .select("stripe_account_id, charges_enabled")
    .eq("organizer_id", order.organizer_id)
    .maybeSingle();

  if (!account?.stripe_account_id || !account.charges_enabled) {
    return fail("This organizer cannot take card payments yet.", 409);
  }

  try {
    const provider = providerForOrder(order);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(_request.url).origin;
    const intent = await provider.createIntent({
      order,
      connectedAccountId: account.stripe_account_id,
      returnUrl: `${siteUrl}/checkout/complete?order=${order.id}`,
    });

    // Store the reference straight away so a webhook arriving before the
    // customer finishes can still find this order.
    await supabase
      .from("orders")
      .update({
        payment_intent_id: intent.reference,
        connected_account_id: account.stripe_account_id,
        payment_status: "processing",
      })
      .eq("id", order.id);

    return ok({
      clientSecret: intent.clientSecret,
      reference: intent.reference,
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? null,
      connectedAccountId: account.stripe_account_id,
    });
  } catch (error) {
    return fail((error as Error).message, 400);
  }
}
