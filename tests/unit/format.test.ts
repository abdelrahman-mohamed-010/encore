import { describe, expect, it } from "vitest";
import {
  formatCountdown, formatMoney, formatMoneyCompact, initials, pluralize, priceRange,
} from "@/lib/format";

describe("formatMoney", () => {
  it("drops the decimals on a whole amount", () => {
    expect(formatMoney(4500)).toBe("$45");
  });

  it("keeps the decimals when there are cents", () => {
    expect(formatMoney(4550)).toBe("$45.50");
  });

  it("formats zero as free-of-charge zero, not a blank", () => {
    expect(formatMoney(0)).toBe("$0");
  });

  it("honours a different currency", () => {
    expect(formatMoney(1000, "EUR")).toContain("10");
  });
});

describe("formatMoneyCompact", () => {
  it("shortens thousands for axis labels", () => {
    expect(formatMoneyCompact(1_234_500)).toBe("$12.3K");
  });
});

describe("priceRange", () => {
  it("says Free when nothing costs anything", () => {
    expect(priceRange(0, 0)).toBe("Free");
  });

  it("shows a single price when every tier costs the same", () => {
    expect(priceRange(4500, 4500)).toBe("$45");
  });

  it('shows "From" when tiers differ', () => {
    expect(priceRange(4500, 18000)).toBe("From $45");
  });

  it("flags a mixed free/paid event", () => {
    expect(priceRange(0, 12000)).toBe("Free – $120");
  });
});

describe("formatCountdown", () => {
  it("formats minutes and seconds", () => {
    expect(formatCountdown(9 * 60 * 1000 + 5 * 1000)).toBe("9:05");
  });

  it("never shows a negative countdown", () => {
    expect(formatCountdown(-5000)).toBe("0:00");
  });

  it("pads the seconds", () => {
    expect(formatCountdown(60_000)).toBe("1:00");
  });
});

describe("pluralize", () => {
  it("uses the singular for one", () => {
    expect(pluralize(1, "ticket")).toBe("1 ticket");
  });

  it("uses the plural for everything else", () => {
    expect(pluralize(0, "ticket")).toBe("0 tickets");
    expect(pluralize(2, "ticket")).toBe("2 tickets");
  });

  it("accepts an irregular plural", () => {
    expect(pluralize(3, "person", "people")).toBe("3 people");
  });
});

describe("initials", () => {
  it("takes the first letter of the first two words", () => {
    expect(initials("Nour Ibrahim")).toBe("NI");
  });

  it("handles a single name", () => {
    expect(initials("Nour")).toBe("N");
  });

  it("falls back for a missing name", () => {
    expect(initials(null)).toBe("?");
  });
});
