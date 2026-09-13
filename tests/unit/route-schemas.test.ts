import { describe, expect, it } from "vitest";
import {
  createOrderSchema,
  profileSchema,
  refundSchema,
  sandboxPaySchema,
  validatePromoSchema,
} from "@/lib/validation";

const UUID = "3f2504e0-4f89-11d3-9a0c-0305e82c3301";

describe("createOrderSchema", () => {
  it("accepts the explicit nulls the checkout posts", () => {
    const parsed = createOrderSchema.parse({
      reservationId: UUID,
      buyerName: "Nour Adel",
      buyerEmail: "Nour@Example.COM",
      buyerPhone: null,
      promoCode: null,
    });
    expect(parsed.buyerPhone).toBeNull();
    expect(parsed.promoCode).toBeNull();
  });

  it("lowercases the email, which the old route-local copy did not", () => {
    const parsed = createOrderSchema.parse({
      reservationId: UUID,
      buyerName: "Nour Adel",
      buyerEmail: "Nour@Example.COM",
      buyerPhone: null,
      promoCode: null,
    });
    expect(parsed.buyerEmail).toBe("nour@example.com");
  });

  it("holds the two-character name floor", () => {
    const bad = createOrderSchema.safeParse({
      reservationId: UUID,
      buyerName: "N",
      buyerEmail: "a@b.co",
      buyerPhone: null,
      promoCode: null,
    });
    expect(bad.success).toBe(false);
  });

  it("rejects a reservation id that is not a uuid", () => {
    const bad = createOrderSchema.safeParse({
      reservationId: "not-a-uuid",
      buyerName: "Nour Adel",
      buyerEmail: "a@b.co",
      buyerPhone: null,
      promoCode: null,
    });
    expect(bad.success).toBe(false);
  });
});

describe("sandboxPaySchema", () => {
  it("normalises a spaced card number to bare digits", () => {
    expect(sandboxPaySchema.parse({ cardNumber: "4242 4242 4242 4242" }).cardNumber).toBe(
      "4242424242424242",
    );
    expect(sandboxPaySchema.parse({ cardNumber: "4242-4242-4242-4242" }).cardNumber).toBe(
      "4242424242424242",
    );
  });

  it("rejects a number that is too short or not digits", () => {
    expect(sandboxPaySchema.safeParse({ cardNumber: "4242" }).success).toBe(false);
    expect(sandboxPaySchema.safeParse({ cardNumber: "abcd efgh ijkl mnop" }).success).toBe(false);
  });
});

describe("validatePromoSchema", () => {
  it("trims the code, which the old route-local copy did not", () => {
    expect(validatePromoSchema.parse({ eventId: UUID, code: "  SAVE10 ", subtotalCents: 100 }).code)
      .toBe("SAVE10");
  });

  it("refuses a negative subtotal", () => {
    expect(
      validatePromoSchema.safeParse({ eventId: UUID, code: "SAVE10", subtotalCents: -1 }).success,
    ).toBe(false);
  });
});

describe("refundSchema", () => {
  it("requires a positive whole amount", () => {
    expect(refundSchema.safeParse({ amountCents: 500 }).success).toBe(true);
    expect(refundSchema.safeParse({ amountCents: 0 }).success).toBe(false);
    expect(refundSchema.safeParse({ amountCents: -500 }).success).toBe(false);
    expect(refundSchema.safeParse({ amountCents: 1.5 }).success).toBe(false);
  });
});

describe("profileSchema", () => {
  it("takes first and last name as real fields", () => {
    const parsed = profileSchema.parse({ firstName: " Nour ", lastName: " Adel " });
    expect(parsed.firstName).toBe("Nour");
    expect(parsed.lastName).toBe("Adel");
  });

  it("allows both to be blank", () => {
    expect(profileSchema.safeParse({ firstName: "", lastName: "" }).success).toBe(true);
  });
});
