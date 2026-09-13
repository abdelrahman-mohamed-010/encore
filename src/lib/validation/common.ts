import { z } from "zod";

/**
 * Shared field-level schemas. Defining them once means the browser form and the
 * API route that receives it enforce byte-identical rules — a client-side rule
 * can never quietly drift from the server-side one.
 */

export const uuid = z.uuid("That is not a valid identifier.");

export const email = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .email("Enter a valid email address.")
  .transform((value) => value.toLowerCase());

export const password = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(72, "Passwords are limited to 72 characters.");

export const personName = z
  .string()
  .trim()
  .min(2, "Enter a name of at least 2 characters.")
  .max(120, "That name is too long.");

export const optionalPhone = z
  .string()
  .trim()
  .max(40, "That phone number is too long.")
  .optional()
  .or(z.literal(""));

export const optionalUrl = z
  .string()
  .trim()
  .url("Enter a full URL, starting with https://")
  .optional()
  .or(z.literal(""));

export const optionalText = (max: number) =>
  z.string().trim().max(max, `Keep this under ${max} characters.`).optional().or(z.literal(""));

export const slug = z
  .string()
  .trim()
  .min(2, "Use at least 2 characters.")
  .max(60, "Keep this under 60 characters.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes only.");

/** Turns any string into a valid slug. Used to suggest one from a name. */
export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Comma-separated tags -> a clean, de-duplicated array. */
export const tagList = z
  .string()
  .trim()
  .optional()
  .transform((value) =>
    value
      ? [...new Set(value.split(",").map((tag) => tag.trim()).filter(Boolean))].slice(0, 20)
      : [],
  );
