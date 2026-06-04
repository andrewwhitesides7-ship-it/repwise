import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import MessagesClient from "./messages-client";

export default async function TeamMessagesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role, team_id, full_name")
    .eq("id", user.id)
    .single();

  if (!profile?.team_id) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <div className="text-5xl mb-4">💬</div>
        <h2 className="text-white font-bold text-xl mb-2">No team yet</h2>
        <p className="text-gray-400 text-sm mb-6">Create a team first to send messages to your reps.</p>
        <Link href="/team" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl text-sm transition">
          Go to Team
        </Link>
      </div>
    );
  }

  const { data: messages } = await supabase
    .from("team_messages")
    .select("*, users!sender_id(full_name, email)")
    .eq("team_id", profile.team_id)
    .order("created_at", { ascending: false });

  const { data: teamMembers } = await supabase
    .from("users")
    .select("id, full_name, email")
    .eq("team_id", profile.team_id);

  return (
    <MessagesClient
      messages={messages || []}
      isManager={profile.role === "manager"}
      currentUserId={user.id}
      teamMembers={teamMembers || []}
    />
  );
}
