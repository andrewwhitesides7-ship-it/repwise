import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.PIPEDRIVE_CLIENT_ID!;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/pipedrive/callback`;

  const url = new URL("https://oauth.pipedrive.com/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);

  return NextResponse.redirect(url.toString());
}
