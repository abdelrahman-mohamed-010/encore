"use server";

import { z } from "zod";
import { actionError, authActionClient } from "@/lib/safe-action";
import { uuid } from "@/lib/validation/common";
import type { ScanResult } from "@/lib/types";

export type ScanOutcomeData = {
  result: ScanResult;
  ticket_code: string;
  attendee_name: string | null;
  ticket_type: string | null;
  seat_label: string | null;
};

export const scanTicket = authActionClient
  .inputSchema(
    z.object({
      eventId: uuid,
      ticketCode: z.string().trim().min(1).max(64),
      qrSecret: z.string().trim().min(1).max(128),
      deviceInfo: z.string().max(120).optional(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const { data, error } = await ctx.supabase.rpc("scan_ticket", {
      p_ticket_code: parsedInput.ticketCode,
      p_qr_secret: parsedInput.qrSecret,
      p_event_id: parsedInput.eventId,
      p_device_info: parsedInput.deviceInfo,
    });

    if (error) actionError(error.message);
    return data as ScanOutcomeData;
  });
