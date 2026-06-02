import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.SALESFORCE_CLIENT_ID!;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/salesforce/callback`;

  const url = new URL("https://login.salesforce.com/services/oauth2/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "api refresh_token");

  return NextResponse.redirect(url.toString());
}
