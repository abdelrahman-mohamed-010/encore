import { z } from "zod";
import { email, optionalText, optionalUrl, slug } from "./common";

export const organizerSchema = z.object({
  name: z.string().trim().min(2, "Give your organization a name.").max(120, "That name is too long."),
  slug,
  description: optionalText(2000),
  supportEmail: email.optional().or(z.literal("")),
  website: optionalUrl,
  logoUrl: optionalUrl,
});
export type OrganizerValues = z.input<typeof organizerSchema>;
export type OrganizerData = z.output<typeof organizerSchema>;

export const profileSchema = z.object({
  fullName: z.string().trim().max(120, "That name is too long.").optional().or(z.literal("")),
  phone: z.string().trim().max(40, "That phone number is too long.").optional().or(z.literal("")),
  bio: optionalText(600),
  avatarUrl: optionalUrl,
});
export type ProfileValues = z.input<typeof profileSchema>;
export type ProfileData = z.output<typeof profileSchema>;

export const teamMemberSchema = z.object({
  email,
  role: z.enum(["owner", "admin", "staff", "scanner"]),
});
export type TeamMemberValues = z.input<typeof teamMemberSchema>;
export type TeamMemberData = z.output<typeof teamMemberSchema>;
