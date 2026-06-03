import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/upload?error=hubspot_denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/upload?error=hubspot_no_code`);
  }

  const supabase = createClient();

  const { data: connection } = await supabase
    .from("crm_connections")
    .select("code_verifier")
    .eq("user_id", state)
    .eq("provider", "hubspot")
    .single();

  if (!connection?.code_verifier) {
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
        code_verifier: connection.code_verifier,
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok || !tokens.access_token) {
      console.error("HubSpot token error:", tokens);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/upload?error=hubspot_token_failed`);
    }

    await supabase.from("crm_connections").update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      code_verifier: null,
    }).eq("user_id", state).eq("provider", "hubspot");

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/upload?connected=hubspot`);

  } catch (err) {
    console.error("HubSpot callback error:", err);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/upload?error=hubspot_failed`);
  }
}
