import { Prisma } from "@prisma/client"
import {
  addDays,
  addMinutes,
  differenceInMinutes,
  eachDayOfInterval,
  endOfDay,
  isAfter,
  isBefore,
  isSameDay,
  max,
  min,
  set,
  startOfDay,
} from "date-fns"
import { prisma } from "@/lib/prisma"

type ScheduleBlockTypeValue = "class" | "meal" | "study" | "travel" | "sleep" | "event" | "snack"
type TaskTypeValue = "homework" | "exam" | "project" | "reading" | "quiz" | "other" | "life"
type TaskStatusValue = "pending" | "in_progress" | "completed" | "overdue"

type SchedulerTask = {
  id: string
  title: string
  type: TaskTypeValue
  dueAt: Date
  estimatedMinutes: number
  courseId?: string | null
  course?: { id: string; difficulty: keyof typeof DIFFICULTY_BOOST } | null
}

type UserMultiplierRecord = {
  userId: string
  courseId: string | null
  taskType: TaskTypeValue | null
  multiplier: number
}

const SLOT_MINUTES = 30

const BLOCK: Record<"CLASS" | "MEAL" | "STUDY" | "TRAVEL" | "SLEEP" | "EVENT" | "SNACK", ScheduleBlockTypeValue> = {
  CLASS: "class",
  MEAL: "meal",
  STUDY: "study",
  TRAVEL: "travel",
  SLEEP: "sleep",
  EVENT: "event",
  SNACK: "snack",
}

type SlotBlock = {
  type: ScheduleBlockTypeValue
  label?: string
  taskId?: string
  courseId?: string
  confidence?: number
  meta?: Record<string, unknown> | null
}

type DaySlot = {
  start: Date
  end: Date
  isFree: boolean
  block?: SlotBlock
}

type DayGrid = {
  date: Date
  slots: DaySlot[]
  studyMinutesScheduled: number
  missedMeals: { mealType: string; reason: string }[]
}



export type SchedulerOptions = {
  userId: string
  horizonDays?: number
}

export type SchedulerResult = {
  blocksCreated: number
  missedMeals: { mealType: string; date: string; reason: string }[]
  atRiskTasks: string[]
}

const BASE_MINUTES: Record<TaskTypeValue, number> = {
  homework: 120,
  exam: 240,
  project: 300,
  reading: 60,
  quiz: 90,
  other: 90,
  life: 60,
}

const TASK_PRIORITY: Record<TaskTypeValue, number> = {
  exam: 1,
  project: 2,
  homework: 3,
  quiz: 4,
  reading: 5,
  other: 6,
  life: 7,
}

const DIFFICULTY_BOOST = {
  easy: 0.85,
  medium: 1,
  hard: 1.25,
}

export async function buildSchedule({ userId, horizonDays = 7 }: SchedulerOptions): Promise<SchedulerResult> {
  const today = startOfDay(new Date())
  const horizonEnd = endOfDay(addDays(today, horizonDays - 1))

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      settings: true,
      courses: { include: { meetings: true } },
      meals: true,
      tasks: {
  where: { status: { in: ["pending", "in_progress"] satisfies TaskStatusValue[] } },
        include: { course: true },
        orderBy: { dueAt: "asc" },
      },
      multipliers: true,
    },
  })

  if (!user || !user.settings) {
    throw new Error("User or UserSettings not found; run onboarding first")
  }

  const dayGrids = createDayGrids(today, horizonDays)

  blockSleep(dayGrids, user.settings)
  blockClasses(dayGrids, user.settings.buildingWalkBufferMinutes, user.settings.commuteBufferMinutes, user.courses)
  const missedMeals = blockMeals(dayGrids, user.meals)

  const { atRiskTaskIds } = placeStudyBlocks(dayGrids, user, user.multipliers, user.settings.maxStudyBlockMinutes, user.settings.maxStudyMinutesPerDay)

  const blocksData = extractScheduleBlocks(dayGrids, userId)
  const blockPayload = blocksData.map((block) => ({
    ...block,
    meta: block.meta == null ? undefined : JSON.parse(JSON.stringify(block.meta)),
  }))

  const statements: Prisma.PrismaPromise<unknown>[] = [
    prisma.scheduleBlock.deleteMany({
      where: {
        userId,
        date: { gte: today, lte: horizonEnd },
      },
    }),
  prisma.scheduleBlock.createMany({ data: blockPayload }),
    prisma.task.updateMany({ where: { userId, atRisk: true }, data: { atRisk: false } }),
  ]

  if (atRiskTaskIds.length) {
    statements.push(prisma.task.updateMany({ where: { id: { in: atRiskTaskIds } }, data: { atRisk: true } }))
  }

  await prisma.$transaction(statements)

  return {
    blocksCreated: blocksData.length,
    missedMeals: missedMeals.map((meal) => ({ ...meal, date: meal.date.toISOString() })),
    atRiskTasks: atRiskTaskIds,
  }
}

function createDayGrids(start: Date, days: number): DayGrid[] {
  const window = eachDayOfInterval({ start, end: endOfDay(addDays(start, days - 1)) })
  return window.map((date) => {
    const slots: DaySlot[] = []
    let cursor = startOfDay(date)
    const dayEnd = endOfDay(date)

    while (cursor < dayEnd) {
      const next = addMinutes(cursor, SLOT_MINUTES)
      slots.push({ start: cursor, end: next, isFree: true })
      cursor = next
    }

    return {
      date,
      slots,
      studyMinutesScheduled: 0,
      missedMeals: [],
    }
  })
}

function blockSleep(dayGrids: DayGrid[], settings: { wakeTime: string; sleepTime: string }) {
  for (const day of dayGrids) {
    const wake = setTime(day.date, settings.wakeTime)
    const sleep = setTime(day.date, settings.sleepTime)

    if (isBefore(wake, sleep)) {
      blockSlots(day, sleep, wake, { type: BLOCK.SLEEP, label: "Sleep", confidence: 1 })
    } else {
      blockSlots(day, startOfDay(day.date), wake, { type: BLOCK.SLEEP, label: "Sleep", confidence: 1 })
      blockSlots(day, sleep, endOfDay(day.date), { type: BLOCK.SLEEP, label: "Sleep", confidence: 1 })
    }
  }
}

function blockClasses(
  dayGrids: DayGrid[],
  walkBuffer: number,
  commuteBuffer: number,
  courses: Array<{ id: string; name: string; code?: string; difficulty: keyof typeof DIFFICULTY_BOOST; meetings: Array<{ dayOfWeek: number; startTime: string; endTime: string }> }>
) {
  for (const day of dayGrids) {
    const weekday = day.date.getDay()
    const dayMeetings: { start: Date; end: Date; courseId: string; name: string }[] = []

    for (const course of courses) {
      for (const meeting of course.meetings) {
        if (meeting.dayOfWeek !== weekday) continue
        const start = addMinutes(setTime(day.date, meeting.startTime), -walkBuffer)
        const end = addMinutes(setTime(day.date, meeting.endTime), walkBuffer)
        dayMeetings.push({ start, end, courseId: course.id, name: `${course.code ?? course.name}` })
        blockSlots(day, start, end, {
          type: BLOCK.CLASS,
          label: `${course.name}`,
          courseId: course.id,
          confidence: 1,
        })
      }
    }

    if (dayMeetings.length) {
      const firstStart = dayMeetings.reduce((minStart, meet) => (isBefore(meet.start, minStart) ? meet.start : minStart), dayMeetings[0].start)
      const commuteStart = addMinutes(firstStart, -commuteBuffer)
      if (commuteBuffer > 0) {
        blockSlots(day, commuteStart, firstStart, {
          type: BLOCK.TRAVEL,
          label: "Commute",
          confidence: 0.9,
        })
      }
    }
  }
}

function blockMeals(dayGrids: DayGrid[], meals: Array<{ mealType: string; earliestTime: string; latestTime: string; typicalDurationMin: number; importance: number }>) {
  const missed: { date: Date; mealType: string; reason: string }[] = []
  const sortedPreferences = [...meals].sort((a, b) => b.importance - a.importance)

  for (const day of dayGrids) {
    for (const pref of sortedPreferences) {
      const placed = placeFixedBlock(day, pref.earliestTime, pref.latestTime, pref.typicalDurationMin, {
        type: pref.mealType === "snack" ? BLOCK.SNACK : BLOCK.MEAL,
        label: pref.mealType === "snack" ? "Snack" : `${capitalize(pref.mealType)} window`,
        confidence: 0.85,
        meta: { mealType: pref.mealType },
      })

      if (!placed) {
        day.missedMeals.push({ mealType: pref.mealType, reason: "No free slot" })
        missed.push({ date: day.date, mealType: pref.mealType, reason: "No free slot" })
      }
    }
  }

  return missed
}

function placeFixedBlock(day: DayGrid, earliest: string, latest: string, durationMinutes: number, block: SlotBlock) {
  const windowStart = setTime(day.date, earliest)
  const windowEnd = setTime(day.date, latest)
  const neededSlots = Math.max(1, Math.ceil(durationMinutes / SLOT_MINUTES))

  for (let slotIndex = 0; slotIndex < day.slots.length; slotIndex++) {
    const slot = day.slots[slotIndex]
    if (!slot.isFree) continue
    if (isBefore(slot.start, windowStart) || isAfter(slot.end, windowEnd)) continue

    let canPlace = true
    const candidateSlots: DaySlot[] = []
    for (let offset = 0; offset < neededSlots; offset++) {
      const neighbor = day.slots[slotIndex + offset]
      if (!neighbor || !neighbor.isFree || isAfter(neighbor.end, windowEnd)) {
        canPlace = false
        break
      }
      candidateSlots.push(neighbor)
    }

    if (canPlace) {
      for (const candidate of candidateSlots) {
        candidate.isFree = false
        candidate.block = block
      }
      return true
    }
  }

  return false
}

function placeStudyBlocks(
  dayGrids: DayGrid[],
  user: { id: string; tasks: SchedulerTask[] },
  multipliers: UserMultiplierRecord[],
  maxBlockMinutes: number,
  maxDailyMinutes: number
) {
  const now = new Date()
  const multiplierMap = buildMultiplierMap(multipliers)
  const chunkCap = Math.max(SLOT_MINUTES, maxBlockMinutes)
  const taskChunks: Array<{
    taskId: string
    minutes: number
    dueAt: Date
    title: string
    type: TaskTypeValue
    courseId?: string
    priority: number
  }> = []

  for (const task of user.tasks) {
    const estimatedMinutes = estimateTaskMinutes(task, multiplierMap, user.id)
    if (estimatedMinutes <= 0) continue
    const chunkMinutes = Math.min(chunkCap, estimatedMinutes)
    let remaining = estimatedMinutes
    while (remaining > 0) {
      const minutes = Math.min(chunkMinutes, remaining)
      taskChunks.push({
        taskId: task.id,
        minutes,
        dueAt: task.dueAt,
        title: task.title,
        type: task.type,
        courseId: task.courseId ?? undefined,
        priority: TASK_PRIORITY[task.type] ?? 99,
      })
      remaining -= minutes
    }
  }

  taskChunks.sort((a, b) => {
    if (isBefore(a.dueAt, b.dueAt)) return -1
    if (isAfter(a.dueAt, b.dueAt)) return 1
    return a.priority - b.priority
  })

  const scheduledMinutes: Record<string, number> = {}
  const requiredMinutes: Record<string, number> = {}

  for (const chunk of taskChunks) {
    requiredMinutes[chunk.taskId] = (requiredMinutes[chunk.taskId] ?? 0) + chunk.minutes
    let placed = false

    for (const day of dayGrids) {
      if (isAfter(startOfDay(day.date), chunk.dueAt)) break
      if (day.studyMinutesScheduled + chunk.minutes > maxDailyMinutes) continue

      const slots = findContiguousFreeSlots(day, chunk.minutes, now)
      if (!slots) continue

      for (const slot of slots) {
        slot.isFree = false
        slot.block = {
          type: BLOCK.STUDY,
          label: chunk.title,
          taskId: chunk.taskId,
          courseId: chunk.courseId,
          confidence: 0.7,
        }
      }

      day.studyMinutesScheduled += chunk.minutes
      scheduledMinutes[chunk.taskId] = (scheduledMinutes[chunk.taskId] ?? 0) + chunk.minutes
      placed = true
      break
    }

    if (!placed) {
      scheduledMinutes[chunk.taskId] = scheduledMinutes[chunk.taskId] ?? 0
    }
  }

  const atRiskTaskIds = Object.keys(requiredMinutes).filter((taskId) => {
    const required = requiredMinutes[taskId]
    const scheduled = scheduledMinutes[taskId] ?? 0
    return scheduled + SLOT_MINUTES < required // allow tiny slack
  })

  return { atRiskTaskIds }
}

function findContiguousFreeSlots(day: DayGrid, minutesNeeded: number, now: Date) {
  const neededSlots = Math.max(1, Math.ceil(minutesNeeded / SLOT_MINUTES))

  for (let i = 0; i < day.slots.length; i++) {
    const slot = day.slots[i]
    if (!slot.isFree) continue
    if (isSameDay(day.date, now) && isBefore(slot.end, now)) continue

    let ok = true
    const span: DaySlot[] = []
    for (let j = 0; j < neededSlots; j++) {
      const neighbor = day.slots[i + j]
      if (!neighbor || !neighbor.isFree) {
        ok = false
        break
      }
      span.push(neighbor)
    }

    if (ok) {
      return span
    }
  }

  return null
}

function extractScheduleBlocks(dayGrids: DayGrid[], userId: string) {
  const blocks: {
    userId: string
    date: Date
    startAt: Date
    endAt: Date
    type: ScheduleBlockTypeValue
    label?: string
    taskId?: string
    courseId?: string
    confidence?: number
    meta?: Record<string, unknown> | null
  }[] = []

  for (const day of dayGrids) {
    let active: { start: Date; end: Date; block: SlotBlock } | null = null

    for (const slot of day.slots) {
      if (!slot.block) {
        flushActive()
        continue
      }

      if (active && isSameBlock(active.block, slot.block)) {
        active.end = slot.end
      } else {
        flushActive()
        active = { start: slot.start, end: slot.end, block: slot.block }
      }
    }

    flushActive()

    function flushActive() {
      if (!active) return
      blocks.push({
        userId,
        date: startOfDay(day.date),
        startAt: active.start,
        endAt: active.end,
        type: active.block.type,
        label: active.block.label,
        taskId: active.block.taskId,
        courseId: active.block.courseId,
        confidence: active.block.confidence ?? 1,
        meta: active.block.meta,
      })
      active = null
    }
  }

  return blocks
}

function blockSlots(day: DayGrid, start: Date, end: Date, block: SlotBlock) {
  const clampedStart = max([start, startOfDay(day.date)])
  const clampedEnd = min([end, endOfDay(day.date)])

  for (const slot of day.slots) {
    if (slot.start >= clampedEnd || slot.end <= clampedStart) continue
    if (!slot.isFree && slot.block) continue
    slot.isFree = false
    slot.block = block
  }
}

function setTime(date: Date, hhmm: string) {
  const [hour, minute] = hhmm.split(":").map((v) => parseInt(v, 10))
  return set(date, { hours: hour ?? 0, minutes: minute ?? 0, seconds: 0, milliseconds: 0 })
}

function estimateTaskMinutes(
  task: {
    estimatedMinutes: number
    type: TaskTypeValue
    courseId?: string | null
    course?: { id: string; difficulty: keyof typeof DIFFICULTY_BOOST } | null
  },
  multipliers: Map<string, number>,
  userId: string
) {
  const base = task.estimatedMinutes > 0 ? task.estimatedMinutes : BASE_MINUTES[task.type] ?? 60
  const difficultyFactor = task.course ? DIFFICULTY_BOOST[task.course.difficulty] ?? 1 : 1
  const candidateKeys = [
    `${userId}:${task.courseId ?? "*"}:${task.type}`,
    `${userId}:${task.courseId ?? "*"}:*`,
    `${userId}:*:${task.type}`,
    `${userId}:*:*`,
  ]
  const multiplier = candidateKeys.reduce<number | null>((acc, key) => {
    if (acc !== null) return acc
    const value = multipliers.get(key)
    return typeof value === "number" ? value : null
  }, null) ?? 1
  return Math.round(base * difficultyFactor * multiplier)
}

function buildMultiplierMap(multipliers: UserMultiplierRecord[]) {
  const map = new Map<string, number>()
  for (const entry of multipliers) {
    const key = `${entry.userId}:${entry.courseId ?? "*"}:${entry.taskType ?? "*"}`
    map.set(key, entry.multiplier)
  }
  return map
}

function isSameBlock(a: SlotBlock, b: SlotBlock) {
  return a.type === b.type && a.label === b.label && a.taskId === b.taskId && a.courseId === b.courseId
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function summarizeDaySlots(slots: DaySlot[]) {
  const freeMinutes = slots.filter((slot) => slot.isFree).reduce((sum, slot) => sum + differenceInMinutes(slot.end, slot.start), 0)
  return { totalSlots: slots.length, freeMinutes }
}