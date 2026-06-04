import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminClient from "./admin-client";

export default async function AdminPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("plan, role, email")
    .eq("id", user.id)
    .single();

  if (profile?.email !== "andrewwhitesides7@gmail.com") {
    redirect("/dashboard");
  }

  return <AdminClient />;
}

