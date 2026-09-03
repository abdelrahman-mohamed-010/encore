import { describe, expect, it } from "vitest";
import { parseTicketPayload, ticketPayload } from "@/lib/qr";

const CODE = "H4K2M9PQ3XYZ";
const SECRET = "3f1c8a52-9b7e-4d2a-8f61-2c4b7d8e9a10";

describe("ticket QR payload", () => {
  it("round-trips a code and its secret", () => {
    const parsed = parseTicketPayload(ticketPayload(CODE, SECRET));
    expect(parsed).toEqual({ ticketCode: CODE, qrSecret: SECRET });
  });

  it("uppercases the ticket code so scanning is case-insensitive", () => {
    expect(parseTicketPayload(`TZK1:${CODE.toLowerCase()}:${SECRET}`)?.ticketCode).toBe(CODE);
  });

  it("tolerates surrounding whitespace from a scanner", () => {
    expect(parseTicketPayload(`  TZK1:${CODE}:${SECRET}\n`)?.ticketCode).toBe(CODE);
  });

  it("rejects a payload with the wrong prefix", () => {
    expect(parseTicketPayload(`OTHER:${CODE}:${SECRET}`)).toBeNull();
  });

  it("rejects a bare ticket code with no secret", () => {
    expect(parseTicketPayload(CODE)).toBeNull();
    expect(parseTicketPayload(`TZK1:${CODE}:`)).toBeNull();
  });

  it("rejects an empty or malformed payload", () => {
    expect(parseTicketPayload("")).toBeNull();
    expect(parseTicketPayload("TZK1:")).toBeNull();
    expect(parseTicketPayload("TZK1:a:b:c")).toBeNull();
  });
});
