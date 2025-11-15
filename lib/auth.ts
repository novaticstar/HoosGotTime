import { getSupabaseServerClient } from "@/utils/supabase/server"

export async function requireUser() {
  const supabase = getSupabaseServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error("Unauthorized: No active session")
  }

  const user = session.user

  return {
    id: user.id,
    email: user.email ?? "",
  }
}
