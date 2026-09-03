"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

export function RegisterForm({ next }: { next?: string }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback${
          next ? `?next=${encodeURIComponent(next)}` : ""
        }`,
      },
    });

    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    // When the project requires email confirmation there is no session yet.
    if (!data.session) {
      setLoading(false);
      setAwaitingConfirmation(true);
      return;
    }

    toast.success("Welcome to Tazkarti");
    router.push(next && next.startsWith("/") ? next : "/account/tickets");
    router.refresh();
  }

  if (awaitingConfirmation) {
    return (
      <div className="text-center">
        <span className="mx-auto grid size-11 place-items-center rounded-xl border border-hairline bg-sunken text-ink-2">
          <MailCheck className="size-5" />
        </span>
        <p className="mt-4 text-[15px] font-medium text-ink">Confirm your email</p>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-2">
          We sent a link to <span className="font-medium text-ink">{email}</span>. Open it to
          finish creating your account.
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="mt-5"
          onClick={() => setAwaitingConfirmation(false)}
        >
          Use a different email
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field label="Full name" htmlFor="fullName">
        <Input
          id="fullName"
          name="fullName"
          autoComplete="name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Nour Ibrahim"
        />
      </Field>

      <Field label="Email" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </Field>

      <Field
        label="Password"
        htmlFor="password"
        hint="At least 8 characters."
        error={error}
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          aria-invalid={Boolean(error)}
        />
      </Field>

      <Button type="submit" variant="solid" size="lg" block loading={loading}>
        Create account
      </Button>

      <p className="text-center text-[12px] leading-relaxed text-ink-3">
        By creating an account you agree to our Terms and Privacy Policy.
      </p>
    </form>
  );
}
