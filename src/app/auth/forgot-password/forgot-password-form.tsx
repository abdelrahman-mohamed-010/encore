"use client";

import { useState } from "react";
import { MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    setLoading(false);
    // Always report success: revealing which addresses exist is an enumeration leak.
    if (error && !error.message.toLowerCase().includes("user not found")) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="text-center">
        <span className="mx-auto grid size-11 place-items-center rounded-xl border border-hairline bg-sunken text-ink-2">
          <MailCheck className="size-5" />
        </span>
        <p className="mt-4 text-[15px] font-medium text-ink">Check your inbox</p>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-2">
          If an account exists for{" "}
          <span className="font-medium text-ink">{email}</span>, a reset link is on its way.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field label="Email" htmlFor="email" error={error}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </Field>
      <Button type="submit" variant="solid" size="lg" block loading={loading}>
        Send reset link
      </Button>
    </form>
  );
}
