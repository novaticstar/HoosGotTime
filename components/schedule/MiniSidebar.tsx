"use client"

import { useMemo, useState } from "react"
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns"
import { CalendarPlus, ChevronLeft, ChevronRight, FileText, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { blockTypeLabels, ScheduleBlockType } from "@/lib/schedule-data"
import { cn } from "@/lib/utils"

const weekdayLabels = ["S", "M", "T", "W", "T", "F", "S"]
const filterOrder: ScheduleBlockType[] = ["sleep", "class", "study", "meal", "travel", "wellness"]

interface MiniSidebarProps {
  selectedDate: Date
  filters: Record<ScheduleBlockType, boolean>
  selectedCourse: string
  courses: string[]
  onSelectDate: (date: Date) => void
  onToggleFilter: (type: ScheduleBlockType) => void
  onSelectCourse: (course: string) => void
  onGenerateSchedule: () => void
  onAddTask: () => void
  onPasteSyllabus: () => void
}

export function MiniSidebar({
  selectedDate,
  filters,
  selectedCourse,
  courses,
  onSelectDate,
  onToggleFilter,
  onSelectCourse,
  onGenerateSchedule,
  onAddTask,
  onPasteSyllabus,
}: MiniSidebarProps) {
  const [calendarMonth, setCalendarMonth] = useState<Date>(selectedDate)

  const days = useMemo(() => {
    const monthStart = startOfMonth(calendarMonth)
    const monthEnd = endOfMonth(calendarMonth)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }, [calendarMonth])

  const handlePrevious = () => setCalendarMonth((prev) => subMonths(prev, 1))
  const handleNext = () => setCalendarMonth((prev) => addMonths(prev, 1))

  return (
    <div className="flex h-full flex-col gap-4">
      <section className="rounded-xl border bg-white p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between text-sm font-medium">
          <div>
            <div>{format(calendarMonth, "MMMM")}</div>
            <div className="text-xs font-normal text-muted-foreground">{format(calendarMonth, "yyyy")}</div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevious}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="rounded-md p-1 text-muted-foreground hover:bg-muted"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground">
          {weekdayLabels.map((label) => (
            <div key={label}>{label}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1 text-center text-sm">
          {days.map((day) => {
            const inMonth = isSameMonth(day, calendarMonth)
            const isSelected = isSameDay(day, selectedDate)
            const today = isToday(day)
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => onSelectDate(day)}
                className={cn(
                  "relative rounded-md py-1 text-xs font-medium transition",
                  inMonth ? "text-foreground" : "text-muted-foreground/60",
                  isSelected && "bg-brand-600 text-white shadow",
                  !isSelected && today && "ring-1 ring-brand-300"
                )}
              >
                {format(day, "d")}
                {today && !isSelected && <span className="absolute inset-x-2 bottom-1 h-1 rounded-full bg-brand-400" />}
              </button>
            )
          })}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <Button className="justify-start gap-2" size="sm" onClick={onGenerateSchedule}>
          <Sparkles className="h-4 w-4" /> Generate schedule
        </Button>
        <Button className="justify-start gap-2" size="sm" variant="outline" onClick={onAddTask}>
          <CalendarPlus className="h-4 w-4" /> Add task
        </Button>
        <Button className="justify-start gap-2" size="sm" variant="outline" onClick={onPasteSyllabus}>
          <FileText className="h-4 w-4" /> Paste syllabus
        </Button>
      </section>

      <section className="mt-2 space-y-4 rounded-xl border bg-white p-3 shadow-sm">
        <div>
          <p className="mb-2 text-sm font-semibold">Filters</p>
          <div className="flex flex-wrap gap-2">
            {filterOrder.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => onToggleFilter(type)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition",
                  filters[type]
                    ? "border-brand-200 bg-brand-50 text-brand-700"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                )}
              >
                {blockTypeLabels[type]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold">Course focus</p>
          <select
            value={selectedCourse}
            onChange={(event) => onSelectCourse(event.target.value)}
            className="w-full rounded-md border px-2 py-2 text-sm"
          >
            <option value="all">All courses</option>
            {courses.map((course) => (
              <option key={course} value={course}>
                {course}
              </option>
            ))}
          </select>
        </div>
      </section>
    </div>
  )
}
