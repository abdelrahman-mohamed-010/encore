import { describe, expect, it } from "vitest";
import { buildSeatPlan, seatInDirection, SEAT_PITCH, type PlanSeat } from "@/lib/seat-plan";

/** A seat at normalised coordinates; the rest of the row is irrelevant here. */
function seat(id: string, x: number, y: number): PlanSeat {
  return {
    id,
    x,
    y,
    status: "available",
    priceCents: 1000,
    sectionId: "s1",
    sectionName: "Stalls",
    color: "#8b5cf6",
    rowLabel: "A",
    seatNumber: id,
  };
}

/** Three rows of four, on the 0..1 grid a seeded venue produces. */
function grid() {
  const seats: PlanSeat[] = [];
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      seats.push(seat(`${row}-${col}`, 0.1 + col * 0.2, 0.1 + row * 0.3));
    }
  }
  return seats;
}

describe("buildSeatPlan", () => {
  it("lays neighbouring seats out one pitch apart", () => {
    const { points } = buildSeatPlan(grid());
    const [first, second] = points;
    expect(second.left - first.left).toBeCloseTo(SEAT_PITCH, 5);
  });

  it("keeps rows a pitch apart regardless of the axis' own scale", () => {
    // Rows are 0.3 apart and columns 0.2, but both are one step in their axis,
    // so the drawn plan must not stretch vertically.
    const { points } = buildSeatPlan(grid());
    const rowGap = points[4].top - points[0].top;
    expect(rowGap).toBeCloseTo(SEAT_PITCH, 5);
  });

  it("preserves an aisle as a real gap rather than closing it up", () => {
    // A double-width gap between seat 2 and 3 must stay double-width.
    const seats = [seat("1", 0.1, 0.5), seat("2", 0.2, 0.5), seat("3", 0.4, 0.5)];
    const { points } = buildSeatPlan(seats);
    expect(points[1].left - points[0].left).toBeCloseTo(SEAT_PITCH, 5);
    expect(points[2].left - points[1].left).toBeCloseTo(SEAT_PITCH * 2, 5);
  });

  it("survives a layout with a single row and a single column", () => {
    const plan = buildSeatPlan([seat("only", 0.5, 0.5)]);
    expect(plan.points).toHaveLength(1);
    expect(Number.isFinite(plan.width)).toBe(true);
    expect(Number.isFinite(plan.height)).toBe(true);
  });

  it("handles rows of different lengths without stretching the plan", () => {
    // A 12-seat row and a 14-seat row interleave into sub-seat gaps if the raw
    // coordinates are pooled, which would blow the plan several times too wide.
    const seats: PlanSeat[] = [];
    for (const [row, width] of [["A", 12], ["B", 14]] as const) {
      for (let i = 0; i < width; i += 1) {
        const s = seat(`${row}${i}`, (i + 0.5) / width, row === "A" ? 0.25 : 0.75);
        seats.push({ ...s, rowLabel: row });
      }
    }

    const { points, width } = buildSeatPlan(seats);
    const rowB = points.filter((point) => point.rowLabel === "B");

    // Neighbours in the wider row sit one pitch apart — to within the 4-decimal
    // rounding the coordinates are stored at, which is worth ~0.04% here.
    expect(rowB[1].left - rowB[0].left).toBeCloseTo(SEAT_PITCH, 1);
    // ...and the plan stays about as wide as its longest row, not a multiple of it.
    expect(width).toBeLessThan(SEAT_PITCH * 18);
  });

  it("returns an empty plan for no seats", () => {
    expect(buildSeatPlan([])).toEqual({ width: 0, height: 0, points: [] });
  });
});

describe("seatInDirection", () => {
  const { points } = buildSeatPlan(grid());
  const at = (id: string) => points.find((point) => point.id === id)!;

  it("moves along the row before leaving it", () => {
    expect(seatInDirection(at("0-1"), points, "right")?.id).toBe("0-2");
    expect(seatInDirection(at("0-1"), points, "left")?.id).toBe("0-0");
  });

  it("moves between rows, holding its column", () => {
    expect(seatInDirection(at("0-2"), points, "down")?.id).toBe("1-2");
    expect(seatInDirection(at("1-2"), points, "up")?.id).toBe("0-2");
  });

  it("stops at the edge of the plan", () => {
    expect(seatInDirection(at("0-3"), points, "right")).toBeNull();
    expect(seatInDirection(at("0-0"), points, "up")).toBeNull();
  });

  it("still finds a neighbour when the rows do not line up", () => {
    // A curved row: no seat is directly below, so the nearest one wins.
    const curved = [seat("a", 0.2, 0.2), seat("b", 0.24, 0.5), seat("c", 0.8, 0.5)];
    const plan = buildSeatPlan(curved);
    const from = plan.points.find((point) => point.id === "a")!;
    expect(seatInDirection(from, plan.points, "down")?.id).toBe("b");
  });
});
