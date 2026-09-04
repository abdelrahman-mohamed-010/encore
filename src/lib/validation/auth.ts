import { z } from "zod";
import { email, password, personName } from "./common";

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password."),
});
export type SignInValues = z.input<typeof signInSchema>;
export type SignInData = z.output<typeof signInSchema>;

export const signUpSchema = z.object({
  fullName: personName,
  email,
  password,
});
export type SignUpValues = z.input<typeof signUpSchema>;
export type SignUpData = z.output<typeof signUpSchema>;

export const forgotPasswordSchema = z.object({ email });
export type ForgotPasswordValues = z.input<typeof forgotPasswordSchema>;
export type ForgotPasswordData = z.output<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password,
    confirm: z.string().min(1, "Repeat your new password."),
  })
  .refine((values) => values.password === values.confirm, {
    message: "Those passwords do not match.",
    path: ["confirm"],
  });
export type ResetPasswordValues = z.input<typeof resetPasswordSchema>;
export type ResetPasswordData = z.output<typeof resetPasswordSchema>;
