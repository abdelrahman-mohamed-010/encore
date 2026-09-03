import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { fail, ok, parseBody } from "@/lib/api";
import type { PromoValidation } from "@/lib/types";

const schema = z.object({
  eventId: z.string().uuid(),
  code: z.string().min(1).max(40),
  subtotalCents: z.number().int().min(0),
});

export async function POST(request: Request) {
  const parsed = await parseBody(request, schema);
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
