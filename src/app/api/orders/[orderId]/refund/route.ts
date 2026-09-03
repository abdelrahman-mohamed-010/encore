import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { fail, ok, parseBody } from "@/lib/api";
import { providerForOrder } from "@/lib/payments";
import { recordRefund } from "@/lib/payments/rpc";

const schema = z.object({
  amountCents: z.number().int().positive(),
  reason: z.string().trim().max(300).optional(),
});

/**
 * Organizer-initiated refund. The money moves at the provider first; only then
 * do we record it, so the database never claims a refund that did not happen.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  const parsed = await parseBody(request, schema);
  if (parsed.response) return parsed.response;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("You must be signed in.", 401);

  // RLS lets tenant staff read the order; the membership check below then
  // narrows refunds to owners and admins.
  const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!order) return fail("Order not found.", 404);

  const { data: membership } = await supabase
    .from("organizer_members")
    .select("role")
    .eq("organizer_id", order.organizer_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return fail("Only an owner or admin can issue refunds.", 403);
  }

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
