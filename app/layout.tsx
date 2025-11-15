import type { Metadata } from "next"
import type { ReactNode } from "react"
import { Inter } from "next/font/google"
import "@/styles/globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "HoosGotTime",
  description:
    "AI scheduling agent for UVA students that blends deterministic planning with Claude 3.5 coaching.",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-[hsl(var(--background))] text-[hsl(var(--foreground))]`}>
        {children}
      </body>
    </html>
  )
}