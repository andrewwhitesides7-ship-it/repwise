import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.HUBSPOT_CLIENT_ID!;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/hubspot/callback`;
  const scopes = "crm.objects.deals.read crm.objects.contacts.read crm.objects.companies.read";

  const url = new URL("https://app.hubspot.com/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", scopes);

  return NextResponse.redirect(url.toString());
}
