import { NextRequest, NextResponse } from "next/server"
import { buildSchedule } from "@/lib/scheduler"
import { requireUser } from "@/lib/auth"
import { ensureUserProfile } from "@/lib/user"

export async function POST(req: NextRequest) {
  const { horizonDays = 7 } = await req.json().catch(() => ({ horizonDays: 7 }))
  const { id: userId, email } = await requireUser()
  await ensureUserProfile(userId, email)

  const scheduleResult = await buildSchedule({ userId, horizonDays })

  return NextResponse.json({
    success: true,
    blocksCreated: scheduleResult.blocksCreated,
    missedMeals: scheduleResult.missedMeals,
    atRiskTasks: scheduleResult.atRiskTasks,
    horizonDays,
  })
}