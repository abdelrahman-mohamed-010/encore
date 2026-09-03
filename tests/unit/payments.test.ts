import { describe, expect, it } from "vitest";
import { isSandboxCardAccepted, sandboxDecline } from "@/lib/payments/sandbox";

describe("sandbox card handling", () => {
  it("accepts the success test card", () => {
    expect(sandboxDecline("4242 4242 4242 4242")).toBeNull();
    expect(isSandboxCardAccepted("4242424242424242")).toBe(true);
  });

  it("declines the generic decline card with a readable reason", () => {
    expect(sandboxDecline("4000 0000 0000 0002")).toBe("Your card was declined.");
    expect(isSandboxCardAccepted("4000000000000002")).toBe(false);
  });

  it("reports insufficient funds separately", () => {
    expect(sandboxDecline("4000000000009995")).toBe("Your card has insufficient funds.");
  });

  it("ignores spaces and dashes in the number", () => {
    expect(sandboxDecline("4000-0000-0000-0002")).toBe("Your card was declined.");
  });

  it("rejects a number that is too short to be a card", () => {
    expect(isSandboxCardAccepted("4242")).toBe(false);
  });
});
