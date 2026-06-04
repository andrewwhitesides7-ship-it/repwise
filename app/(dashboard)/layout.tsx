import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/sidebar";
import LimitBanner from "@/components/limit-banner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let uploadCount = 0;
  let insightCount = 0;
  let plan = "free";

  if (user) {
    const [{ data: profile }, { count: uploads }, { count: insights }] = await Promise.all([
      supabase.from("users").select("plan").eq("id", user.id).single(),
      supabase.from("uploads").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("insights").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    ]);
    plan = profile?.plan || "free";
    uploadCount = uploads || 0;
    insightCount = insights || 0;
  }

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
     <Sidebar email={user?.email || ""} />
      <div className="flex-1 flex flex-col overflow-hidden md:ml-0">
        <LimitBanner uploadCount={uploadCount} insightCount={insightCount} plan={plan} />
        <main className="flex-1 overflow-y-auto bg-gray-950 md:pt-0 pt-14">
          {children}
        </main>
      </div>
    </div>
  );
}

