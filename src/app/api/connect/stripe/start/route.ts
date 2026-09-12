import { env } from "@/env";
import { NextResponse } from "next/server";
import { fail } from "@/lib/api";
import { requireOrgRoleJson, requireUserJson } from "@/lib/api-guards";
import { isStripeConnectConfigured } from "@/lib/payments/stripe";

/**
 * Kicks off Stripe Connect OAuth so an organizer can link their own Stripe
 * account. The organizer id is carried in `state` and verified on the way back.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const organizerId = url.searchParams.get("organizer");
  if (!organizerId) return fail("Missing organizer.", 400);

  if (!isStripeConnectConfigured()) {
    return fail(
      "Stripe Connect is not configured on this deployment. Set STRIPE_SECRET_KEY and STRIPE_CONNECT_CLIENT_ID.",
      501,
    );
  }

  const auth = await requireUserJson();
  if (auth.response) return auth.response;
  const { supabase, user } = auth.data;

  const allowed = await requireOrgRoleJson(
    supabase,
    organizerId,
    user.id,
    "admin",
    "You do not have permission to connect payments for this organizer.",
  );
  if (allowed.response) return allowed.response;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? url.origin;
  const authorize = new URL("https://connect.stripe.com/oauth/authorize");
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("client_id", env.STRIPE_CONNECT_CLIENT_ID!);
  authorize.searchParams.set("scope", "read_write");
  authorize.searchParams.set("redirect_uri", `${siteUrl}/api/connect/stripe/callback`);
  authorize.searchParams.set("state", `${organizerId}:${user.id}`);
  authorize.searchParams.set("stripe_user[email]", user.email ?? "");

  return NextResponse.redirect(authorize.toString());
}
