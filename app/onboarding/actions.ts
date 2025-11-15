'use server';

import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MealType } from '@prisma/client';

type OnboardingData = {
  wakeTime: string;
  sleepTime: string;
  buildingWalkBufferMinutes: number;
  commuteBufferMinutes: number;
  maxStudyMinutesPerDay: number;
  maxStudyBlockMinutes: number;
  timeZone: string;
  meals: {
    breakfast: { earliestTime: string; latestTime: string; typicalDurationMin: number; importance: number };
    lunch: { earliestTime: string; latestTime: string; typicalDurationMin: number; importance: number };
    dinner: { earliestTime: string; latestTime: string; typicalDurationMin: number; importance: number };
    snack: { earliestTime: string; latestTime: string; typicalDurationMin: number; importance: number };
  };
};

export async function completeOnboarding(data: OnboardingData) {
  const user = await requireUser();

  // Ensure user exists in database
  await prisma.user.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email: user.email || '',
      timeZone: data.timeZone,
    },
    update: {
      email: user.email || '',
      timeZone: data.timeZone,
    },
  });

  // Create or update user settings
  await prisma.userSettings.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      wakeTime: data.wakeTime,
      sleepTime: data.sleepTime,
      buildingWalkBufferMinutes: data.buildingWalkBufferMinutes,
      commuteBufferMinutes: data.commuteBufferMinutes,
      maxStudyMinutesPerDay: data.maxStudyMinutesPerDay,
      maxStudyBlockMinutes: data.maxStudyBlockMinutes,
      timeZone: data.timeZone,
      onboardingComplete: true,
    },
    update: {
      wakeTime: data.wakeTime,
      sleepTime: data.sleepTime,
      buildingWalkBufferMinutes: data.buildingWalkBufferMinutes,
      commuteBufferMinutes: data.commuteBufferMinutes,
      maxStudyMinutesPerDay: data.maxStudyMinutesPerDay,
      maxStudyBlockMinutes: data.maxStudyBlockMinutes,
      timeZone: data.timeZone,
      onboardingComplete: true,
    },
  });

  // Delete existing meal preferences and create new ones
  await prisma.mealPreference.deleteMany({
    where: { userId: user.id },
  });

  const mealPreferences = [
    {
      userId: user.id,
      mealType: MealType.breakfast,
      ...data.meals.breakfast,
    },
    {
      userId: user.id,
      mealType: MealType.lunch,
      ...data.meals.lunch,
    },
    {
      userId: user.id,
      mealType: MealType.dinner,
      ...data.meals.dinner,
    },
    {
      userId: user.id,
      mealType: MealType.snack,
      ...data.meals.snack,
    },
  ];

  await prisma.mealPreference.createMany({
    data: mealPreferences,
  });

  return { success: true };
}
