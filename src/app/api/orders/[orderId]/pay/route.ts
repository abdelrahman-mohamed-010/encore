import { fail, ok, parseBody, rpcErrorCode } from "@/lib/api";
import { requireUserJson } from "@/lib/api-guards";
import { finalizeOrderPayment, failOrderPayment } from "@/lib/payments/rpc";
import { sandboxDecline } from "@/lib/payments";
import { sandboxPaySchema } from "@/lib/validation";

/**
 * Sandbox settlement. Used for free orders and for organizers who have not
 * connected Stripe: it validates a simulated card, then runs exactly the same
 * finalisation path a real Stripe webhook would.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  const auth = await requireUserJson();
  if (auth.response) return auth.response;
  const { supabase, user } = auth.data;

  const { data: order } = await supabase
    .from("orders")
    .select("id, user_id, status, total_cents, payment_provider")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return fail("Order not found.", 404);
  if (order.user_id !== user.id) return fail("This order belongs to someone else.", 403);
  if (order.status === "paid") return ok({ orderId, alreadyPaid: true });
  if (order.status !== "pending") return fail(`This order is ${order.status}.`, 409);
  if (order.payment_provider !== "sandbox") {
    return fail("This order must be paid with Stripe.", 409);
  }

  // Free orders skip the card entirely.
  if (order.total_cents > 0) {
    const parsed = await parseBody(request, sandboxPaySchema);
    if (parsed.response) return parsed.response;

    const decline = sandboxDecline(parsed.data.cardNumber);
    if (decline) {
      await failOrderPayment(orderId, decline).catch(() => undefined);
      return fail(decline, 402, { declined: true });
    }
  }

  try {
    const result = await finalizeOrderPayment(orderId, `sbx_${orderId.slice(0, 8)}`);

    // The hold can time out between creating the order and paying for it. The
    // RPC records the failure and reports it rather than raising, so the order
    // does not linger as "pending".
    if (result.status === "failed") {
      return fail(result.message ?? "The ticket hold expired.", 409, { code: result.error });
    }

    return ok(result);
  } catch (error) {
    const message = (error as Error).message;
    return fail(message, 409, { code: rpcErrorCode(message) });
  }
}
