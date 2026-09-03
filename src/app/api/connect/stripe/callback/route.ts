import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/payments/stripe";

/** Exchanges the Connect OAuth code and stores the organizer's account. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") ?? "";
  const [organizerId, stateUserId] = state.split(":");

  const back = (slug: string, query: string) =>
    NextResponse.redirect(`${siteUrl}/dashboard/${slug}/settings/payments?${query}`);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !organizerId || stateUserId !== user.id) {
    return NextResponse.redirect(`${siteUrl}/dashboard?error=connect_state_mismatch`);
  }

  const { data: organizer } = await supabase
    .from("organizers")
    .select("slug")
    .eq("id", organizerId)
    .maybeSingle();
  const slug = organizer?.slug ?? "";

  const denied = url.searchParams.get("error_description");
  if (denied) return back(slug, `error=${encodeURIComponent(denied)}`);
  if (!code) return back(slug, "error=missing_code");

  const stripe = getStripe();
  if (!stripe) return back(slug, "error=stripe_not_configured");

  try {
    const token = await stripe.oauth.token({ grant_type: "authorization_code", code });
    const accountId = token.stripe_user_id!;
    const account = await stripe.accounts.retrieve(accountId);

    // RLS allows this write only for an admin/owner of the organizer.
    const { error } = await supabase.from("payment_accounts").upsert(
      {
        organizer_id: organizerId,
        provider: "stripe",
        stripe_account_id: accountId,
        charges_enabled: account.charges_enabled ?? false,
        payouts_enabled: account.payouts_enabled ?? false,
        details_submitted: account.details_submitted ?? false,
        country: account.country ?? null,
        default_currency: (account.default_currency ?? "usd").toUpperCase(),
        requirements_due: account.requirements?.currently_due ?? [],
        livemode: Boolean(token.livemode),
        connected_at: new Date().toISOString(),
        disconnected_at: null,
      },
      { onConflict: "organizer_id" },
    );

    if (error) return back(slug, `error=${encodeURIComponent(error.message)}`);
    return back(slug, "connected=1");
  } catch (error) {
    return back(slug, `error=${encodeURIComponent((error as Error).message)}`);
  }
}
