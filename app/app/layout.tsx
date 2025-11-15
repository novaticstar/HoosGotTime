import Link from "next/link"
import type { ReactNode } from "react"
import { SignOutButton } from "@/components/auth/SignOutButton"
import { requireUser } from "@/lib/auth"
import { ensureUserProfile } from "@/lib/user"

const links = [
  { href: "/app/setup", label: "Setup" },
  { href: "/app/courses", label: "Courses" },
  { href: "/app/tasks", label: "Tasks" },
  { href: "/app/schedule", label: "Schedule" },
]

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser()
  await ensureUserProfile(user.id, user.email)

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center justify-between gap-6">
            <Link href="/" className="font-semibold tracking-tight text-brand-700">
              HoosGotTime
            </Link>
            <nav className="flex gap-4 text-sm font-medium text-slate-600">
              {links.map((link) => (
                <Link key={link.href} href={link.href} className="hover:text-brand-600">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center justify-end gap-3">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {user.email ?? "Signed in"}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  )
}