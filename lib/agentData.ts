import { startOfDay, endOfDay } from "date-fns"
import { prisma } from "@/lib/prisma"

export async function getScheduleForDate(userId: string, date: Date) {
  const start = startOfDay(date)
  const end = endOfDay(date)

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

export async function getScheduleForDateRange(userId: string, startDate: Date, endDate: Date) {
  const start = startOfDay(startDate)
  const end = endOfDay(endDate)

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

export async function getEatingStats(userId: string, date: Date) {
  const start = startOfDay(date)
  const end = endOfDay(date)

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

export async function getPendingTasks(userId: string) {
  const tasks = await prisma.task.findMany({
    where: {
      userId,
      status: {
        in: ["pending", "in_progress"],
      },
    },
    orderBy: {
      dueAt: "asc",
    },
    include: {
      course: true,
    },
  })

  return tasks
}

export async function getAtRiskTasks(userId: string) {
  const now = new Date()

  const tasks = await prisma.task.findMany({
    where: {
      userId,
      status: {
        in: ["pending", "in_progress"],
      },
      dueAt: {
        gte: now,
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
  const atRiskTasks = tasks.filter((task) => {
    const daysUntilDue =
      (task.dueAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    const needsMoreThan2Hours = task.estimatedMinutes > 120
    return daysUntilDue < 4 && needsMoreThan2Hours
  })

  // Update atRisk flag in database
  await Promise.all(
    atRiskTasks.map((task) =>
      prisma.task.update({
        where: { id: task.id },
        data: { atRisk: true },
      })
    )
  )

  return atRiskTasks
}

export async function getUserCoursesWithMeetings(userId: string) {
  const courses = await prisma.course.findMany({
    where: {
      userId,
    },
    include: {
      meetings: true,
    },
    orderBy: {
      code: "asc",
    },
  })

  return courses
}
