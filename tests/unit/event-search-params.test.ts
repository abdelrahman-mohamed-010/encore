import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildSearchEventsArgs, dateWindow, single } from "@/lib/event-search-params";

describe("single", () => {
  it("takes the first value when a param repeats", () => {
    expect(single({ q: ["a", "b"] }, "q")).toBe("a");
  });

  it("passes a lone value through and reports a missing one", () => {
    expect(single({ q: "a" }, "q")).toBe("a");
    expect(single({}, "q")).toBeUndefined();
  });
});

describe("dateWindow", () => {
  // A Wednesday, so "weekend" has to move forward to Friday rather than
  // landing on the current day or reaching backwards.
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 14, 10, 30));
  });
  afterEach(() => vi.useRealTimers());

  it("returns nothing without a `when`", () => {
    expect(dateWindow()).toEqual({});
    expect(dateWindow("whenever")).toEqual({});
  });

  it("ends today at midnight tonight", () => {
    const { from, to } = dateWindow("today");
    expect(new Date(from!).getTime()).toBe(new Date(2026, 0, 14, 10, 30).getTime());
    expect(new Date(to!).getTime()).toBe(new Date(2026, 0, 15).getTime());
  });

  it("runs the weekend Friday to Monday", () => {
    const { from, to } = dateWindow("weekend");
    expect(new Date(from!).getDay()).toBe(5);
    expect(new Date(to!).getDay()).toBe(1);
    expect(new Date(to!).getTime() - new Date(from!).getTime()).toBe(3 * 24 * 60 * 60 * 1000);
  });

  it("starts the weekend today when today is Friday", () => {
    vi.setSystemTime(new Date(2026, 0, 16, 9, 0));
    const { from } = dateWindow("weekend");
    expect(new Date(from!).getDay()).toBe(5);
    expect(new Date(from!).getDate()).toBe(16);
  });

  it("spans seven days for a week and thirty for a month", () => {
    const week = dateWindow("week");
    expect(new Date(week.to!).getTime()).toBe(new Date(2026, 0, 21).getTime());

    const month = dateWindow("month");
    expect(new Date(month.to!).getTime()).toBe(new Date(2026, 1, 13).getTime());
  });
});

describe("buildSearchEventsArgs", () => {
  it("defaults sort to soonest and leaves absent filters undefined", () => {
    const args = buildSearchEventsArgs({}, 12, 0);
    expect(args.p_sort).toBe("soonest");
    expect(args.p_limit).toBe(12);
    expect(args.p_offset).toBe(0);
    expect(args.p_query).toBeUndefined();
    expect(args.p_category_slug).toBeUndefined();
  });

  it("reads the boolean chips as the string \"1\"", () => {
    expect(buildSearchEventsArgs({ free: "1", featured: "1" }, 12, 0)).toMatchObject({
      p_free_only: true,
      p_featured_only: true,
    });
    expect(buildSearchEventsArgs({ free: "0" }, 12, 0).p_free_only).toBe(false);
  });

  it("carries the query, category, city and organizer through", () => {
    const args = buildSearchEventsArgs(
      { q: "jazz", category: "music", city: "Cairo", organizer: "encore", sort: "price" },
      24,
      24,
    );
    expect(args).toMatchObject({
      p_query: "jazz",
      p_category_slug: "music",
      p_city: "Cairo",
      p_organizer_slug: "encore",
      p_sort: "price",
      p_limit: 24,
      p_offset: 24,
    });
  });
});
