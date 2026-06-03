import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/upload?error=hubspot_denied`);
  }

  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/upload?error=hubspot_no_code`);
  }

  const cookieStore = cookies();
  const codeVerifier = cookieStore.get("hubspot_code_verifier")?.value;

  if (!codeVerifier) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/upload?error=hubspot_no_verifier`);
  }

  try {
    const tokenResponse = await fetch("https://api.hubapi.com/oauth/v1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.HUBSPOT_CLIENT_ID!,
        client_secret: process.env.HUBSPOT_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/hubspot/callback`,
        code,
        code_verifier: codeVerifier,
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok || !tokens.access_token) {
      console.error("HubSpot token error:", tokens);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/upload?error=hubspot_token_failed`);
    }

    const supabase = createClient();
    const userId = state;

    await supabase.from("crm_connections").upsert({
      user_id: userId,
      provider: "hubspot",
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    });

    const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/upload?connected=hubspot`);
    response.cookies.delete("hubspot_code_verifier");
    return response;

  } catch (err) {
    console.error("HubSpot callback error:", err);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/upload?error=hubspot_failed`);
  }
}
