"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAsyncAction } from "@/hooks";
import { signInSchema, type SignInData, type SignInValues } from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import { Form, FormError, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const form = useForm<SignInValues, unknown, SignInData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const signIn = useAsyncAction(async ({ email, password }: SignInData) => {
    const supabase = createClient();
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      // Never say which half was wrong — that turns the form into an account
      // enumeration oracle.
      throw new Error(
        error.message === "Invalid login credentials"
          ? "That email and password do not match an account."
          : error.message,
      );
    }

    toast.success("Signed in");

    // Default to /account/tickets, but if the user is an admin and didn't specify a custom next path,
    // auto-navigate them directly to the admin panel on first login.
    let destination = next?.startsWith("/") && !next.startsWith("//") ? next : "/account/tickets";
    if ((!next || next === "/account/tickets") && authData?.user?.id) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", authData.user.id)
          .maybeSingle();

        if (profile?.role === "admin") {
          destination = "/admin";
        }
      } catch {
        // Fallback to default destination on lookup error
      }
    }

    router.push(destination);
    router.refresh();
  });

  return (
    <Form form={form} onSubmit={signIn.run} className="space-y-4">
      <FormField<SignInValues, "email"> name="email" label="Email">
        {(field) => (
          <Input {...field} type="email" autoComplete="email" placeholder="you@example.com" />
        )}
      </FormField>

      <FormField<SignInValues, "password">
        name="password"
        label="Password"
        hint={
          <Link href="/auth/forgot-password" className="text-ink-2 underline underline-offset-4">
            Forgot your password?
          </Link>
        }
      >
        {(field) => (
          <Input {...field} type="password" autoComplete="current-password" placeholder="••••••••" />
        )}
      </FormField>

      <FormError message={signIn.error} />

      <Button type="submit" variant="primary" size="lg" block loading={form.formState.isSubmitting}>
        Sign in
      </Button>
    </Form>
  );
}
