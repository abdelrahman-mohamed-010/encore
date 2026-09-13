import { fail, ok, parseBody } from "@/lib/api";
import { requireOrgRoleJson, requireUserJson } from "@/lib/api-guards";
import { providerForOrder } from "@/lib/payments";
import { recordRefund } from "@/lib/payments/rpc";
import { refundSchema } from "@/lib/validation";

/**
 * Organizer-initiated refund. The money moves at the provider first; only then
 * do we record it, so the database never claims a refund that did not happen.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  const parsed = await parseBody(request, refundSchema);
  if (parsed.response) return parsed.response;

  const auth = await requireUserJson();
  if (auth.response) return auth.response;
  const { supabase, user } = auth.data;

  // RLS lets tenant staff read the order; the membership check below then
  // narrows refunds to owners and admins.
  const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!order) return fail("Order not found.", 404);

  const allowed = await requireOrgRoleJson(
    supabase,
    order.organizer_id,
    user.id,
    "admin",
    "Only an owner or admin can issue refunds.",
  );
  if (allowed.response) return allowed.response;

  const remaining = order.total_cents - order.refunded_cents;
  if (parsed.data.amountCents > remaining) {
    return fail(`The most you can refund is ${(remaining / 100).toFixed(2)}.`, 400);
  }

  try {
    const provider = providerForOrder(order);
    const { refundId } = await provider.refund({
      order,
      amountCents: parsed.data.amountCents,
      reason: parsed.data.reason,
    });

    const result = await recordRefund(
      orderId,
      parsed.data.amountCents,
      parsed.data.reason ?? "Refunded by the organizer",
      refundId,
    );

    return ok(result);
  } catch (error) {
    return fail((error as Error).message, 400);
  }
}
