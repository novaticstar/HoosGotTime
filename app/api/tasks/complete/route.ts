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

  const user = await requireUser()
  await ensureUserProfile(user.id, user.email)

  await prisma.taskTimeLog.create({
    data: {
      taskId,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      durationMinutes: durationMinutes ?? Math.max(15, Math.round((new Date(endAt).getTime() - new Date(startAt).getTime()) / 60000)),
      estimateFeedback: feedback ?? null,
    },
  })

  if (markComplete) {
    await prisma.task.update({
      where: { id: taskId },
      data: { status: "completed", completedAt: new Date(endAt) },
    })
  }

  await updateMultiplierForTask(taskId)

  return NextResponse.json({ success: true })
}