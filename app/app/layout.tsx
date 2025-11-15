import Link from "next/link"
import type { ReactNode } from "react"
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
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
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
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  )
}