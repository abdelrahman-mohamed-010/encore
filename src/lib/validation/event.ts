import { z } from "zod";
import { optionalText, optionalUrl, tagList } from "./common";

export const eventSchema = z
  .object({
    title: z.string().trim().min(3, "Give the event a title of at least 3 characters.").max(160),
    subtitle: optionalText(200),
    description: optionalText(20_000),
    categoryId: z.string().optional().or(z.literal("")),
    venueId: z.string().optional().or(z.literal("")),
    isOnline: z.boolean(),
    onlineUrl: z.string().trim().optional().or(z.literal("")),
    startsAt: z.string().min(1, "Set when the event starts."),
    endsAt: z.string().min(1, "Set when the event ends."),
    coverImageUrl: optionalUrl,
    tags: tagList,
    refundPolicy: optionalText(1000),
    minAge: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine((v) => !v || (/^\d+$/.test(v) && Number(v) <= 120), "Enter an age between 0 and 120."),
  })
  // Cross-field rules live with the schema, so both the form and the server
  // reach the same verdict without duplicating the logic.
  .refine((values) => new Date(values.endsAt) > new Date(values.startsAt), {
    message: "The end time must be after the start time.",
    path: ["endsAt"],
  })
  .refine((values) => values.isOnline || Boolean(values.venueId), {
    message: "Choose a venue, or mark the event as online.",
    path: ["venueId"],
  })
  .refine((values) => !values.isOnline || Boolean(values.onlineUrl?.trim()), {
    message: "Add the joining link for an online event.",
    path: ["onlineUrl"],
  });

export type EventValues = z.input<typeof eventSchema>;
export type EventData = z.output<typeof eventSchema>;

export const ticketTypeSchema = z
  .object({
    name: z.string().trim().min(1, "Give the ticket type a name.").max(80),
    description: optionalText(500),
    price: z
      .string()
      .trim()
      .refine((v) => /^\d+(\.\d{1,2})?$/.test(v), "Enter a price like 45 or 45.50."),
    quantityTotal: z.string().trim().refine((v) => /^\d+$/.test(v), "Enter a whole number."),
    minPerOrder: z.string().trim().refine((v) => /^\d+$/.test(v) && Number(v) >= 1, "At least 1."),
    maxPerOrder: z.string().trim().refine((v) => /^\d+$/.test(v) && Number(v) >= 1, "At least 1."),
    isHidden: z.boolean(),
  })
  .refine((v) => Number(v.maxPerOrder) >= Number(v.minPerOrder), {
    message: "The maximum cannot be below the minimum.",
    path: ["maxPerOrder"],
  });

export type TicketTypeValues = z.input<typeof ticketTypeSchema>;
export type TicketTypeData = z.output<typeof ticketTypeSchema>;

export const promoSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "Codes need at least 3 characters.")
      .max(40)
      .regex(/^[A-Za-z0-9_-]+$/, "Use letters, numbers, dashes and underscores.")
      .transform((v) => v.toUpperCase()),
    discountType: z.enum(["percentage", "fixed"]),
    value: z.string().trim().refine((v) => Number(v) > 0, "Enter a discount above zero."),
    eventId: z.string().optional().or(z.literal("")),
    maxRedemptions: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine((v) => !v || /^\d+$/.test(v), "Enter a whole number."),
    minOrder: z.string().trim().refine((v) => /^\d+(\.\d{1,2})?$/.test(v), "Enter an amount."),
  })
  .refine((v) => v.discountType !== "percentage" || Number(v.value) <= 100, {
    message: "A percentage cannot exceed 100.",
    path: ["value"],
  });

export type PromoValues = z.input<typeof promoSchema>;
export type PromoData = z.output<typeof promoSchema>;
