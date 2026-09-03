import { describe, expect, it } from "vitest";
import { orderTotals, platformFee, promoDiscount, stepQuantity } from "@/lib/pricing";

const FEES = { percentCents: 5, fixedCents: 99 };

describe("platformFee", () => {
  it("is a percentage of the discounted subtotal plus a flat amount", () => {
    // 5% of 6000 = 300, + 99 = 399
    expect(platformFee(6000, 0, FEES)).toBe(399);
  });

  it("charges on the amount after the discount, not before", () => {
    // 6000 - 1200 = 4800 payable; floor(4800 * 0.05) = 240; + 99 = 339
    expect(platformFee(6000, 1200, FEES)).toBe(339);
  });

  it("floors the percentage rather than rounding, matching the SQL", () => {
    // 5% of 1999 = 99.95 -> 99
    expect(platformFee(1999, 0, { percentCents: 5, fixedCents: 0 })).toBe(99);
  });

  it("charges nothing on a free order", () => {
    expect(platformFee(0, 0, FEES)).toBe(0);
  });

  it("charges nothing when a discount covers the whole subtotal", () => {
    expect(platformFee(5000, 5000, FEES)).toBe(0);
  });
});

describe("promoDiscount", () => {
  it("takes a percentage off", () => {
    expect(promoDiscount(10000, { type: "percentage", value: 20 })).toBe(2000);
  });

  it("takes a fixed amount off", () => {
    expect(promoDiscount(10000, { type: "fixed", value: 1500 })).toBe(1500);
  });

  it("never discounts more than the subtotal", () => {
    expect(promoDiscount(1000, { type: "fixed", value: 5000 })).toBe(1000);
  });

  it("floors a fractional percentage, matching the SQL", () => {
    // 33% of 1010 = 333.3 -> 333
    expect(promoDiscount(1010, { type: "percentage", value: 33 })).toBe(333);
  });

  it("never returns a negative discount", () => {
    expect(promoDiscount(1000, { type: "fixed", value: -500 })).toBe(0);
  });
});

describe("orderTotals", () => {
  it("computes the full breakdown for a real order", () => {
    const totals = orderTotals(
      [{ unitPriceCents: 2000, quantity: 3 }],
      promoDiscount(6000, { type: "percentage", value: 20 }),
      FEES,
    );

    expect(totals).toEqual({
      subtotalCents: 6000,
      discountCents: 1200,
      feeCents: 339,
      totalCents: 5139,
    });
  });

  it("sums multiple lines", () => {
    const totals = orderTotals(
      [
        { unitPriceCents: 4500, quantity: 2 },
        { unitPriceCents: 9500, quantity: 1 },
      ],
      0,
      FEES,
    );
    expect(totals.subtotalCents).toBe(18500);
    expect(totals.totalCents).toBe(18500 + Math.floor(18500 * 0.05) + 99);
  });

  it("stays at zero for a genuinely free order", () => {
    const totals = orderTotals([{ unitPriceCents: 0, quantity: 2 }], 0, FEES);
    expect(totals).toEqual({
      subtotalCents: 0,
      discountCents: 0,
      feeCents: 0,
      totalCents: 0,
    });
  });

  it("clamps an oversized discount instead of going negative", () => {
    const totals = orderTotals([{ unitPriceCents: 1000, quantity: 1 }], 99999, FEES);
    expect(totals.discountCents).toBe(1000);
    expect(totals.totalCents).toBe(0);
  });
});

describe("stepQuantity", () => {
  const tier = { minPerOrder: 1, maxPerOrder: 6, available: 10 };

  it("steps up and down by one", () => {
    expect(stepQuantity(0, 1, tier)).toBe(1);
    expect(stepQuantity(3, -1, tier)).toBe(2);
  });

  it("never goes below zero", () => {
    expect(stepQuantity(0, -1, tier)).toBe(0);
  });

  it("stops at the per-order maximum", () => {
    expect(stepQuantity(6, 1, tier)).toBe(6);
  });

  it("stops at what is actually left, even below the per-order maximum", () => {
    expect(stepQuantity(2, 1, { ...tier, available: 2 })).toBe(2);
  });

  it("jumps straight to the minimum when a tier sells in pairs", () => {
    expect(stepQuantity(0, 1, { minPerOrder: 2, maxPerOrder: 8, available: 10 })).toBe(2);
  });

  it("clears the tier rather than leaving an un-purchasable quantity", () => {
    expect(stepQuantity(2, -1, { minPerOrder: 2, maxPerOrder: 8, available: 10 })).toBe(0);
  });

  it("returns zero for a sold-out tier", () => {
    expect(stepQuantity(0, 1, { ...tier, available: 0 })).toBe(0);
  });
});
