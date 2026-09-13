import { fail, ok } from "@/lib/api";
import { requireUserJson } from "@/lib/api-guards";

/** Buyer abandons a pending order; the hold is released immediately. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  const auth = await requireUserJson();
  if (auth.response) return auth.response;
  const { supabase } = auth.data;

  const { data, error } = await supabase.rpc("cancel_order", { p_order_id: orderId });
  if (error) return fail(error.message, 400);
  return ok(data);
}
