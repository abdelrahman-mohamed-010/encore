import { describe, expect, it } from "vitest";
import { generateSeats, rowLabel, sectionCode, type SectionSpec } from "@/lib/seat-layout";

const spec = (name: string, rows: number, seatsPerRow: number): SectionSpec => ({
  name,
  color: "#8b5cf6",
  rows,
  seatsPerRow,
  priceCents: 1000,
});

describe("rowLabel", () => {
  it("counts A..Z then carries into two letters", () => {
    expect(rowLabel(0)).toBe("A");
    expect(rowLabel(25)).toBe("Z");
    expect(rowLabel(26)).toBe("AA");
    expect(rowLabel(27)).toBe("AB");
    expect(rowLabel(51)).toBe("AZ");
    expect(rowLabel(52)).toBe("BA");
  });
});

describe("sectionCode", () => {
  it("takes the first three letters", () => {
    expect(sectionCode("Orchestra", 0)).toBe("ORC");
    expect(sectionCode("Front Stalls", 0)).toBe("FRO");
  });

  it("falls back when a name carries no letters", () => {
    expect(sectionCode("!!!", 2)).toBe("S3");
  });
});

describe("generateSeats", () => {
  it("reproduces the coordinates the seeded opera house already uses", () => {
    // Three tiers of ten rows by sixteen seats: the layout in the database,
    // which the renderer is known to draw correctly.
    const built = generateSeats([
      spec("Orchestra", 10, 16),
      spec("Mezzanine", 10, 16),
      spec("Balcony", 10, 16),
    ]);

    const all = built.flatMap((section) => section.seats);
    expect(all).toHaveLength(480);

    const xs = all.map((seat) => seat.posX);
    expect(Math.min(...xs)).toBeCloseTo(0.0313, 4);
    expect(Math.max(...xs)).toBeCloseTo(0.9688, 4);

    const orchestra = built[0].seats.map((seat) => seat.posY);
    expect(Math.min(...orchestra)).toBeCloseTo(0.0167, 4);
    expect(Math.max(...orchestra)).toBeCloseTo(0.3167, 4);

    const balcony = built[2].seats.map((seat) => seat.posY);
    expect(Math.min(...balcony)).toBeCloseTo(0.6833, 4);
    expect(Math.max(...balcony)).toBeCloseTo(0.9833, 4);
  });

  it("numbers rows across the whole venue so sections stack front to back", () => {
    const built = generateSeats([spec("Front", 2, 4), spec("Rear", 2, 4)]);
    expect(built[0].seats.map((s) => s.rowLabel)).toEqual([
      "A", "A", "A", "A", "B", "B", "B", "B",
    ]);
    expect(built[1].seats.map((s) => s.rowLabel)).toEqual([
      "C", "C", "C", "C", "D", "D", "D", "D",
    ]);
  });

  it("centres rows of different lengths on each other", () => {
    const built = generateSeats([spec("Front", 1, 2), spec("Rear", 1, 4)]);
    const front = built[0].seats.map((seat) => seat.posX);
    const rear = built[1].seats.map((seat) => seat.posX);

    const centre = (xs: number[]) => (Math.min(...xs) + Math.max(...xs)) / 2;
    expect(centre(front)).toBeCloseTo(0.5, 4);
    expect(centre(rear)).toBeCloseTo(0.5, 4);
  });

  it("numbers seats from one within each row", () => {
    const built = generateSeats([spec("Only", 1, 3)]);
    expect(built[0].seats.map((seat) => seat.seatNumber)).toEqual(["1", "2", "3"]);
  });

  it("returns nothing when no section has any rows", () => {
    expect(generateSeats([spec("Empty", 0, 10)])).toEqual([]);
  });
});
