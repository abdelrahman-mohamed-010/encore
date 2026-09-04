"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAsyncAction } from "@/hooks";
import { forgotPasswordSchema, type ForgotPasswordData, type ForgotPasswordValues } from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import { Form, FormError, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);

  const form = useForm<ForgotPasswordValues, unknown, ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const request = useAsyncAction(async ({ email }: ForgotPasswordData) => {
    const { error } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    // Report success either way: revealing which addresses exist would leak the
    // user list.
    if (error && !error.message.toLowerCase().includes("user not found")) {
      throw new Error(error.message);
    }
    setSentTo(email);
  });

  if (sentTo) {
    return (
      <div className="text-center">
        <span className="mx-auto grid size-11 place-items-center rounded-xl border border-hairline bg-sunken text-ink-2">
          <MailCheck className="size-5" />
        </span>
        <p className="mt-4 text-md font-medium text-ink">Check your inbox</p>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-2">
          If an account exists for <span className="font-medium text-ink">{sentTo}</span>, a reset
          link is on its way.
        </p>
      </div>
    );
  }

  return (
    <Form form={form} onSubmit={request.run} className="space-y-4">
      <FormField<ForgotPasswordValues, "email"> name="email" label="Email">
        {(field) => <Input {...field} type="email" autoComplete="email" placeholder="you@example.com" />}
      </FormField>

      <FormError message={request.error} />

      <Button type="submit" variant="primary" size="lg" block loading={form.formState.isSubmitting}>
        Send reset link
      </Button>
    </Form>
  );
}
