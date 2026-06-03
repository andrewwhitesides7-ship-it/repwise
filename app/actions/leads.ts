"use server";

import { createServiceClient } from "@/lib/supabase/server";

export async function captureEmail(email: string, source: string = "landing") {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("leads")
    .upsert({ email, source }, { onConflict: "email" });
  if (error) throw new Error(error.message);
  return { success: true };
}
