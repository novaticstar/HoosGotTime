"use client"

import { FormEvent, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { getSupabaseBrowserClient } from "@/utils/supabase/client"

const modes = [
  { key: "sign-in", label: "Sign in" },
  { key: "sign-up", label: "Create account" },
] as const

type Mode = (typeof modes)[number]["key"]

export function AuthForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectPath = useMemo(() => searchParams?.get("redirectedFrom") ?? "/app/tasks", [searchParams])

  const [mode, setMode] = useState<Mode>("sign-in")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [status, setStatus] = useState<{ type: "error" | "info"; message: string } | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus(null)
    setLoading(true)

    try {
      const supabase = getSupabaseBrowserClient()

      if (mode === "sign-in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.replace(redirectPath)
        router.refresh()
        return
      }

      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error

      if (!data.session) {
        setStatus({ type: "info", message: "Check your inbox to confirm your account, then sign back in." })
      } else {
        router.replace(redirectPath)
        router.refresh()
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong"
      setStatus({ type: "error", message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm rounded-2xl border bg-white p-6 shadow-sm">
      <div className="mb-6 text-center">
        <p className="text-sm font-medium text-brand-600">HoosGotTime</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
          {mode === "sign-in" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "sign-in" ? "Sign in with your Supabase credentials" : "We only need an email + password to get started."}
        </p>
      </div>

      <div className="mb-4 flex rounded-full border bg-slate-50 p-1 text-sm font-semibold">
        {modes.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setMode(key)}
            className={`flex-1 rounded-full px-3 py-2 transition ${
              mode === key ? "bg-slate-900 text-white" : "text-slate-600"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-slate-700">
          Email
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Password
          <input
            type="password"
            autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
            minLength={6}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none"
          />
        </label>

        {status && (
          <div
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
              status.type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {status.type === "error" ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <span>{status.message}</span>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "sign-in" ? "Sign in" : "Create account"}
        </Button>
      </form>
    </div>
  )
}
