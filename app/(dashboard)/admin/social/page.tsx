import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SocialClient from "./social-client";

export default async function SocialPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("email")
    .eq("id", user.id)
    .single();

  if (profile?.email !== "andrewwhitesides7@gmail.com") {
    redirect("/dashboard");
  }

  const { data: posts } = await supabase
    .from("social_posts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return <SocialClient posts={posts || []} />;
}
