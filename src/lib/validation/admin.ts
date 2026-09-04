import { z } from "zod";

/** Schemas for the platform-admin console. */

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Give the category a name of at least 2 characters.")
    .max(60, "Keep the name under 60 characters."),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Pick a colour.")
    .transform((value) => value.toLowerCase()),
});

export type CategoryValues = z.input<typeof categorySchema>;
export type CategoryData = z.output<typeof categorySchema>;
