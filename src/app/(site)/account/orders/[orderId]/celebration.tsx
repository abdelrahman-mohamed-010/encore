"use client";

import { useEffect } from "react";
import { toast } from "sonner";

/** One-shot confirmation toast after a successful checkout. */
export function OrderCelebration() {
  useEffect(() => {
    toast.success("You're going!", {
      description: "Your tickets are ready — find them under My tickets.",
      duration: 6000,
    });
  }, []);

  return null;
}
