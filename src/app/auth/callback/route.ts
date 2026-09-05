import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Exchanges the OAuth / email-confirmation code for a session cookie, then
 * sends the visitor where they were originally heading.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const errorDescription = searchParams.get("error_description");

  // Only ever redirect to a path on this site.
  const destination = next && next.startsWith("/") && !next.startsWith("//") ? next : "/account/tickets";

  if (errorDescription) {
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(errorDescription)}`,
    );
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { data: authData, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error.message)}`);
  }

  let finalDestination = destination;
  if (!next || next === "/account/tickets") {
    if (authData?.user?.id) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", authData.user.id)
          .maybeSingle();

        if (profile?.role === "admin") {
          finalDestination = "/admin";
        }
      } catch {
        // Fallback to default destination on lookup error
      }
    }
  }

  return NextResponse.redirect(`${origin}${finalDestination}`);
}
