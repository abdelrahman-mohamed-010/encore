"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

/**
 * OAuth providers must be enabled in the Supabase dashboard before these work;
 * until then Supabase returns a clear "provider is not enabled" error which we
 * surface as-is rather than failing silently.
 */
const PROVIDERS = [
  {
    id: "google" as const,
    label: "Continue with Google",
    icon: (
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
        <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.4a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.6-5.2 3.6-8.8Z" />
        <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3a7.2 7.2 0 0 1-10.7-3.8H1.4v3.1A12 12 0 0 0 12 24Z" />
        <path fill="#FBBC05" d="M5.4 14.3a7.1 7.1 0 0 1 0-4.6V6.6H1.4a12 12 0 0 0 0 10.8l4-3.1Z" />
        <path fill="#EA4335" d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.5-3.5A12 12 0 0 0 1.4 6.6l4 3.1A7.2 7.2 0 0 1 12 4.8Z" />
      </svg>
    ),
  },
  {
    id: "github" as const,
    label: "Continue with GitHub",
    icon: (
      <svg viewBox="0 0 24 24" className="size-4 fill-ink" aria-hidden>
        <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7 0-.7 0-.7 1.2 0 1.9 1.2 1.9 1.2 1 1.8 2.8 1.3 3.5 1 0-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2 0-.3-.5-1.5.2-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.5.4.9 1.1.9 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3Z" />
      </svg>
    ),
  },
];

export function OAuthButtons({ next }: { next?: string }) {
  const [loading, setLoading] = useState<string | null>(null);

  async function signIn(provider: "google" | "github") {
    setLoading(provider);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback${
      next ? `?next=${encodeURIComponent(next)}` : ""
    }`;

    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
    if (error) {
      setLoading(null);
      toast.error("Could not start sign-in", { description: error.message });
    }
  }

  return (
    <div className="grid gap-2">
      {PROVIDERS.map((provider) => (
        <Button
          key={provider.id}
          variant="outline"
          size="lg"
          block
          loading={loading === provider.id}
          disabled={loading !== null}
          onClick={() => signIn(provider.id)}
        >
          {loading !== provider.id && provider.icon}
          {provider.label}
        </Button>
      ))}
    </div>
  );
}

export function AuthDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="h-px flex-1 bg-hairline-soft" />
      <span className="text-xs text-ink-3">{label}</span>
      <span className="h-px flex-1 bg-hairline-soft" />
    </div>
  );
}
