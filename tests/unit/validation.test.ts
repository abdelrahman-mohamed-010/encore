import { describe, expect, it } from "vitest";
import { signInSchema, signUpSchema, resetPasswordSchema } from "@/lib/validation/auth";
import { organizerSchema, profileSchema } from "@/lib/validation/organizer";
import { eventSchema, promoSchema, ticketTypeSchema } from "@/lib/validation/event";
import { buyerSchema, sandboxCardSchema } from "@/lib/validation/checkout";
import { slugify } from "@/lib/validation/common";

const iso = (offsetDays: number) => {
  const d = new Date(Date.now() + offsetDays * 86_400_000);
  return d.toISOString().slice(0, 16);
};

describe("auth schemas", () => {
  it("normalises the email to lowercase", () => {
    const parsed = signInSchema.parse({ email: "  Nour@Example.COM ", password: "x" });
    expect(parsed.email).toBe("nour@example.com");
  });

  it("rejects a malformed email", () => {
    expect(signInSchema.safeParse({ email: "not-an-email", password: "x" }).success).toBe(false);
  });

  it("requires 8 characters of password on sign-up", () => {
    const short = signUpSchema.safeParse({ fullName: "Nour I", email: "a@b.co", password: "short" });
    expect(short.success).toBe(false);
    expect(short.error?.issues[0].message).toContain("8 characters");
  });

  it("requires the two new passwords to match", () => {
    const mismatch = resetPasswordSchema.safeParse({ password: "abcd1234", confirm: "abcd12345" });
    expect(mismatch.success).toBe(false);
    expect(mismatch.error?.issues[0].path).toEqual(["confirm"]);
  });
});

describe("organizer schemas", () => {
  it("accepts a clean slug and rejects a dirty one", () => {
    expect(organizerSchema.safeParse({ name: "Cairo Live", slug: "cairo-live" }).success).toBe(true);
    expect(organizerSchema.safeParse({ name: "Cairo Live", slug: "Cairo Live!" }).success).toBe(false);
  });

  it("slugify produces a valid slug from arbitrary text", () => {
    expect(slugify("  Cairo Live Nation!! ")).toBe("cairo-live-nation");
    expect(organizerSchema.safeParse({ name: "x y", slug: slugify("Nile Arts / Collective") }).success).toBe(true);
  });

  it("allows an empty optional profile field", () => {
    expect(profileSchema.safeParse({ fullName: "", phone: "", bio: "", avatarUrl: "" }).success).toBe(true);
  });

  it("rejects a non-URL avatar", () => {
    expect(profileSchema.safeParse({ avatarUrl: "not a url" }).success).toBe(false);
  });
});

describe("event schema", () => {
  const base = {
    title: "Cairokee Live",
    isOnline: false,
    venueId: "venue-1",
    startsAt: iso(10),
    endsAt: iso(11),
    tags: "rock, live, rock",
  };

  it("accepts a well-formed event and de-duplicates tags", () => {
    const parsed = eventSchema.parse(base);
    expect(parsed.tags).toEqual(["rock", "live"]);
  });

  it("rejects an end time before the start", () => {
    const result = eventSchema.safeParse({ ...base, endsAt: iso(9) });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["endsAt"]);
  });

  it("requires a venue for a physical event", () => {
    const result = eventSchema.safeParse({ ...base, venueId: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["venueId"]);
  });

  it("requires a joining link for an online event", () => {
    const result = eventSchema.safeParse({ ...base, isOnline: true, venueId: "", onlineUrl: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["onlineUrl"]);
  });

  it("accepts an online event that has a link", () => {
    expect(
      eventSchema.safeParse({ ...base, isOnline: true, venueId: "", onlineUrl: "https://meet.example" })
        .success,
    ).toBe(true);
  });
});

describe("ticket type schema", () => {
  const base = {
    name: "General Admission",
    price: "45.00",
    quantityTotal: "200",
    minPerOrder: "1",
    maxPerOrder: "8",
    isHidden: false,
  };

  it("accepts a valid tier", () => {
    expect(ticketTypeSchema.safeParse(base).success).toBe(true);
  });

  it("rejects a max below the min", () => {
    const result = ticketTypeSchema.safeParse({ ...base, minPerOrder: "5", maxPerOrder: "2" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["maxPerOrder"]);
  });

  it("rejects a non-numeric price", () => {
    expect(ticketTypeSchema.safeParse({ ...base, price: "free" }).success).toBe(false);
  });

  it("accepts a free tier", () => {
    expect(ticketTypeSchema.safeParse({ ...base, price: "0" }).success).toBe(true);
  });
});

describe("promo schema", () => {
  const base = { code: "earlybird", discountType: "percentage" as const, value: "20", minOrder: "0" };

  it("upper-cases the code", () => {
    expect(promoSchema.parse(base).code).toBe("EARLYBIRD");
  });

  it("rejects a percentage above 100", () => {
    const result = promoSchema.safeParse({ ...base, value: "150" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["value"]);
  });

  it("allows a fixed discount above 100", () => {
    expect(promoSchema.safeParse({ ...base, discountType: "fixed", value: "150" }).success).toBe(true);
  });

  it("rejects a code with spaces", () => {
    expect(promoSchema.safeParse({ ...base, code: "early bird" }).success).toBe(false);
  });
});

describe("checkout schemas", () => {
  it("accepts a buyer and lowercases their email", () => {
    const parsed = buyerSchema.parse({
      buyerName: "Nour Ibrahim",
      buyerEmail: "NOUR@Example.com",
      buyerPhone: "",
      promoCode: "",
    });
    expect(parsed.buyerEmail).toBe("nour@example.com");
  });

  it("rejects a one-character name", () => {
    expect(buyerSchema.safeParse({ buyerName: "N", buyerEmail: "a@b.co" }).success).toBe(false);
  });

  it("strips spaces and dashes from a card number", () => {
    const parsed = sandboxCardSchema.parse({
      cardNumber: "4242 4242-4242 4242",
      expiry: "12 / 30",
      cvc: "123",
    });
    expect(parsed.cardNumber).toBe("4242424242424242");
  });

  it("rejects a card that is too short", () => {
    expect(sandboxCardSchema.safeParse({ cardNumber: "4242", expiry: "12/30", cvc: "123" }).success).toBe(false);
  });
});
