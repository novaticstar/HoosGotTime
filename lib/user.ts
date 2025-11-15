import { prisma } from "@/lib/prisma"

const DEFAULT_SETTINGS = {
  wakeTime: "07:30",
  sleepTime: "23:30",
  buildingWalkBufferMinutes: 10,
  commuteBufferMinutes: 20,
  maxStudyMinutesPerDay: 360,
  maxStudyBlockMinutes: 90,
  timeZone: "America/New_York",
  onboardingComplete: false,
}

type MealSeed = {
  mealType: "breakfast" | "lunch" | "dinner" | "snack"
  earliestTime: string
  latestTime: string
  typicalDurationMin: number
  importance: number
}

const DEFAULT_MEALS: MealSeed[] = [
  { mealType: "breakfast", earliestTime: "07:30", latestTime: "09:00", typicalDurationMin: 30, importance: 3 },
  { mealType: "lunch", earliestTime: "12:00", latestTime: "13:30", typicalDurationMin: 45, importance: 3 },
  { mealType: "dinner", earliestTime: "18:00", latestTime: "20:00", typicalDurationMin: 60, importance: 3 },
  { mealType: "snack", earliestTime: "15:00", latestTime: "16:00", typicalDurationMin: 15, importance: 1 },
]

export async function ensureUserProfile(userId: string, email?: string | null) {
  const user = await prisma.user.upsert({
    where: { id: userId },
    update: email ? { email } : {},
    create: {
      id: userId,
      email: email ?? `${userId}@students.local`,
      name: email?.split("@")[0] ?? "Demo Student",
    },
    include: { settings: true },
  })

  await prisma.userSettings.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      ...DEFAULT_SETTINGS,
    },
  })

  const meals = await prisma.mealPreference.findMany({ where: { userId: user.id } })
  if (meals.length === 0) {
    await prisma.mealPreference.createMany({
      data: DEFAULT_MEALS.map((meal) => ({ ...meal, userId: user.id })),
      skipDuplicates: true,
    })
  }

  return prisma.user.findUnique({
    where: { id: user.id },
    include: {
      settings: true,
      meals: true,
    },
  })
}

export async function getUserProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      settings: true,
      meals: true,
    },
  })
}
