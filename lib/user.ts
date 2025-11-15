import { prisma } from "./prisma";

/**
 * Ensures a user profile exists in the database
 * Creates user and default settings if they don't exist
 */
export async function ensureUserProfile(userId: string, email: string | null | undefined) {
  let user = await prisma.user.findUnique({
    where: { id: userId },
    include: { settings: true },
  });

  if (!user) {
    // Create user with default settings
    user = await prisma.user.create({
      data: {
        id: userId,
        email: email || `user-${userId}@example.com`,
        name: email?.split("@")[0] || `User ${userId.slice(0, 8)}`,
        settings: {
          create: {
            wakeTime: "07:00",
            sleepTime: "23:00",
            buildingWalkBufferMinutes: 10,
            commuteBufferMinutes: 30,
            maxStudyMinutesPerDay: 480,
            maxStudyBlockMinutes: 120,
            timeZone: "America/New_York",
          },
        },
      },
      include: { settings: true },
    });

    // Create default meal preferences
    await prisma.mealPreference.createMany({
      data: [
        {
          userId: user.id,
          mealType: "breakfast",
          earliestTime: "07:00",
          latestTime: "10:00",
          typicalDurationMin: 30,
          importance: 8,
        },
        {
          userId: user.id,
          mealType: "lunch",
          earliestTime: "11:30",
          latestTime: "14:00",
          typicalDurationMin: 45,
          importance: 9,
        },
        {
          userId: user.id,
          mealType: "dinner",
          earliestTime: "17:30",
          latestTime: "20:00",
          typicalDurationMin: 60,
          importance: 9,
        },
      ],
    });
  }

  return user;
}
