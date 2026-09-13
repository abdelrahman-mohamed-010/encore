"use server";

import { z } from "zod";
import { actionError, authActionClient } from "@/lib/safe-action";
import { uuid } from "@/lib/validation/common";

export const createReservation = authActionClient
  .inputSchema(
    z.object({
      eventId: uuid,
      items: z.array(z.object({ ticket_type_id: uuid, quantity: z.number().int().min(1) })),
      seatIds: z.array(uuid),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const { data, error } = await ctx.supabase.rpc("create_reservation", {
      p_event_id: parsedInput.eventId,
      p_items: parsedInput.items,
      p_seat_ids: parsedInput.seatIds,
    });

    if (error) actionError(error.message);
    return data as { reservation_id: string };
  });

export const expireReservations = authActionClient
  .inputSchema(z.object({ eventId: uuid }))
  .action(async ({ parsedInput, ctx }) => {
    await ctx.supabase.rpc("expire_reservations", { p_event_id: parsedInput.eventId });
  });
