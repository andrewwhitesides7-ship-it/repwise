import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/lib/emails/welcome";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/dashboard";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tryrepwise.com";

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const { data: existingProfile } = await supabase
        .from("users")
        .select("id")
        .eq("id", data.user.id)
        .single();

      if (!existingProfile) {
        const refCode = searchParams.get("ref") || request.cookies.get("ref_code")?.value || null;

        await supabase.from("users").insert({
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || "",
          plan: "free",
          role: "rep",
          referred_by: refCode,
        });

        if (refCode) {
          const { data: affiliate } = await supabase
            .from("users")
            .select("id, referral_credits")
            .eq("referral_code", refCode)
            .single();

          if (affiliate) {
            await supabase
              .from("users")
              .update({ referral_credits: (affiliate.referral_credits || 0) + 20 })
              .eq("id", affiliate.id);
          }
        }

        await sendWelcomeEmail(
          data.user.email || "",
          data.user.user_metadata?.full_name || data.user.user_metadata?.name || ""
        );

        return NextResponse.redirect(`${appUrl}/onboarding`);
      }

      return NextResponse.redirect(`${appUrl}${next}`);
    }
  }

  return NextResponse.redirect(`${appUrl}/login?error=auth_failed`);
}
