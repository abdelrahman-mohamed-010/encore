import { createClient } from "@/lib/supabase/server";
import { fail, ok } from "@/lib/api";

/** Buyer abandons a pending order; the hold is released immediately. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("You must be signed in.", 401);

  const { data, error } = await supabase.rpc("cancel_order", { p_order_id: orderId });
  if (error) return fail(error.message, 400);
  return ok(data);
}
