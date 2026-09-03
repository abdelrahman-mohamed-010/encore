import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

/** Parse and validate a JSON body, returning a typed value or a 400 response. */
export async function parseBody<T>(
  request: Request,
  schema: ZodSchema<T>,
): Promise<{ data: T; response?: never } | { data?: never; response: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { response: fail("Expected a JSON body.") };
  }

  try {
    return { data: schema.parse(raw) };
  } catch (error) {
    if (error instanceof ZodError) {
      const first = error.issues[0];
      return { response: fail(first ? `${first.path.join(".")}: ${first.message}` : "Invalid request.") };
    }
    return { response: fail("Invalid request.") };
  }
}

/**
 * Postgres raises with a hint we set in the RPCs (`sold_out`, `seat_taken`,
 * `hold_expired`). Surface those as machine-readable codes so the checkout UI
 * can react rather than just printing the message.
 */
export function rpcErrorCode(message: string): "sold_out" | "seat_taken" | "hold_expired" | null {
  const lowered = message.toLowerCase();
  if (lowered.includes("hold expired") || lowered.includes("no longer active")) return "hold_expired";
  if (lowered.includes("seat") && lowered.includes("no longer available")) return "seat_taken";
  if (lowered.includes("left for") || lowered.includes("sold out")) return "sold_out";
  return null;
}
