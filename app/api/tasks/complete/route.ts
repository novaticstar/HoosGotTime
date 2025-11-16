import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import { ensureUserProfile } from "@/lib/user"
import { updateMultiplierForTask } from "@/lib/multipliers"

export async function POST(req: NextRequest) {
  const { taskId, startAt, endAt, durationMinutes, feedback, markComplete } = await req.json()

  if (!taskId || !startAt || !endAt) {
    return NextResponse.json({ error: "taskId, startAt, endAt are required" }, { status: 400 })
  }

  const { id: supabaseUserId, email } = await requireUser()
  await ensureUserProfile(supabaseUserId, email)

  const calculatedDuration = durationMinutes ?? Math.max(15, Math.round((new Date(endAt).getTime() - new Date(startAt).getTime()) / 60000))

  // Create time log
  await prisma.taskTimeLog.create({
    data: {
      taskId,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      durationMinutes: calculatedDuration,
      estimateFeedback: feedback ?? null,
    },
  })

  // Get task details for multiplier update
  const task = await prisma.task.findUnique({
    where: { id: taskId },
  })

  if (task) {
    // Update multiplier based on actual vs estimated time
    await updateMultiplierForTask(taskId)
  }

  // Mark task as complete if requested
  if (markComplete) {
    await prisma.task.update({
      where: { id: taskId },
      data: { status: "completed", completedAt: new Date(endAt) },
    })
  }

  return NextResponse.json({ success: true })
}