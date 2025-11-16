import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { requireUser } from "@/lib/auth"
import { ensureUserProfile } from "@/lib/user"
import { prisma } from "@/lib/prisma"
import { ScheduleBlockType, Prisma } from "@prisma/client"

type ScheduleBlockInput = {
  date: string
  startAt: string
  endAt: string
  type: ScheduleBlockType
  label: string
  courseId?: string
  taskId?: string
  description?: string
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser()
    await ensureUserProfile(user.id, user.email)

    const body = await req.json()
    const block = body as ScheduleBlockInput

    if (!block.label || !block.startAt || !block.endAt || !block.type) {
      return NextResponse.json(
        { error: "Missing required fields: label, startAt, endAt, type" },
        { status: 400 }
      )
    }

    // Create the schedule block
    const created = await prisma.scheduleBlock.create({
      data: {
        userId: user.id,
        date: new Date(block.date || block.startAt),
        startAt: new Date(block.startAt),
        endAt: new Date(block.endAt),
        type: block.type,
        label: block.label,
        courseId: block.courseId || null,
        taskId: block.taskId || null,
      },
      include: {
        task: true,
      },
    })

    // Revalidate schedule page
    revalidatePath("/app/schedule")

    return NextResponse.json({ success: true, block: created })
  } catch (error) {
    console.error("Error creating schedule block:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create schedule block",
      },
      { status: 500 }
    )
  }
}
