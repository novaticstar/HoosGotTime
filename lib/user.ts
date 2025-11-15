import { prisma } from './prisma';
import { MealType } from '@prisma/client';

export async function ensureUserProfile(userId: string, email?: string) {
  // Check if user exists in our database
  let user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      settings: true,
      meals: true,
    },
  });

  // Create user if doesn't exist
  if (!user) {
    user = await prisma.user.create({
      data: {
        id: userId,
        email: email || '',
      },
      include: {
        settings: true,
        meals: true,
      },
    });
  } else if (email && user.email !== email) {
    // Update email if it has changed
    user = await prisma.user.update({
      where: { id: userId },
      data: { email },
      include: {
        settings: true,
        meals: true,
      },
    });
  }

  // Create default settings if don't exist
  if (!user.settings) {
    await prisma.userSettings.create({
      data: {
        userId: userId,
        wakeTime: '08:00',
        sleepTime: '23:00',
        buildingWalkBufferMinutes: 10,
        commuteBufferMinutes: 15,
        maxStudyMinutesPerDay: 360,
        maxStudyBlockMinutes: 90,
        timeZone: 'America/New_York',
        onboardingComplete: false,
      },
    });
  }

  // Create default meal preferences if don't exist
  if (user.meals.length === 0) {
    const defaultMeals = [
      {
        userId: userId,
        mealType: MealType.breakfast,
        earliestTime: '07:00',
        latestTime: '09:00',
        typicalDurationMin: 30,
        importance: 2,
      },
      {
        userId: userId,
        mealType: MealType.lunch,
        earliestTime: '11:30',
        latestTime: '13:30',
        typicalDurationMin: 45,
        importance: 3,
      },
      {
        userId: userId,
        mealType: MealType.dinner,
        earliestTime: '17:30',
        latestTime: '19:30',
        typicalDurationMin: 60,
        importance: 3,
      },
      {
        userId: userId,
        mealType: MealType.snack,
        earliestTime: '15:00',
        latestTime: '16:00',
        typicalDurationMin: 15,
        importance: 1,
      },
    ];

    await prisma.mealPreference.createMany({
      data: defaultMeals,
    });
  }

  // Fetch and return updated profile
  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      settings: true,
      meals: true,
    },
  });
}

export async function getUserProfile(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      settings: true,
      meals: true,
    },
  });
import { prisma } from "@/lib/prisma"

export async function ensureUserProfile(userId: string, email: string) {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (existingUser) {
    return existingUser
  }

  return await prisma.user.create({
    data: {
      id: userId,
      email,
    },
  })
}
