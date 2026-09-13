import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useCountdown } from "@/features/checkout/hooks/use-countdown";
import { useAsyncAction } from "@/hooks/use-async-action";
import { useSeatSelection } from "@/features/events/hooks/use-seat-selection";
import { useTicketSelection } from "@/features/events/hooks/use-ticket-selection";
import type { TicketAvailability } from "@/lib/types";

const tier = (over: Partial<TicketAvailability> = {}): TicketAvailability => ({
  ticket_type_id: "t1",
  name: "General Admission",
  price_cents: 4500,
  currency: "USD",
  available: 100,
  quantity_total: 100,
  min_per_order: 1,
  max_per_order: 8,
  on_sale: true,
  ...over,
});

describe("useCountdown", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("counts down and reports the remaining time", () => {
    const deadline = new Date(Date.now() + 10_000).toISOString();
    const { result } = renderHook(() => useCountdown(deadline));

    expect(result.current.msLeft).toBeGreaterThan(8_000);
    act(() => void vi.advanceTimersByTime(5_000));
    expect(result.current.msLeft).toBeLessThanOrEqual(5_000);
    expect(result.current.expired).toBe(false);
  });

  it("fires onExpire exactly once, even as the timer keeps ticking", () => {
    const onExpire = vi.fn();
    const deadline = new Date(Date.now() + 2_000).toISOString();
    renderHook(() => useCountdown(deadline, onExpire));

    act(() => void vi.advanceTimersByTime(6_000));
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it("never reports a negative remaining time", () => {
    const { result } = renderHook(() => useCountdown(new Date(Date.now() - 5_000).toISOString()));
    expect(result.current.msLeft).toBe(0);
    expect(result.current.expired).toBe(true);
  });
});

describe("useAsyncAction", () => {
  it("captures a thrown message as error state rather than rejecting", async () => {
    const { result } = renderHook(() =>
      useAsyncAction(async () => {
        throw new Error("Sold out");
      }),
    );

    await act(async () => void (await result.current.run()));
    expect(result.current.error).toBe("Sold out");
    expect(result.current.pending).toBe(false);
  });

  it("clears a previous error on the next attempt", async () => {
    let shouldFail = true;
    const { result } = renderHook(() =>
      useAsyncAction(async () => {
        if (shouldFail) throw new Error("nope");
        return "ok";
      }),
    );

    await act(async () => void (await result.current.run()));
    expect(result.current.error).toBe("nope");

    shouldFail = false;
    await act(async () => void (await result.current.run()));
    expect(result.current.error).toBeNull();
  });

  it("ignores a second call while the first is still running", async () => {
    const action = vi.fn(async () => new Promise((resolve) => setTimeout(resolve, 20)));
    const { result } = renderHook(() => useAsyncAction(action));

    await act(async () => {
      void result.current.run();
      void result.current.run();
      await new Promise((resolve) => setTimeout(resolve, 40));
    });

    expect(action).toHaveBeenCalledTimes(1);
  });
});

describe("useTicketSelection", () => {
  it("accumulates quantity and derives the subtotal", () => {
    const tiers = [tier(), tier({ ticket_type_id: "t2", price_cents: 9500 })];
    const { result } = renderHook(() => useTicketSelection(tiers));

    act(() => result.current.step(tiers[0], 1));
    act(() => result.current.step(tiers[0], 1));
    act(() => result.current.step(tiers[1], 1));

    expect(result.current.count).toBe(3);
    expect(result.current.subtotalCents).toBe(4500 * 2 + 9500);
    expect(result.current.lines).toHaveLength(2);
  });

  it("stops at what is actually left", () => {
    const t = tier({ available: 2 });
    const { result } = renderHook(() => useTicketSelection([t]));

    act(() => result.current.step(t, 1));
    act(() => result.current.step(t, 1));
    act(() => result.current.step(t, 1));

    expect(result.current.count).toBe(2);
  });

  it("omits zero-quantity tiers from the payload", () => {
    const tiers = [tier(), tier({ ticket_type_id: "t2" })];
    const { result } = renderHook(() => useTicketSelection(tiers));

    act(() => result.current.step(tiers[0], 1));
    expect(result.current.lines).toEqual([{ ticket_type_id: "t1", quantity: 1 }]);
  });
});

describe("useSeatSelection", () => {
  const seats = [
    { id: "s1", status: "available", price_cents: 22000, ticket_type_id: "t1" },
    { id: "s2", status: "available", price_cents: 15000, ticket_type_id: "t2" },
    { id: "s3", status: "sold", price_cents: 22000, ticket_type_id: "t1" },
  ];
  const priceFor = (seat: { price_cents: number | null }) => seat.price_cents ?? 0;

  it("selects and deselects a seat, tracking the subtotal", () => {
    const { result } = renderHook(() => useSeatSelection(seats, priceFor));

    act(() => void result.current.toggle("s1"));
    expect(result.current.subtotalCents).toBe(22000);

    act(() => void result.current.toggle("s2"));
    expect(result.current.count).toBe(2);
    expect(result.current.subtotalCents).toBe(37000);

    act(() => void result.current.toggle("s1"));
    expect(result.current.count).toBe(1);
  });

  it("refuses a sold seat and explains why", () => {
    const { result } = renderHook(() => useSeatSelection(seats, priceFor));
    let outcome: { ok: boolean; reason?: string } = { ok: true };
    act(() => {
      outcome = result.current.toggle("s3");
    });
    expect(outcome.ok).toBe(false);
    expect(outcome.reason).toContain("taken");
  });

  it("enforces the per-order seat cap", () => {
    const many = Array.from({ length: 10 }, (_, i) => ({
      id: `x${i}`,
      status: "available",
      price_cents: 1000,
      ticket_type_id: "t1",
    }));
    const { result } = renderHook(() => useSeatSelection(many, priceFor, 2));

    act(() => void result.current.toggle("x0"));
    act(() => void result.current.toggle("x1"));

    let outcome: { ok: boolean; reason?: string } = { ok: true };
    act(() => {
      outcome = result.current.toggle("x2");
    });

    expect(result.current.count).toBe(2);
    expect(outcome.ok).toBe(false);
    expect(outcome.reason).toContain("up to 2");
  });
});
