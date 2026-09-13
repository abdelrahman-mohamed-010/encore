import { createClient } from "@/lib/supabase/server";
import { fail, ok, parseBody } from "@/lib/api";
import { validatePromoSchema } from "@/lib/validation";
import type { PromoValidation } from "@/lib/types";

export async function POST(request: Request) {
  const parsed = await parseBody(request, validatePromoSchema);
  if (parsed.response) return parsed.response;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("validate_promo_code", {
    p_event_id: parsed.data.eventId,
    p_code: parsed.data.code,
    p_subtotal_cents: parsed.data.subtotalCents,
  });

  if (error) return fail(error.message, 400);
  return ok(data as unknown as PromoValidation);
}
