import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=The%20confirmation%20link%20is%20invalid%20or%20incomplete.", requestUrl.origin),
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error?.message ?? "Unable to confirm your account.")}`, requestUrl.origin),
    );
  }

  const { error: bootstrapError } = await supabase.rpc("bootstrap_current_user", {
    organisation_name: data.user.user_metadata?.organisation_name ?? null,
    user_full_name: data.user.user_metadata?.full_name ?? null,
  });

  if (bootstrapError) {
    return NextResponse.redirect(
      new URL(
        "/login?error=Email%20confirmed%2C%20but%20workspace%20setup%20failed.%20Apply%20the%20Sprint%201%20auth%20migration%20and%20sign%20in.",
        requestUrl.origin,
      ),
    );
  }

  return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
}
