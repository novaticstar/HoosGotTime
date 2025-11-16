import { MealType, PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Starting seed...")

  const demoUserId = "demo-user-123"

  // Ensure demo user exists
  const demoUser = await prisma.user.upsert({
    where: { id: demoUserId },
    update: {
      email: "demo@hoosgottime.com",
      name: "Demo User",
      timeZone: "America/New_York",
      supabaseId: demoUserId,
    },
    create: {
      id: demoUserId,
      supabaseId: demoUserId,
      email: "demo@hoosgottime.com",
      name: "Demo User",
      timeZone: "America/New_York",
    },
  })

  console.log(`Upserted user: ${demoUser.email}`)

  await prisma.userSettings.upsert({
    where: { userId: demoUser.id },
    update: {
      wakeTime: "07:00",
      sleepTime: "23:00",
      buildingWalkBufferMinutes: 10,
      commuteBufferMinutes: 15,
      maxStudyMinutesPerDay: 360,
      maxStudyBlockMinutes: 90,
      timeZone: "America/New_York",
      onboardingComplete: true,
    },
    create: {
      userId: demoUser.id,
      wakeTime: "07:00",
      sleepTime: "23:00",
      buildingWalkBufferMinutes: 10,
      commuteBufferMinutes: 15,
      maxStudyMinutesPerDay: 360,
      maxStudyBlockMinutes: 90,
      timeZone: "America/New_York",
      onboardingComplete: true,
    },
  })

  console.log("Upserted user settings")

  await prisma.mealPreference.deleteMany({ where: { userId: demoUser.id } })
  await prisma.mealPreference.createMany({
    data: [
      {
        userId: demoUser.id,
        mealType: MealType.breakfast,
        earliestTime: "07:30",
        latestTime: "09:00",
        typicalDurationMin: 30,
        importance: 3,
      },
      {
        userId: demoUser.id,
        mealType: MealType.lunch,
        earliestTime: "12:00",
        latestTime: "13:30",
        typicalDurationMin: 45,
        importance: 3,
      },
      {
        userId: demoUser.id,
        mealType: MealType.dinner,
        earliestTime: "18:00",
        latestTime: "20:00",
        typicalDurationMin: 60,
        importance: 3,
      },
      {
        userId: demoUser.id,
        mealType: MealType.snack,
        earliestTime: "15:00",
        latestTime: "16:00",
        typicalDurationMin: 15,
        importance: 1,
      },
    ],
  })

  console.log("Seeded meal preferences")

  const createMeetings = (days: number[], start: string, end: string, building: string) =>
    days.map((dayOfWeek) => ({ dayOfWeek, startTime: start, endTime: end, building }))

  const algorithms = await prisma.course.create({
    data: {
      userId: demoUser.id,
      name: "Algorithms",
      code: "CS 4102",
      difficulty: "hard",
      meetings: { create: createMeetings([1, 3, 5], "09:00", "10:15", "Rice Hall") },
    },
  })

  const machineLearning = await prisma.course.create({
    data: {
      userId: demoUser.id,
      name: "Machine Learning",
      code: "CS 4774",
      difficulty: "hard",
      meetings: { create: createMeetings([2, 4], "14:00", "15:15", "Olsson Hall") },
    },
  })

  const operatingSystems = await prisma.course.create({
    data: {
      userId: demoUser.id,
      name: "Operating Systems",
      code: "CS 4414",
      difficulty: "hard",
      meetings: { create: createMeetings([1, 3, 5], "13:00", "14:15", "Thornton Hall") },
    },
  })

  const databases = await prisma.course.create({
    data: {
      userId: demoUser.id,
      name: "Database Systems",
      code: "CS 4750",
      difficulty: "medium",
      meetings: { create: createMeetings([2, 4], "11:00", "12:15", "Rice Hall") },
    },
  })

  console.log("Seeded courses and meetings")

  const now = new Date()
  const future = (days: number) => {
    const date = new Date(now)
    date.setDate(date.getDate() + days)
    date.setHours(23, 59, 59, 999)
    return date
  }

  await prisma.task.createMany({
    data: [
      {
        userId: demoUser.id,
        courseId: algorithms.id,
        title: "Problem Set 3: Dynamic Programming",
        description: "Complete problems 1-5 on dynamic programming algorithms",
        type: "homework",
        dueAt: future(3),
        estimatedMinutes: 180,
        priority: 8,
        status: "pending",
        createdFrom: "manual",
      },
      {
        userId: demoUser.id,
        courseId: algorithms.id,
        title: "Midterm Exam Preparation",
        description: "Study for midterm covering sorting, graphs, and DP",
        type: "exam",
        dueAt: future(7),
        estimatedMinutes: 360,
        priority: 10,
        status: "pending",
        createdFrom: "manual",
      },
      {
        userId: demoUser.id,
        courseId: algorithms.id,
        title: "Read Chapter 6: Graph Algorithms",
        description: "Read and take notes on graph traversal algorithms",
        type: "reading",
        dueAt: future(1),
        estimatedMinutes: 90,
        priority: 6,
        status: "pending",
        createdFrom: "manual",
      },
      {
        userId: demoUser.id,
        courseId: machineLearning.id,
        title: "Programming Assignment 2: Neural Networks",
        description: "Implement backpropagation algorithm from scratch",
        type: "project",
        dueAt: future(7),
        estimatedMinutes: 480,
        priority: 9,
        status: "in_progress",
        createdFrom: "manual",
      },
      {
        userId: demoUser.id,
        courseId: machineLearning.id,
        title: "Quiz 3: Supervised Learning",
        description: "Online quiz on decision trees and SVMs",
        type: "quiz",
        dueAt: future(3),
        estimatedMinutes: 60,
        priority: 7,
        status: "pending",
        createdFrom: "manual",
      },
      {
        userId: demoUser.id,
        courseId: operatingSystems.id,
        title: "Lab 4: Process Synchronization",
        description: "Implement producer-consumer using semaphores",
        type: "homework",
        dueAt: future(3),
        estimatedMinutes: 240,
        priority: 8,
        status: "pending",
        createdFrom: "manual",
      },
      {
        userId: demoUser.id,
        courseId: operatingSystems.id,
        title: "Read Chapter 5: CPU Scheduling",
        description: "Study different scheduling algorithms",
        type: "reading",
        dueAt: future(1),
        estimatedMinutes: 75,
        priority: 6,
        status: "pending",
        createdFrom: "manual",
      },
      {
        userId: demoUser.id,
        courseId: databases.id,
        title: "SQL Assignment: Complex Queries",
        description: "Write queries using joins, subqueries, and aggregations",
        type: "homework",
        dueAt: future(3),
        estimatedMinutes: 120,
        priority: 7,
        status: "pending",
        createdFrom: "manual",
      },
      {
        userId: demoUser.id,
        courseId: databases.id,
        title: "Database Design Project Phase 1",
        description: "Create ER diagram and schema for final project",
        type: "project",
        dueAt: future(7),
        estimatedMinutes: 180,
        priority: 8,
        status: "pending",
        createdFrom: "manual",
      },
      {
        userId: demoUser.id,
        title: "Grocery Shopping",
        description: "Buy groceries for the week",
        type: "life",
        dueAt: future(1),
        estimatedMinutes: 60,
        priority: 5,
        status: "pending",
        createdFrom: "manual",
      },
      {
        userId: demoUser.id,
        title: "Gym Workout",
        description: "Cardio and strength training",
        type: "life",
        dueAt: future(1),
        estimatedMinutes: 90,
        priority: 6,
        status: "pending",
        createdFrom: "manual",
      },
    ],
  })

  console.log("Seeded tasks")

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const slot = (hour: number, minute: number) => {
    const dt = new Date(today)
    dt.setHours(hour, minute, 0, 0)
    return dt
  }

  const scheduleBlocks = [
    {
      userId: demoUser.id,
      date: today,
      startAt: slot(0, 0),
      endAt: slot(7, 0),
      type: "sleep" as const,
      label: "Sleep",
      confidence: 1,
      meta: {},
    },
    {
      userId: demoUser.id,
      date: today,
      startAt: slot(23, 0),
      endAt: slot(23, 59),
      type: "sleep" as const,
      label: "Sleep",
      confidence: 1,
      meta: {},
    },
    {
      userId: demoUser.id,
      date: today,
      startAt: slot(8, 0),
      endAt: slot(8, 30),
      type: "meal" as const,
      label: "Breakfast",
      confidence: 0.9,
      meta: { mealType: "breakfast" },
    },
    {
      userId: demoUser.id,
      courseId: algorithms.id,
      date: today,
      startAt: slot(9, 0),
      endAt: slot(10, 15),
      type: "class" as const,
      label: "Algorithms",
      confidence: 1,
      meta: { courseCode: "CS 4102", building: "Rice Hall" },
    },
    {
      userId: demoUser.id,
      courseId: operatingSystems.id,
      date: today,
      startAt: slot(13, 0),
      endAt: slot(14, 15),
      type: "class" as const,
      label: "Operating Systems",
      confidence: 1,
      meta: { courseCode: "CS 4414", building: "Thornton Hall" },
    },
    {
      userId: demoUser.id,
      date: today,
      startAt: slot(12, 30),
      endAt: slot(13, 15),
      type: "meal" as const,
      label: "Lunch",
      confidence: 0.9,
      meta: { mealType: "lunch" },
    },
    {
      userId: demoUser.id,
      date: today,
      startAt: slot(15, 30),
      endAt: slot(17, 0),
      type: "study" as const,
      label: "Study: ML Programming Assignment",
      confidence: 0.8,
      meta: { taskType: "project" },
    },
    {
      userId: demoUser.id,
      date: today,
      startAt: slot(18, 30),
      endAt: slot(19, 15),
      type: "meal" as const,
      label: "Dinner",
      confidence: 0.9,
      meta: { mealType: "dinner" },
    },
    {
      userId: demoUser.id,
      date: today,
      startAt: slot(20, 0),
      endAt: slot(22, 0),
      type: "study" as const,
      label: "Study: Algorithms Problem Set",
      confidence: 0.7,
      meta: { taskType: "homework" },
    },
  ]

  await prisma.scheduleBlock.deleteMany({ where: { userId: demoUser.id, date: today } })
  await prisma.scheduleBlock.createMany({ data: scheduleBlocks })

  console.log(`Seeded ${scheduleBlocks.length} schedule blocks`)
  console.log("Seed completed successfully!")
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
