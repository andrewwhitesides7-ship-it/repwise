"use server";

import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { revalidatePath } from "next/cache";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function createTeam(formData: FormData) {
  const name = formData.get("name") as string;
  if (!name?.trim()) throw new Error("Team name is required");

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: team, error } = await supabase
    .from("teams")
    .insert({ name: name.trim(), owner_id: user.id })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await supabase
    .from("users")
    .update({ role: "manager", team_id: team.id })
    .eq("id", user.id);

  revalidatePath("/team");
}

export async function inviteRep(formData: FormData) {
  const email = formData.get("email") as string;
  if (!email?.trim()) throw new Error("Email is required");

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("users")
    .select("team_id, full_name")
    .eq("id", user.id)
    .single();

  if (!profile?.team_id) throw new Error("You need a team first");

  const { data: team } = await supabase
    .from("teams")
    .select("name")
    .eq("id", profile.team_id)
    .single();

  const inviteToken = crypto.randomUUID();

  await supabase.from("team_members").insert({
    team_id: profile.team_id,
    invited_email: email.trim(),
    invite_token: inviteToken,
    invite_accepted: false,
  });

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/signup?invite=${inviteToken}&email=${encodeURIComponent(email.trim())}`;

  await resend.emails.send({
    from: "RepWise <onboarding@resend.dev>",
    to: email.trim(),
    subject: `${profile.full_name || "Your manager"} invited you to join RepWise`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #fff; background: #111; padding: 20px; border-radius: 12px; text-align: center;">
          <span style="color: #3b82f6;">Rep</span>Wise
        </h2>
        <p style="color: #374151; font-size: 16px; margin-top: 24px;">
          <strong>${profile.full_name || "Your manager"}</strong> has invited you to join <strong>${team?.name || "their team"}</strong> on RepWise.
        </p>
        <p style="color: #6b7280; font-size: 14px;">
          RepWise is a sales intelligence platform that analyzes your activity and tells you exactly where you are losing deals.
        </p>
        <a href="${inviteUrl}" style="display: inline-block; margin-top: 24px; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
          Accept Invite
        </a>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 32px;">
          If you did not expect this email you can safely ignore it.
        </p>
      </div>
    `,
  });

  revalidatePath("/team");
}

export async function removeRep(memberId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase.from("team_members").delete().eq("id", memberId);
  revalidatePath("/team");
}
