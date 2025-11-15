import { redirect } from "next/navigation"

import { AuthForm } from "@/components/auth/AuthForm"
import { isSupabaseConfigured, getSupabaseServerClient } from "@/utils/supabase/server"

export const dynamic = "force-dynamic"

export default async function AuthPage() {
  const supabaseReady = isSupabaseConfigured()

  if (!supabaseReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="max-w-lg rounded-2xl border bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Supabase not configured</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Provide <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code> and
            <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to enable auth.
            Update your <code>.env.local</code> file (see README) and restart the dev server.
          </p>
        </div>
      </div>
    )
  }

  const supabase = getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/app/tasks")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <AuthForm />
    </div>
  )
}
