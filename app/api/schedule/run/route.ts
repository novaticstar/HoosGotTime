import { NextRequest, NextResponse } from "next/server"
import { buildSchedule, saveScheduleBlocks } from "@/lib/scheduler"
import { requireUser } from "@/lib/auth"
import { ensureUserProfile } from "@/lib/user"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const { horizonDays = 7 } = await req.json().catch(() => ({ horizonDays: 7 }))
  const supabaseUserId = await requireUser()
  const userProfile = await ensureUserProfile(supabaseUserId, supabaseUserId)

  const user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUserId }
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  // Build the schedule
  const scheduleBlocks = await buildSchedule(user.id, horizonDays)

  // Save to database
  await saveScheduleBlocks(user.id, scheduleBlocks)

  return NextResponse.json({
    success: true,
    blocksCreated: scheduleBlocks.length,
    horizonDays
  })
}