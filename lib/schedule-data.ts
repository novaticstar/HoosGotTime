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

export const sampleScheduleBlocks: ScheduleBlock[] = [
  {
    id: "sleep-1",
    title: "Sleep",
    type: "sleep",
    start: set(baseDay, { hours: 1, minutes: 0 }).toISOString(),
    end: set(baseDay, { hours: 7, minutes: 30 }).toISOString(),
    description: "Lights out + recovery",
  },
  {
    id: "breakfast",
    title: "Breakfast",
    type: "meal",
    start: set(baseDay, { hours: 8, minutes: 0 }).toISOString(),
    end: set(baseDay, { hours: 8, minutes: 45 }).toISOString(),
    description: "Dining hall with roommates",
  },
  {
    id: "econ-lecture",
    title: "ECON 372 Lecture",
    type: "class",
    course: "ECON 372",
    location: "Monroe Hall",
    start: set(baseDay, { hours: 9, minutes: 30 }).toISOString(),
    end: set(baseDay, { hours: 10, minutes: 45 }).toISOString(),
    description: "Prof. Lee • Weekly quiz at start",
  },
  {
    id: "cs-walk",
    title: "Travel to Rice Hall",
    type: "travel",
    start: set(baseDay, { hours: 10, minutes: 50 }).toISOString(),
    end: set(baseDay, { hours: 11, minutes: 15 }).toISOString(),
    description: "15 min walk buffer",
  },
  {
    id: "cs-lab",
    title: "CS 3240 Lab",
    type: "class",
    course: "CS 3240",
    location: "Rice Hall 240",
    start: set(baseDay, { hours: 11, minutes: 15 }).toISOString(),
    end: set(baseDay, { hours: 12, minutes: 30 }).toISOString(),
    description: "Team sprint demo",
    isAtRisk: true,
  },
  {
    id: "lunch",
    title: "Lunch",
    type: "meal",
    start: set(baseDay, { hours: 12, minutes: 45 }).toISOString(),
    end: set(baseDay, { hours: 13, minutes: 15 }).toISOString(),
    description: "Fuel before study block",
  },
  {
    id: "econ-study",
    title: "ECON midterm study",
    type: "study",
    course: "ECON 372",
    start: set(baseDay, { hours: 13, minutes: 30 }).toISOString(),
    end: set(baseDay, { hours: 15, minutes: 30 }).toISOString(),
    description: "Focus on Chapter 7 problem set",
    isAtRisk: true,
  },
  {
    id: "gym",
    title: "Gym + recovery",
    type: "wellness",
    start: set(baseDay, { hours: 16, minutes: 0 }).toISOString(),
    end: set(baseDay, { hours: 17, minutes: 0 }).toISOString(),
    description: "Upper body + stretch",
  },
  {
    id: "dinner",
    title: "Dinner",
    type: "meal",
    start: set(baseDay, { hours: 18, minutes: 30 }).toISOString(),
    end: set(baseDay, { hours: 19, minutes: 15 }).toISOString(),
    description: "Meet w/ project team",
  },
  {
    id: "cs-study",
    title: "CS HW2 focus block",
    type: "study",
    course: "CS 3240",
    start: set(baseDay, { hours: 19, minutes: 30 }).toISOString(),
    end: set(baseDay, { hours: 21, minutes: 0 }).toISOString(),
    description: "Implement auth service + tests",
  },
  {
    id: "wind-down",
    title: "Wind-down + prep",
    type: "wellness",
    start: set(baseDay, { hours: 22, minutes: 0 }).toISOString(),
    end: set(baseDay, { hours: 23, minutes: 30 }).toISOString(),
    description: "Journal + light reading",
  },
  {
    id: "sleep-2",
    title: "Sleep",
    type: "sleep",
    start: set(addDays(baseDay, 1), { hours: 0, minutes: 0 }).toISOString(),
    end: set(addDays(baseDay, 1), { hours: 2, minutes: 0 }).toISOString(),
  },
]

export const sampleAtRiskTasks: AtRiskTaskSummary[] = [
  {
    id: "task-econ-midterm",
    title: "ECON midterm prep",
    dueDate: addDays(baseDay, 3).toISOString(),
    riskLevel: "high",
    blockId: "econ-study",
  },
  {
    id: "task-cs-hw2",
    title: "Ship CS HW2",
    dueDate: addDays(baseDay, 2).toISOString(),
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
  class: "bg-brand-100 text-brand-800 border border-brand-200",
  study: "bg-uva-orange-100 text-uva-orange-800 border border-uva-orange-200",
  meal: "bg-amber-100 text-amber-800 border border-amber-200",
  travel: "bg-zinc-100 text-zinc-700 border border-dashed border-zinc-300",
  wellness: "bg-brand-200 text-brand-700 border border-brand-300",
}

const courseSet = new Set<string>()
for (const block of sampleScheduleBlocks) {
  if (block.course) {
    courseSet.add(block.course)
  }
}

export const availableCourses = Array.from(courseSet)
