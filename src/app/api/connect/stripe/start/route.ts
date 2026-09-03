import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fail } from "@/lib/api";
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("You must be signed in.", 401);

  // RLS: only an admin/owner of this organizer can read its membership row.
  const { data: membership } = await supabase
    .from("organizer_members")
    .select("role")
    .eq("organizer_id", organizerId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership || !["owner", "admin"].includes(membership.role)) {
    return fail("You do not have permission to connect payments for this organizer.", 403);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? url.origin;
  const authorize = new URL("https://connect.stripe.com/oauth/authorize");
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("client_id", process.env.STRIPE_CONNECT_CLIENT_ID!);
  authorize.searchParams.set("scope", "read_write");
  authorize.searchParams.set("redirect_uri", `${siteUrl}/api/connect/stripe/callback`);
  authorize.searchParams.set("state", `${organizerId}:${user.id}`);
  authorize.searchParams.set("stripe_user[email]", user.email ?? "");

  return NextResponse.redirect(authorize.toString());
}
