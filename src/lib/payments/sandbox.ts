import { randomUUID } from "node:crypto";
import type { PaymentProvider } from "./types";

/**
 * Simulated rail used when an organizer has not connected Stripe (and for
 * free orders). It mirrors the real lifecycle — intent, confirmation, refund —
 * so the checkout UI and the database transitions are exercised identically.
 *
 * Test cards, matched on the digits the buyer types:
 *   4242 4242 4242 4242 → succeeds
 *   4000 0000 0000 0002 → declined
 *   4000 0000 0000 9995 → insufficient funds
 */
const DECLINE_CODES: Record<string, string> = {
  "4000000000000002": "Your card was declined.",
  "4000000000009995": "Your card has insufficient funds.",
  "4000000000000069": "Your card has expired.",
};

export function sandboxDecline(cardNumber: string): string | null {
  const digits = cardNumber.replace(/\D/g, "");
  return DECLINE_CODES[digits] ?? null;
}

export function isSandboxCardAccepted(cardNumber: string) {
  const digits = cardNumber.replace(/\D/g, "");
  return digits.length >= 12 && digits.length <= 19 && !DECLINE_CODES[digits];
}

export const sandboxProvider: PaymentProvider = {
  id: "sandbox",

  async createIntent({ order }) {
    return {
      reference: `sbx_${order.id.replace(/-/g, "").slice(0, 16)}_${randomUUID().slice(0, 8)}`,
      requiresClientConfirmation: false,
    };
  },

  async getStatus() {
    // The sandbox settles inside the confirm route, so anything that reaches
    // here has already been captured.
    return "succeeded";
  },

  async refund({ order, amountCents }) {
    return { refundId: `sbxre_${order.id.slice(0, 8)}_${amountCents}` };
  },
};
