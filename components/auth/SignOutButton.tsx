"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { LogOut, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { getSupabaseBrowserClient } from "@/utils/supabase/client"

export function SignOutButton() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const handleSignOut = () =>
    startTransition(async () => {
      const supabase = getSupabaseBrowserClient()
      await supabase.auth.signOut()
      router.replace("/auth")
      router.refresh()
    })

  return (
    <Button variant="outline" size="sm" onClick={handleSignOut} disabled={pending} className="gap-1">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
      <span className="hidden sm:inline">Sign out</span>
    </Button>
  )
}
