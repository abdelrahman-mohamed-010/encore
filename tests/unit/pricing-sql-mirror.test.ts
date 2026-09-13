import { describe, expect, it } from "vitest";
import { platformFee, orderTotals, type FeeSettings } from "@/lib/pricing";

/**
 * A transcription of create_order_from_reservation's fee arithmetic
 * (supabase/migrations/0006_orders_tickets_rpcs.sql:103-110). The database is
 * authoritative; lib/pricing.ts only exists so the UI can show the number
 * before submitting. These assert the two have not drifted — if this fails,
 * one of the two moved and the buyer is being quoted a price the server will
 * not honour.
 */
function sqlFee(subtotal: number, discount: number, percent: number, fixed: number) {
  if (subtotal - discount > 0) {
    return Math.floor(((subtotal - discount) * percent) / 100.0) + fixed;
  }
  return 0;
}

function sqlTotal(subtotal: number, discount: number, fee: number) {
  return Math.max(0, subtotal - discount + fee);
}

const SETTINGS: FeeSettings = { percentCents: 5, fixedCents: 99 };

describe("pricing mirrors the SQL fee formula", () => {
  const cases: { subtotal: number; discount: number }[] = [
    { subtotal: 0, discount: 0 },
    { subtotal: 1, discount: 0 },
    { subtotal: 100, discount: 0 },
    { subtotal: 4500, discount: 0 },
    { subtotal: 4500, discount: 500 },
    { subtotal: 4500, discount: 4500 },
    { subtotal: 4500, discount: 5000 },
    { subtotal: 999, discount: 1 },
    { subtotal: 123_456, discount: 7_890 },
    { subtotal: 3333, discount: 1111 },
  ];

  it.each(cases)("fee matches for subtotal $subtotal less $discount", ({ subtotal, discount }) => {
    expect(platformFee(subtotal, discount, SETTINGS)).toBe(
      sqlFee(subtotal, discount, SETTINGS.percentCents, SETTINGS.fixedCents),
    );
  });

  it("rounds down the percentage exactly as floor() does", () => {
    // 1999 * 5 / 100 = 99.95 — SQL floors to 99, so a round() here would drift.
    expect(platformFee(1999, 0, { percentCents: 5, fixedCents: 0 })).toBe(99);
    expect(platformFee(1980, 0, { percentCents: 5, fixedCents: 0 })).toBe(99);
  });

  it("charges no fee once a discount clears the subtotal", () => {
    expect(platformFee(4500, 4500, SETTINGS)).toBe(0);
    expect(platformFee(4500, 9000, SETTINGS)).toBe(0);
  });

  it("never lets a total go negative", () => {
    const lines = [{ quantity: 1, unitPriceCents: 4500 }];
    const totals = orderTotals(lines, 9000, SETTINGS);
    expect(totals.totalCents).toBe(sqlTotal(4500, 9000, 0));
    expect(totals.totalCents).toBeGreaterThanOrEqual(0);
  });

  it("agrees with the SQL total across the same cases", () => {
    for (const { subtotal, discount } of cases) {
      const lines = [{ quantity: 1, unitPriceCents: subtotal }];
      const fee = sqlFee(subtotal, discount, SETTINGS.percentCents, SETTINGS.fixedCents);
      expect(orderTotals(lines, discount, SETTINGS).totalCents).toBe(
        sqlTotal(subtotal, discount, fee),
      );
    }
  });
});
