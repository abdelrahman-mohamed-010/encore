/**
 * Turning stored seat coordinates into a drawable plan.
 *
 * `venue_seats.pos_x` / `pos_y` are normalised to 0..1 so a layout survives any
 * viewport, which means they carry the venue's shape but not its scale. These
 * helpers recover a pitch from the data itself — the typical gap between
 * neighbouring seats — and lay the plan out on that, so a hand-placed layout
 * renders at its true proportions rather than being forced onto a grid.
 */

export type PlanSeat = {
  id: string;
  x: number;
  y: number;
  status: string;
  priceCents: number;
  sectionId: string;
  sectionName: string;
  color: string;
  rowLabel: string;
  seatNumber: string;
};

/** Drawn seat diameter, and the centre-to-centre distance between two seats. */
export const SEAT_SIZE = 26;
export const SEAT_PITCH = 34;
const PADDING = SEAT_PITCH;

/**
 * The seat pitch along one axis, read off the coordinates themselves.
 *
 * A low percentile rather than the median: aisles and the breaks between tiers
 * are always *wider* than the seat spacing and never narrower, so the median of
 * a row with a couple of aisles lands on the aisle. Taking the outright minimum
 * would be exact but one stray near-coincident pair would collapse the pitch
 * and blow the plan up, so the quartile keeps both ends honest.
 */
const PITCH_PERCENTILE = 0.25;

/** Coordinates are numeric(6,4); matching that stops float noise reading as a gap. */
function distinctSorted(values: number[]) {
  return [...new Set(values.map((value) => Math.round(value * 10_000)))]
    .map((value) => value / 10_000)
    .sort((a, b) => a - b);
}

function gapsIn(values: number[], into: number[] = []) {
  const distinct = distinctSorted(values);
  for (let i = 1; i < distinct.length; i += 1) {
    const gap = distinct[i] - distinct[i - 1];
    if (gap > 0.0001) into.push(gap);
  }
  return into;
}

function percentile(gaps: number[]) {
  if (gaps.length === 0) return 0;
  gaps.sort((a, b) => a - b);
  return gaps[Math.floor(gaps.length * PITCH_PERCENTILE)];
}

/**
 * Seat pitch is the spacing between neighbours *in the same row*, so the gaps
 * are collected per row and only then pooled. Pooling the raw coordinates
 * instead would break any venue whose rows differ in length: a 12-seat row and
 * a 14-seat row interleave into a stream of meaningless sub-seat gaps, and the
 * plan would come out several times too wide.
 */
function pitchAcrossRows(seats: PlanSeat[]) {
  const byRow = new Map<string, number[]>();
  for (const seat of seats) {
    const key = `${seat.sectionId}\u0000${seat.rowLabel}`;
    const row = byRow.get(key);
    if (row) row.push(seat.x);
    else byRow.set(key, [seat.x]);
  }

  const gaps: number[] = [];
  for (const row of byRow.values()) gapsIn(row, gaps);
  return percentile(gaps);
}

/** Rows share a y, so the distinct values *are* the rows. */
function pitchBetweenRows(seats: PlanSeat[]) {
  return percentile(gapsIn(seats.map((seat) => seat.y)));
}

export type SeatPlan = {
  width: number;
  height: number;
  /** Seat centres in plan pixels, ready to position against. */
  points: (PlanSeat & { left: number; top: number })[];
};

export function buildSeatPlan(seats: PlanSeat[]): SeatPlan {
  if (seats.length === 0) return { width: 0, height: 0, points: [] };

  const minX = Math.min(...seats.map((seat) => seat.x));
  const minY = Math.min(...seats.map((seat) => seat.y));

  // A single row or column has no gap to measure; the fallback keeps it drawable.
  const stepX = pitchAcrossRows(seats) || 0.05;
  const stepY = pitchBetweenRows(seats) || 0.05;

  const points = seats.map((seat) => ({
    ...seat,
    left: ((seat.x - minX) / stepX) * SEAT_PITCH + PADDING,
    top: ((seat.y - minY) / stepY) * SEAT_PITCH + PADDING,
  }));

  return {
    width: Math.max(...points.map((p) => p.left)) + PADDING,
    height: Math.max(...points.map((p) => p.top)) + PADDING,
    points,
  };
}

/**
 * The nearest seat in a compass direction, so arrow keys work on a layout that
 * was never a grid. Movement across the axis is penalised, which keeps a
 * left/right press inside its own row wherever the row actually curves.
 */
export function seatInDirection(
  from: { left: number; top: number },
  seats: (PlanSeat & { left: number; top: number })[],
  direction: "up" | "down" | "left" | "right",
) {
  const horizontal = direction === "left" || direction === "right";
  const sign = direction === "left" || direction === "up" ? -1 : 1;

  let best: (PlanSeat & { left: number; top: number }) | null = null;
  let bestCost = Infinity;

  for (const seat of seats) {
    const along = (horizontal ? seat.left - from.left : seat.top - from.top) * sign;
    if (along <= 0.5) continue;

    const across = Math.abs(horizontal ? seat.top - from.top : seat.left - from.left);
    const cost = along + across * 4;
    if (cost < bestCost) {
      bestCost = cost;
      best = seat;
    }
  }

  return best;
}
