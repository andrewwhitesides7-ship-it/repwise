"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function dismissInsight(id: string) {
  const supabase = createClient();
  await supabase
    .from("insights")
    .update({ is_dismissed: true })
    .eq("id", id);
  revalidatePath("/dashboard");
}
