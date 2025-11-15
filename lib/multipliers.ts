import { prisma } from "@/lib/prisma"

export async function updateMultiplierForTask(taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { timeLogs: true, course: true },
  })

  if (!task) return

  const actual = task.timeLogs.reduce(
    (sum: number, log: { durationMinutes: number }) => sum + log.durationMinutes,
    0
  )
  const estimated = task.estimatedMinutes

  if (estimated <= 0 || actual <= 0) return

  const ratio = actual / estimated
  if (ratio > 0.8 && ratio < 1.2) return

  const key = {
    userId: task.userId,
    courseId: task.courseId ?? undefined,
    taskType: task.type,
  }

  const existing = await prisma.userMultiplier.findFirst({ where: key })
  const current = existing?.multiplier ?? 1
  const target = Math.min(Math.max(ratio, 0.5), 2)
  const updated = current + 0.2 * (target - current)

  if (existing) {
    await prisma.userMultiplier.update({ where: { id: existing.id }, data: { multiplier: updated } })
  } else {
    await prisma.userMultiplier.create({ data: { ...key, multiplier: updated } })
  }
}