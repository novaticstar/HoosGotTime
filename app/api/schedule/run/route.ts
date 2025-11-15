import { NextRequest, NextResponse } from "next/server"
import { buildSchedule } from "@/lib/scheduler"
import { requireUser } from "@/lib/auth"
import { ensureUserProfile } from "@/lib/user"

export async function POST(req: NextRequest) {
  const { horizonDays = 7 } = await req.json().catch(() => ({ horizonDays: 7 }))
  const user = await requireUser()
  await ensureUserProfile(user.id, user.email)

  const result = await buildSchedule({ userId: user.id, horizonDays })
  return NextResponse.json(result)
}