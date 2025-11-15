import { getSupabaseServerClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

/**
 * Server-side authentication helper
 * Ensures user is authenticated and returns user data
 */
export async function requireUser() {
  const supabase = getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  return user;
}
