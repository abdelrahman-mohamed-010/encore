/**
 * Order arithmetic, shared by the checkout preview and the unit tests.
 *
 * This mirrors `create_order_from_reservation` in the database exactly — same
 * order of operations, same rounding. The database remains authoritative (it is
 * what the buyer is actually charged); this exists so the UI can show the right
 * number before submitting, without the constants drifting apart.
 */

export type FeeSettings = {
  /** Percentage of the discounted subtotal, e.g. 5 for 5%. */
  percentCents: number;
  /** Flat amount added on top, in cents. */
  fixedCents: number;
};

export type OrderTotals = {
  subtotalCents: number;
  discountCents: number;
  feeCents: number;
  totalCents: number;
};

/**
 * The platform fee. Free orders (nothing left to pay after the discount) carry
 * no fee at all — matching the `if (v_subtotal - v_discount) > 0` branch in SQL.
 */
export function platformFee(
  subtotalCents: number,
  discountCents: number,
  settings: FeeSettings,
): number {
  const payable = subtotalCents - discountCents;
  if (payable <= 0) return 0;
  return Math.floor((payable * settings.percentCents) / 100) + settings.fixedCents;
}

/** A promo's discount, clamped to the subtotal so an order can never go negative. */
export function promoDiscount(
  subtotalCents: number,
  promo: { type: "percentage" | "fixed"; value: number },
): number {
  const raw =
    promo.type === "percentage"
      ? Math.floor((subtotalCents * promo.value) / 100)
      : Math.round(promo.value);
  return Math.min(Math.max(raw, 0), Math.max(subtotalCents, 0));
}

export function orderTotals(
  lines: { unitPriceCents: number; quantity: number }[],
  discountCents: number,
  settings: FeeSettings,
): OrderTotals {
  const subtotalCents = lines.reduce((sum, line) => sum + line.unitPriceCents * line.quantity, 0);
  const clampedDiscount = Math.min(Math.max(discountCents, 0), subtotalCents);
  const feeCents = platformFee(subtotalCents, clampedDiscount, settings);

  return {
    subtotalCents,
    discountCents: clampedDiscount,
    feeCents,
    totalCents: Math.max(0, subtotalCents - clampedDiscount + feeCents),
  };
}

/**
 * How a quantity stepper moves for one ticket tier.
 *
 * Stepping up from zero jumps straight to the tier's minimum; stepping down
 * into the gap below the minimum clears the tier rather than leaving an
 * un-purchasable quantity. The result is always within [0, ceiling].
 */
export function stepQuantity(
  current: number,
  delta: number,
  tier: { minPerOrder: number; maxPerOrder: number; available: number },
): number {
  const ceiling = Math.max(0, Math.min(tier.maxPerOrder, tier.available));
  let next = current + delta;

  if (delta > 0 && current === 0 && tier.minPerOrder > 1) next = tier.minPerOrder;
  if (delta < 0 && next > 0 && next < tier.minPerOrder) next = 0;

  return Math.max(0, Math.min(next, ceiling));
}
