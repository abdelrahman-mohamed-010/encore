import { fail, ok, rpcErrorCode } from "@/lib/api";
import { requireUserJson } from "@/lib/api-guards";
import { providerForOrder } from "@/lib/payments";
import { finalizeOrderPayment } from "@/lib/payments/rpc";

/**
 * Synchronous fallback for the Stripe flow: after the customer confirms in the
 * browser we re-read the intent server-side and finalise if it succeeded. The
 * webhook does the same thing, and finalisation is idempotent, so whichever
 * arrives first wins and the other is a no-op.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  const auth = await requireUserJson();
  if (auth.response) return auth.response;
  const { supabase, user } = auth.data;

  const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!order) return fail("Order not found.", 404);
  if (order.user_id !== user.id) return fail("This order belongs to someone else.", 403);
  if (order.status === "paid") return ok({ orderId, status: "paid", alreadyPaid: true });
  if (!order.payment_intent_id) return fail("This order has no payment in progress.", 409);

  try {
    const provider = providerForOrder(order);
    const status = await provider.getStatus(order.payment_intent_id, order.connected_account_id);

    if (status !== "succeeded") {
      return fail(`Payment is ${status.replace(/_/g, " ")}.`, 409, { status });
    }

    const result = await finalizeOrderPayment(
      orderId,
      order.payment_intent_id,
      order.connected_account_id,
    );

    if (result.status === "failed") {
      return fail(result.message ?? "The ticket hold expired.", 409, { code: result.error });
    }

    return ok(result);
  } catch (error) {
    const message = (error as Error).message;
    return fail(message, 409, { code: rpcErrorCode(message) });
  }
}
