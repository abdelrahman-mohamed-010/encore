import { describe, expect, it } from "vitest";
import { rpcErrorCode } from "@/lib/api";

describe("rpcErrorCode", () => {
  it("recognises an expired hold", () => {
    expect(rpcErrorCode("your ticket hold expired, please select your tickets again")).toBe(
      "hold_expired",
    );
    expect(rpcErrorCode("this reservation is no longer active")).toBe("hold_expired");
  });

  it("recognises a seat someone else took", () => {
    expect(rpcErrorCode("one of the selected seats is no longer available")).toBe("seat_taken");
  });

  it("recognises running out of stock", () => {
    expect(rpcErrorCode("only 2 ticket(s) left for Early Bird")).toBe("sold_out");
  });

  it("returns null for an unrelated error", () => {
    expect(rpcErrorCode("connection terminated unexpectedly")).toBeNull();
  });
});
