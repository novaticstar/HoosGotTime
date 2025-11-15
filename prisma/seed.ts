import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create demo user
  const demoUser = await prisma.user.create({
    data: {
      supabaseId: 'demo-user-123',
      email: 'demo@hoosgottime.com',
      name: 'Demo User',
    },
  });

  console.log(`Created user: ${demoUser.email}`);

  // Create user settings
  await prisma.userSettings.create({
    data: {
      userId: demoUser.id,
      wakeTime: '07:00',
      sleepTime: '23:00',
      travelBuffer: 10,
      breakBuffer: 5,
      maxStudyHours: 8,
      timezone: 'America/New_York',
    },
  });

  console.log('Created user settings');

  // Create meal preferences
  await prisma.mealPreference.createMany({
    data: [
      {
        userId: demoUser.id,
        type: 'BREAKFAST',
        startTime: '08:00',
        endTime: '09:00',
        durationMinutes: 30,
        importance: 8,
      },
      {
        userId: demoUser.id,
        type: 'LUNCH',
        startTime: '12:00',
        endTime: '13:30',
        durationMinutes: 45,
        importance: 9,
      },
      {
        userId: demoUser.id,
        type: 'DINNER',
        startTime: '18:00',
        endTime: '19:30',
        durationMinutes: 45,
        importance: 9,
      },
    ],
  });

  console.log('Created meal preferences');

  // Create courses
  const algorithms = await prisma.course.create({
    data: {
      userId: demoUser.id,
      name: 'Algorithms',
      code: 'CS 4102',
      difficulty: 'hard',
      classMeetings: {
        create: [
          {
            daysOfWeek: 'MWF',
            startTime: '09:00',
            endTime: '10:15',
            building: 'Rice Hall',
          },
        ],
      },
    },
  });

  const machineLearning = await prisma.course.create({
    data: {
      userId: demoUser.id,
      name: 'Machine Learning',
      code: 'CS 4774',
      difficulty: 'hard',
      classMeetings: {
        create: [
          {
            daysOfWeek: 'TR',
            startTime: '14:00',
            endTime: '15:15',
            building: 'Olsson Hall',
          },
        ],
      },
    },
  });

  const operatingSystems = await prisma.course.create({
    data: {
      userId: demoUser.id,
      name: 'Operating Systems',
      code: 'CS 4414',
      difficulty: 'hard',
      classMeetings: {
        create: [
          {
            daysOfWeek: 'MWF',
            startTime: '13:00',
            endTime: '14:15',
            building: 'Thornton Hall',
          },
        ],
      },
    },
  });

  const databases = await prisma.course.create({
    data: {
      userId: demoUser.id,
      name: 'Database Systems',
      code: 'CS 4750',
      difficulty: 'medium',
      classMeetings: {
        create: [
          {
            daysOfWeek: 'TR',
            startTime: '11:00',
            endTime: '12:15',
            building: 'Rice Hall',
          },
        ],
      },
    },
  });

  console.log('Created 4 courses with class meetings');

  // Create tasks
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 59, 999);

  const threeDaysFromNow = new Date(now);
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  threeDaysFromNow.setHours(23, 59, 59, 999);

  const oneWeekFromNow = new Date(now);
  oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
  oneWeekFromNow.setHours(23, 59, 59, 999);

  const twoWeeksFromNow = new Date(now);
  twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
  twoWeeksFromNow.setHours(23, 59, 59, 999);

  await prisma.task.createMany({
    data: [
      // Algorithms course tasks
      {
        userId: demoUser.id,
        courseId: algorithms.id,
        title: 'Problem Set 3: Dynamic Programming',
        description: 'Complete problems 1-5 on dynamic programming algorithms',
        type: 'homework',
        dueAt: threeDaysFromNow,
        estimatedMinutes: 180,
        priority: 8,
        status: 'pending',
        createdFrom: 'manual',
      },
      {
        userId: demoUser.id,
        courseId: algorithms.id,
        title: 'Midterm Exam Preparation',
        description: 'Study for midterm covering sorting, graphs, and DP',
        type: 'exam',
        dueAt: oneWeekFromNow,
        estimatedMinutes: 360,
        priority: 10,
        status: 'pending',
        createdFrom: 'manual',
      },
      {
        userId: demoUser.id,
        courseId: algorithms.id,
        title: 'Read Chapter 6: Graph Algorithms',
        description: 'Read and take notes on graph traversal algorithms',
        type: 'reading',
        dueAt: tomorrow,
        estimatedMinutes: 90,
        priority: 6,
        status: 'pending',
        createdFrom: 'manual',
      },

      // Machine Learning course tasks
      {
        userId: demoUser.id,
        courseId: machineLearning.id,
        title: 'Programming Assignment 2: Neural Networks',
        description: 'Implement backpropagation algorithm from scratch',
        type: 'project',
        dueAt: oneWeekFromNow,
        estimatedMinutes: 480,
        priority: 9,
        status: 'in_progress',
        createdFrom: 'manual',
      },
      {
        userId: demoUser.id,
        courseId: machineLearning.id,
        title: 'Quiz 3: Supervised Learning',
        description: 'Online quiz on decision trees and SVMs',
        type: 'quiz',
        dueAt: threeDaysFromNow,
        estimatedMinutes: 60,
        priority: 7,
        status: 'pending',
        createdFrom: 'manual',
      },

      // Operating Systems course tasks
      {
        userId: demoUser.id,
        courseId: operatingSystems.id,
        title: 'Lab 4: Process Synchronization',
        description: 'Implement producer-consumer using semaphores',
        type: 'homework',
        dueAt: threeDaysFromNow,
        estimatedMinutes: 240,
        priority: 8,
        status: 'pending',
        createdFrom: 'manual',
      },
      {
        userId: demoUser.id,
        courseId: operatingSystems.id,
        title: 'Read Chapter 5: CPU Scheduling',
        description: 'Study different scheduling algorithms',
        type: 'reading',
        dueAt: tomorrow,
        estimatedMinutes: 75,
        priority: 6,
        status: 'pending',
        createdFrom: 'manual',
      },

      // Database Systems course tasks
      {
        userId: demoUser.id,
        courseId: databases.id,
        title: 'SQL Assignment: Complex Queries',
        description: 'Write queries using joins, subqueries, and aggregations',
        type: 'homework',
        dueAt: threeDaysFromNow,
        estimatedMinutes: 120,
        priority: 7,
        status: 'pending',
        createdFrom: 'manual',
      },
      {
        userId: demoUser.id,
        courseId: databases.id,
        title: 'Database Design Project Phase 1',
        description: 'Create ER diagram and schema for final project',
        type: 'project',
        dueAt: oneWeekFromNow,
        estimatedMinutes: 180,
        priority: 8,
        status: 'pending',
        createdFrom: 'manual',
      },

      // Personal tasks
      {
        userId: demoUser.id,
        courseId: null,
        title: 'Grocery Shopping',
        description: 'Buy groceries for the week',
        type: 'life',
        dueAt: tomorrow,
        estimatedMinutes: 60,
        priority: 5,
        status: 'pending',
        createdFrom: 'manual',
      },
      {
        userId: demoUser.id,
        courseId: null,
        title: 'Gym Workout',
        description: 'Cardio and strength training',
        type: 'life',
        dueAt: tomorrow,
        estimatedMinutes: 90,
        priority: 6,
        status: 'pending',
        createdFrom: 'manual',
      },
    ],
  });

  console.log('Created 11 sample tasks');

  // Create sample schedule blocks for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const createTimeBlock = (hour: number, minute: number, date: Date = today) => {
    const block = new Date(date);
    block.setHours(hour, minute, 0, 0);
    return block;
  };

  // Get day of week (0 = Sunday, 1 = Monday, etc.)
  const dayOfWeek = today.getDay();
  const dayMap = ['U', 'M', 'T', 'W', 'R', 'F', 'S'];
  const dayCode = dayMap[dayOfWeek];

  // Create schedule blocks based on day of week
  const scheduleBlocks: any[] = [];

  // Sleep blocks (every day)
  scheduleBlocks.push({
    userId: demoUser.id,
    date: today,
    startAt: createTimeBlock(0, 0),
    endAt: createTimeBlock(7, 0),
    type: 'SLEEP',
    label: 'Sleep',
    confidence: 1.0,
    meta: {},
  });

  scheduleBlocks.push({
    userId: demoUser.id,
    date: today,
    startAt: createTimeBlock(23, 0),
    endAt: createTimeBlock(23, 59),
    type: 'SLEEP',
    label: 'Sleep',
    confidence: 1.0,
    meta: {},
  });

  // Breakfast
  scheduleBlocks.push({
    userId: demoUser.id,
    date: today,
    startAt: createTimeBlock(8, 0),
    endAt: createTimeBlock(8, 30),
    type: 'MEAL',
    label: 'Breakfast',
    confidence: 0.9,
    meta: { mealType: 'BREAKFAST' },
  });

  // Classes based on day of week
  if (dayCode === 'M' || dayCode === 'W' || dayCode === 'F') {
    // Algorithms class
    scheduleBlocks.push({
      userId: demoUser.id,
      courseId: algorithms.id,
      date: today,
      startAt: createTimeBlock(9, 0),
      endAt: createTimeBlock(10, 15),
      type: 'CLASS',
      label: 'Algorithms',
      confidence: 1.0,
      meta: { courseCode: 'CS 4102', building: 'Rice Hall' },
    });

    // Operating Systems class
    scheduleBlocks.push({
      userId: demoUser.id,
      courseId: operatingSystems.id,
      date: today,
      startAt: createTimeBlock(13, 0),
      endAt: createTimeBlock(14, 15),
      type: 'CLASS',
      label: 'Operating Systems',
      confidence: 1.0,
      meta: { courseCode: 'CS 4414', building: 'Thornton Hall' },
    });
  }

  if (dayCode === 'T' || dayCode === 'R') {
    // Database Systems class
    scheduleBlocks.push({
      userId: demoUser.id,
      courseId: databases.id,
      date: today,
      startAt: createTimeBlock(11, 0),
      endAt: createTimeBlock(12, 15),
      type: 'CLASS',
      label: 'Database Systems',
      confidence: 1.0,
      meta: { courseCode: 'CS 4750', building: 'Rice Hall' },
    });

    // Machine Learning class
    scheduleBlocks.push({
      userId: demoUser.id,
      courseId: machineLearning.id,
      date: today,
      startAt: createTimeBlock(14, 0),
      endAt: createTimeBlock(15, 15),
      type: 'CLASS',
      label: 'Machine Learning',
      confidence: 1.0,
      meta: { courseCode: 'CS 4774', building: 'Olsson Hall' },
    });
  }

  // Lunch
  scheduleBlocks.push({
    userId: demoUser.id,
    date: today,
    startAt: createTimeBlock(12, 30),
    endAt: createTimeBlock(13, 15),
    type: 'MEAL',
    label: 'Lunch',
    confidence: 0.9,
    meta: { mealType: 'LUNCH' },
  });

  // Study blocks
  scheduleBlocks.push({
    userId: demoUser.id,
    date: today,
    startAt: createTimeBlock(15, 30),
    endAt: createTimeBlock(17, 0),
    type: 'STUDY',
    label: 'Study: ML Programming Assignment',
    confidence: 0.8,
    meta: { taskType: 'project' },
  });

  // Dinner
  scheduleBlocks.push({
    userId: demoUser.id,
    date: today,
    startAt: createTimeBlock(18, 30),
    endAt: createTimeBlock(19, 15),
    type: 'MEAL',
    label: 'Dinner',
    confidence: 0.9,
    meta: { mealType: 'DINNER' },
  });

  // Evening study
  scheduleBlocks.push({
    userId: demoUser.id,
    date: today,
    startAt: createTimeBlock(20, 0),
    endAt: createTimeBlock(22, 0),
    type: 'STUDY',
    label: 'Study: Algorithms Problem Set',
    confidence: 0.7,
    meta: { taskType: 'homework' },
  });

  await prisma.scheduleBlock.createMany({
    data: scheduleBlocks,
  });

  console.log(`Created ${scheduleBlocks.length} schedule blocks for today`);
  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
