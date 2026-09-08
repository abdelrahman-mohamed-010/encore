"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAsyncAction } from "@/hooks";
import { signUpSchema, type SignUpData, type SignUpValues } from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import { Form, FormError, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export function RegisterForm({ next }: { next?: string }) {
  const router = useRouter();
  // The only genuine piece of local UI state: which of the two panels to show.
  const [pendingConfirmation, setPendingConfirmation] = useState<string | null>(null);

  const form = useForm<SignUpValues, unknown, SignUpData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  });

  const register = useAsyncAction(async ({ fullName, email, password }: SignUpData) => {
    const { data, error } = await createClient().auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback${
          next ? `?next=${encodeURIComponent(next)}` : ""
        }`,
      },
    });

    if (error) throw new Error(error.message);

    // No session means the project requires email confirmation first.
    if (!data.session) {
      setPendingConfirmation(email);
      return;
    }

    toast.success("Welcome to Encore");
    router.push(next?.startsWith("/") ? next : "/account/tickets");
    router.refresh();
  });

  if (pendingConfirmation) {
    return (
      <div className="text-center">
        <span className="mx-auto grid size-11 place-items-center rounded-xl border border-hairline bg-sunken text-ink-2">
          <MailCheck className="size-5" />
        </span>
        <p className="mt-4 text-md font-medium text-ink">Confirm your email</p>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-2">
          We sent a link to <span className="font-medium text-ink">{pendingConfirmation}</span>.
          Open it to finish creating your account.
        </p>
        <Button variant="ghost" size="sm" className="mt-5" onClick={() => setPendingConfirmation(null)}>
          Use a different email
        </Button>
      </div>
    );
  }

  return (
    <Form form={form} onSubmit={register.run} className="space-y-4">
      <FormField<SignUpValues, "fullName"> name="fullName" label="Full name" required>
        {(field) => <Input {...field} autoComplete="name" placeholder="Nour Ibrahim" />}
      </FormField>

      <FormField<SignUpValues, "email"> name="email" label="Email" required>
        {(field) => <Input {...field} type="email" autoComplete="email" placeholder="you@example.com" />}
      </FormField>

      <FormField<SignUpValues, "password"> name="password" label="Password" required hint="At least 8 characters.">
        {(field) => <Input {...field} type="password" autoComplete="new-password" placeholder="••••••••" />}
      </FormField>

      <FormError message={register.error} />

      <Button type="submit" variant="primary" size="lg" block loading={form.formState.isSubmitting}>
        Create account
      </Button>

      <p className="text-center text-xs leading-relaxed text-ink-3">
        By creating an account you agree to our Terms and Privacy Policy.
      </p>
    </Form>
  );
}
