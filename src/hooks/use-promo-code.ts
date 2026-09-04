"use client";

import { useCallback, useState } from "react";
import type { PromoValidation } from "@/lib/types";

type AppliedPromo = { code: string; discountCents: number };

/**
 * Validates a promo code against the server and holds the applied result.
 * The server is the only authority — this never computes a discount locally.
 */
export function usePromoCode(eventId: string) {
  const [applied, setApplied] = useState<AppliedPromo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const apply = useCallback(
    async (code: string, subtotalCents: number) => {
      const trimmed = code.trim();
      if (!trimmed) return false;

      setChecking(true);
      setError(null);

      try {
        const response = await fetch("/api/checkout/promo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId, code: trimmed, subtotalCents }),
        });
        const result = (await response.json()) as PromoValidation & { error?: string };

        if (!response.ok || !result.valid) {
          setApplied(null);
          setError(
            ("message" in result && result.message) || result.error || "That code is not valid.",
          );
          return false;
        }

        setApplied({ code: result.code, discountCents: result.discount_cents });
        return true;
      } catch {
        setError("Could not reach the server. Try again.");
        return false;
      } finally {
        setChecking(false);
      }
    },
    [eventId],
  );

  const clear = useCallback(() => {
    setApplied(null);
    setError(null);
  }, []);

  return { applied, error, checking, apply, clear, discountCents: applied?.discountCents ?? 0 };
}
