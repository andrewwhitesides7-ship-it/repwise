import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/upload?error=salesforce_denied`);
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/salesforce/callback`;

  const tokenRes = await fetch("https://login.salesforce.com/services/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.SALESFORCE_CLIENT_ID!,
      client_secret: process.env.SALESFORCE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      code,
    }),
  });

  const tokenData = await tokenRes.json();

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/upload?error=salesforce_token`);
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login`);
  }

  await supabase
    .from("crm_connections")
    .upsert({
      user_id: user.id,
      provider: "salesforce",
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_expires_at: null,
    }, { onConflict: "user_id,provider" });

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/upload?connected=salesforce`);
}
