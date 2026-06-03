import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

function base64URLEncode(buffer: Buffer) {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function sha256(buffer: string) {
  return crypto.createHash("sha256").update(buffer).digest();
}

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL));

  const codeVerifier = base64URLEncode(crypto.randomBytes(32));
  const codeChallenge = base64URLEncode(Buffer.from(sha256(codeVerifier)));

  await supabase.from("crm_connections").upsert({
    user_id: user.id,
    provider: "hubspot",
    access_token: "pending",
    code_verifier: codeVerifier,
  });

  const url = new URL("https://mcp-na2.hubspot.com/oauth/authorize/user");
  url.searchParams.set("client_id", process.env.HUBSPOT_CLIENT_ID!);
  url.searchParams.set("redirect_uri", `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/hubspot/callback`);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", user.id);

  return NextResponse.redirect(url.toString());
}
