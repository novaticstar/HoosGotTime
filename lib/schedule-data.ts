import { addDays, set } from "date-fns"

export type ScheduleBlockType = "sleep" | "class" | "study" | "meal" | "travel" | "wellness"

export interface ScheduleBlock {
  id: string
  title: string
  type: ScheduleBlockType
  course?: string
  location?: string
  start: string
  end: string
  description?: string
  isAtRisk?: boolean
}

export interface AtRiskTaskSummary {
  id: string
  title: string
  dueDate: string
  riskLevel: "medium" | "high"
  blockId?: string
}

const today = new Date()
const baseDay = set(today, { hours: 0, minutes: 0, seconds: 0, milliseconds: 0 })

// Helper function to create local time ISO strings without UTC conversion
const toLocalISOString = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000`
}

export const sampleScheduleBlocks: ScheduleBlock[] = [
  {
    id: "sleep-1",
    title: "Sleep",
    type: "sleep",
    start: toLocalISOString(set(baseDay, { hours: 1, minutes: 0 })),
    end: toLocalISOString(set(baseDay, { hours: 7, minutes: 30 })),
    description: "Lights out + recovery",
  },
  {
    id: "breakfast",
    title: "Breakfast",
    type: "meal",
    start: toLocalISOString(set(baseDay, { hours: 8, minutes: 0 })),
    end: toLocalISOString(set(baseDay, { hours: 8, minutes: 45 })),
    description: "Dining hall with roommates",
  },
  {
    id: "econ-lecture",
    title: "ECON 372 Lecture",
    type: "class",
    course: "ECON 372",
    location: "Monroe Hall",
    start: toLocalISOString(set(baseDay, { hours: 9, minutes: 30 })),
    end: toLocalISOString(set(baseDay, { hours: 10, minutes: 45 })),
    description: "Prof. Lee • Weekly quiz at start",
  },
  {
    id: "cs-walk",
    title: "Travel to Rice Hall",
    type: "travel",
    start: toLocalISOString(set(baseDay, { hours: 10, minutes: 50 })),
    end: toLocalISOString(set(baseDay, { hours: 11, minutes: 15 })),
    description: "15 min walk buffer",
  },
  {
    id: "cs-lab",
    title: "CS 3240 Lab",
    type: "class",
    course: "CS 3240",
    location: "Rice Hall 240",
    start: toLocalISOString(set(baseDay, { hours: 11, minutes: 15 })),
    end: toLocalISOString(set(baseDay, { hours: 12, minutes: 30 })),
    description: "Team sprint demo",
    isAtRisk: true,
  },
  {
    id: "lunch",
    title: "Lunch",
    type: "meal",
    start: toLocalISOString(set(baseDay, { hours: 12, minutes: 45 })),
    end: toLocalISOString(set(baseDay, { hours: 13, minutes: 15 })),
    description: "Fuel before study block",
  },
  {
    id: "econ-study",
    title: "ECON midterm study",
    type: "study",
    course: "ECON 372",
    start: toLocalISOString(set(baseDay, { hours: 13, minutes: 30 })),
    end: toLocalISOString(set(baseDay, { hours: 15, minutes: 30 })),
    description: "Focus on Chapter 7 problem set",
    isAtRisk: true,
  },
  {
    id: "gym",
    title: "Gym + recovery",
    type: "wellness",
    start: toLocalISOString(set(baseDay, { hours: 16, minutes: 0 })),
    end: toLocalISOString(set(baseDay, { hours: 17, minutes: 0 })),
    description: "Upper body + stretch",
  },
  {
    id: "dinner",
    title: "Dinner",
    type: "meal",
    start: toLocalISOString(set(baseDay, { hours: 18, minutes: 30 })),
    end: toLocalISOString(set(baseDay, { hours: 19, minutes: 15 })),
    description: "Meet w/ project team",
  },
  {
    id: "cs-study",
    title: "CS HW2 focus block",
    type: "study",
    course: "CS 3240",
    start: toLocalISOString(set(baseDay, { hours: 19, minutes: 30 })),
    end: toLocalISOString(set(baseDay, { hours: 21, minutes: 0 })),
    description: "Implement auth service + tests",
  },
  {
    id: "wind-down",
    title: "Wind-down + prep",
    type: "wellness",
    start: toLocalISOString(set(baseDay, { hours: 22, minutes: 0 })),
    end: toLocalISOString(set(baseDay, { hours: 23, minutes: 30 })),
    description: "Journal + light reading",
  },
  {
    id: "sleep-2",
    title: "Sleep",
    type: "sleep",
    start: toLocalISOString(set(addDays(baseDay, 1), { hours: 0, minutes: 0 })),
    end: toLocalISOString(set(addDays(baseDay, 1), { hours: 2, minutes: 0 })),
  },
]

export const sampleAtRiskTasks: AtRiskTaskSummary[] = [
  {
    id: "task-econ-midterm",
    title: "ECON midterm prep",
    dueDate: toLocalISOString(addDays(baseDay, 3)),
    riskLevel: "high",
    blockId: "econ-study",
  },
  {
    id: "task-cs-hw2",
    title: "Ship CS HW2",
    dueDate: toLocalISOString(addDays(baseDay, 2)),
    riskLevel: "medium",
    blockId: "cs-study",
  },
]

export const defaultBlockFilters: Record<ScheduleBlockType, boolean> = {
  sleep: true,
  class: true,
  study: true,
  meal: true,
  travel: true,
  wellness: true,
}

export const blockTypeLabels: Record<ScheduleBlockType, string> = {
  sleep: "Sleep",
  class: "Classes",
  study: "Study",
  meal: "Meals",
  travel: "Travel",
  wellness: "Wellness",
}

export const blockTypeColors: Record<ScheduleBlockType, string> = {
  sleep: "bg-slate-200 text-slate-700",
  class: "bg-blue-100 text-blue-800 border border-blue-200",
  study: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  meal: "bg-amber-100 text-amber-800 border border-amber-200",
  travel: "bg-zinc-100 text-zinc-700 border border-dashed border-zinc-300",
  wellness: "bg-purple-100 text-purple-800 border border-purple-200",
}

const courseSet = new Set<string>()
for (const block of sampleScheduleBlocks) {
  if (block.course) {
    courseSet.add(block.course)
  }
}

export const availableCourses = Array.from(courseSet)
