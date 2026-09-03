import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { fail, ok, parseBody, rpcErrorCode } from "@/lib/api";

const schema = z.object({
  reservationId: z.string().uuid(),
  buyerName: z.string().trim().min(2).max(120),
  buyerEmail: z.string().trim().email(),
  buyerPhone: z.string().trim().max(40).optional().nullable(),
  promoCode: z.string().trim().max(40).optional().nullable(),
});

/**
 * Turns the buyer's active hold into a pending order and freezes the amounts.
 * The RPC re-checks ownership and expiry, so a stale tab cannot create an order
 * against someone else's hold.
 */
export async function POST(request: Request) {
  const parsed = await parseBody(request, schema);
  if (parsed.response) return parsed.response;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("You must be signed in to check out.", 401);

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
