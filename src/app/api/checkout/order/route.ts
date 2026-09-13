import { fail, ok, parseBody, rpcErrorCode } from "@/lib/api";
import { requireUserJson } from "@/lib/api-guards";
import { createOrderSchema } from "@/lib/validation";

/**
 * Turns the buyer's active hold into a pending order and freezes the amounts.
 * The RPC re-checks ownership and expiry, so a stale tab cannot create an order
 * against someone else's hold.
 */
export async function POST(request: Request) {
  const parsed = await parseBody(request, createOrderSchema);
  if (parsed.response) return parsed.response;

  const auth = await requireUserJson();
  if (auth.response) return auth.response;
  const { supabase } = auth.data;

  const { data, error } = await supabase.rpc("create_order_from_reservation", {
    p_reservation_id: parsed.data.reservationId,
    p_buyer_name: parsed.data.buyerName,
    p_buyer_email: parsed.data.buyerEmail,
    p_buyer_phone: parsed.data.buyerPhone ?? undefined,
    p_promo_code: parsed.data.promoCode ?? undefined,
  });

  if (error) {
    return fail(error.message, 400, { code: rpcErrorCode(error.message) });
  }

  return ok(data);
}
