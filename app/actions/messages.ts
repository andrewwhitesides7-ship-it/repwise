"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function sendTeamMessage(
  message: string,
  messageType: "announcement" | "coaching" | "alert" | "celebration"
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("users")
    .select("team_id, role")
    .eq("id", user.id)
    .single();

  if (!profile?.team_id) throw new Error("No team found");
  if (profile.role !== "manager") throw new Error("Only managers can send messages");

  await supabase.from("team_messages").insert({
    team_id: profile.team_id,
    sender_id: user.id,
    message: message.trim(),
    message_type: messageType,
    read_by: [user.id],
  });

  revalidatePath("/team/messages");
}

export async function markMessageRead(messageId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: msg } = await supabase
    .from("team_messages")
    .select("read_by")
    .eq("id", messageId)
    .single();

  if (!msg) return;

  const readBy = msg.read_by || [];
  if (!readBy.includes(user.id)) {
    await supabase
      .from("team_messages")
      .update({ read_by: [...readBy, user.id] })
      .eq("id", messageId);
  }

  revalidatePath("/team/messages");
}

export async function deleteMessage(messageId: string) {
  const supabase = createClient();
  await supabase.from("team_messages").delete().eq("id", messageId);
  revalidatePath("/team/messages");
}
