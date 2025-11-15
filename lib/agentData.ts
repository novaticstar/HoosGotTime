import { startOfDay, endOfDay } from "date-fns"
import { prisma } from "@/lib/prisma"

export async function getScheduleForDate(userId: string, date: string) {
  const start = startOfDay(new Date(date))
  const end = endOfDay(new Date(date))

  const blocks = await prisma.scheduleBlock.findMany({
    where: {
      userId,
      startAt: {
        gte: start,
        lte: end,
      },
    },
    orderBy: {
      startAt: "asc",
    },
    include: {
      task: true,
    },
  })

  return blocks
}

export async function getEatingStats(userId: string, date: string) {
  const start = startOfDay(new Date(date))
  const end = endOfDay(new Date(date))

  const mealBlocks = await prisma.scheduleBlock.findMany({
    where: {
      userId,
      type: "meal",
      startAt: {
        gte: start,
        lte: end,
      },
    },
    orderBy: {
      startAt: "asc",
    },
  })

  const mealPreferences = await prisma.mealPreference.findMany({
    where: {
      userId,
    },
  })

  return {
    scheduledMeals: mealBlocks.length,
    totalPreferences: mealPreferences.length,
    mealBlocks,
  }
}

export async function getAtRiskTasks(userId: string, date: string) {
  const targetDate = new Date(date)

  const tasks = await prisma.task.findMany({
    where: {
      userId,
      status: {
        in: ["pending", "in_progress"],
      },
      dueAt: {
        gte: targetDate,
      },
    },
    orderBy: {
      dueAt: "asc",
    },
    include: {
      course: true,
    },
    take: 20,
  })

  // Mark tasks as at risk if they're due soon and have high estimated time
  return tasks.filter((task) => {
    const daysUntilDue =
      (task.dueAt.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24)
    const needsMoreThan2Hours = task.estimatedMinutes > 120
    return daysUntilDue < 3 && needsMoreThan2Hours
  })
}
