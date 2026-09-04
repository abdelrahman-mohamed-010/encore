import { z } from "zod";
import { email, optionalPhone, personName, uuid } from "./common";

export const buyerSchema = z.object({
  buyerName: personName,
  buyerEmail: email,
  buyerPhone: optionalPhone,
  promoCode: z.string().trim().max(40).optional().or(z.literal("")),
});
export type BuyerValues = z.input<typeof buyerSchema>;
export type BuyerData = z.output<typeof buyerSchema>;

/** Body of POST /api/checkout/order. */
export const createOrderSchema = buyerSchema.extend({ reservationId: uuid });

/** Body of POST /api/checkout/promo. */
export const validatePromoSchema = z.object({
  eventId: uuid,
  code: z.string().trim().min(1).max(40),
  subtotalCents: z.number().int().min(0),
});

/** Body of POST /api/orders/[orderId]/pay — the sandbox card form. */
export const sandboxCardSchema = z.object({
  cardNumber: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .refine((v) => /^\d{12,19}$/.test(v), "Enter a card number."),
  expiry: z
    .string()
    .trim()
    .refine((v) => /^\d{2}\s*\/\s*\d{2}$/.test(v), "Use MM / YY."),
  cvc: z.string().trim().refine((v) => /^\d{3,4}$/.test(v), "Enter the 3-digit code."),
});
export type SandboxCardValues = z.input<typeof sandboxCardSchema>;
export type SandboxCardData = z.output<typeof sandboxCardSchema>;

/** Body of POST /api/orders/[orderId]/refund. */
export const refundSchema = z.object({
  amountCents: z.number().int().positive(),
  reason: z.string().trim().max(300).optional(),
});
