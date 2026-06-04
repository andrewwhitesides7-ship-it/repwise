import { createClient } from "@/lib/supabase/server";
import TeamClient from "./team-client";

export default async function TeamPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("role, team_id, full_name")
    .eq("id", user!.id)
    .single();

  let team = null;
  let members: {
    id: string;
    invited_email: string | null;
    invite_accepted: boolean;
    user_id: string | null;
    users: { full_name: string | null; email: string; role: string } | null;
    latestInsight: { title: string } | null;
  }[] = [];

  if (profile?.team_id) {
    const { data: teamData } = await supabase
      .from("teams")
      .select("*")
      .eq("id", profile.team_id)
      .single();

    team = teamData;

    const { data: memberData } = await supabase
      .from("team_members")
      .select("id, invited_email, invite_accepted, user_id")
      .eq("team_id", profile.team_id);

    if (memberData) {
      members = await Promise.all(
        memberData.map(async (m) => {
          let userData = null;
          let latestInsight = null;

          if (m.user_id) {
            const { data: u } = await supabase
              .from("users")
              .select("full_name, email, role")
              .eq("id", m.user_id)
              .single();
            userData = u;

            const { data: insight } = await supabase
              .from("insights")
              .select("title")
              .eq("user_id", m.user_id)
              .order("created_at", { ascending: false })
              .limit(1)
              .single();
            latestInsight = insight;
          }

          return {
            ...m,
            users: userData,
            latestInsight,
          };
        })
      );
    }
  }

  return (
    <TeamClient
      profile={profile}
      team={team}
      members={members}
    />
  );
}

