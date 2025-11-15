"use client"

import { useMemo } from "react"
import {
  addDays,
  addHours,
  addMinutes,
  differenceInMinutes,
  format,
  isSameDay,
  isToday,
  startOfDay,
  startOfWeek,
} from "date-fns"
import { CalendarDays, ChevronLeft, ChevronRight, RefreshCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { blockTypeColors, blockTypeLabels, ScheduleBlock } from "@/lib/schedule-data"
import { cn } from "@/lib/utils"

const START_HOUR = 6
const END_HOUR = 26
const SLOT_MINUTES = 30
const SLOT_HEIGHT = 32 // px per 30-minute slot
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60
const SLOT_COUNT = TOTAL_MINUTES / SLOT_MINUTES

export type ViewMode = "day" | "week"

interface DayViewProps {
  selectedDate: Date
  viewMode: ViewMode
  blocks: ScheduleBlock[]
  onChangeDate: (date: Date) => void
  onChangeView: (mode: ViewMode) => void
  onToday: () => void
  onRegenerate: () => void
  onBlockClick?: (block: ScheduleBlock) => void
  highlightedBlockId?: string | null
  onBlankSlotRequest?: (date: Date) => void
}

type BlockSegment = ScheduleBlock & {
  segmentStart: Date
  segmentEnd: Date
}

function getDayStart(date: Date) {
  return addHours(startOfDay(date), START_HOUR)
}

function sliceBlockForDate(block: ScheduleBlock, date: Date): BlockSegment | null {
  const dayStart = getDayStart(date)
  const dayEnd = addMinutes(dayStart, TOTAL_MINUTES)
  const blockStart = new Date(block.start)
  const blockEnd = new Date(block.end)

  if (blockEnd <= dayStart || blockStart >= dayEnd) {
    return null
  }

  const segmentStart = blockStart < dayStart ? dayStart : blockStart
  const segmentEnd = blockEnd > dayEnd ? dayEnd : blockEnd

  return {
    ...block,
    segmentStart,
    segmentEnd,
  }
}

function formatRange(start: Date, end: Date) {
  return `${format(start, "h:mm a")} – ${format(end, "h:mm a")}`
}

export function DayView({
  selectedDate,
  viewMode,
  blocks,
  onChangeDate,
  onChangeView,
  onToday,
  onRegenerate,
  onBlockClick,
  highlightedBlockId,
  onBlankSlotRequest,
}: DayViewProps) {
  const columnHeight = SLOT_COUNT * SLOT_HEIGHT
  const weekStart = useMemo(() => startOfWeek(selectedDate, { weekStartsOn: 1 }), [selectedDate])
  const visibleDates = useMemo(() => {
    if (viewMode === "day") {
      return [selectedDate]
    }
    return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))
  }, [selectedDate, viewMode, weekStart])

  const hourLabels = useMemo(() => {
    return Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, index) => {
      const hourDate = addHours(startOfDay(selectedDate), START_HOUR + index)
      return format(hourDate, "h a")
    })
  }, [selectedDate])

  const daySegments = useMemo(() => {
    return visibleDates.map((date) => ({
      date,
      segments: blocks
        .map((block) => sliceBlockForDate(block, date))
        .filter((segment): segment is BlockSegment => Boolean(segment)),
    }))
  }, [blocks, visibleDates])

  const handlePrevious = () => {
    const delta = viewMode === "day" ? -1 : -7
    onChangeDate(addDays(selectedDate, delta))
  }

  const handleNext = () => {
    const delta = viewMode === "day" ? 1 : 7
    onChangeDate(addDays(selectedDate, delta))
  }

  const handleBlankSlot = (event: React.MouseEvent<HTMLDivElement>, date: Date) => {
    if (!onBlankSlotRequest) return
    const rect = event.currentTarget.getBoundingClientRect()
    const offsetY = event.clientY - rect.top
    const minutesFromStart = Math.round((offsetY / rect.height) * TOTAL_MINUTES)
    const snappedMinutes = Math.max(0, Math.min(TOTAL_MINUTES, Math.round(minutesFromStart / SLOT_MINUTES) * SLOT_MINUTES))
    const slotDate = addMinutes(getDayStart(date), snappedMinutes)
    onBlankSlotRequest(slotDate)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={handlePrevious} aria-label="Previous">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleNext} aria-label="Next">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="text-sm font-semibold">
              {viewMode === "day"
                ? format(selectedDate, "EEEE, MMM d")
                : `${format(visibleDates[0], "MMM d")} – ${format(visibleDates[visibleDates.length - 1], "MMM d")}`}
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-full border bg-muted px-1 py-1 text-xs font-medium">
            {(["day", "week"] as ViewMode[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onChangeView(option)}
                className={cn(
                  "rounded-full px-3 py-1 capitalize",
                  viewMode === option ? "bg-white shadow" : "text-muted-foreground"
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={onToday}>
            Today
          </Button>
          <Button size="sm" className="gap-2" onClick={onRegenerate}>
            <RefreshCcw className="h-4 w-4" /> Regenerate schedule
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-14 shrink-0 border-r bg-muted/30 text-right text-xs text-muted-foreground">
          {hourLabels.map((label) => (
            <div key={label} className="h-[64px] pr-2">
              {label}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-auto">
          <div className="flex min-h-full">
            {daySegments.map(({ date, segments }) => {
              const dayStart = getDayStart(date)
              const isCurrentDay = isSameDay(date, selectedDate)
              const showNowIndicator = isToday(date)
              const now = new Date()
              const nowMinutes = differenceInMinutes(now, dayStart)
              const nowPercent = (nowMinutes / TOTAL_MINUTES) * 100

              return (
                <div key={date.toISOString()} className="relative flex-1 border-l bg-white first:border-l-0">
                  <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white/95 px-3 py-2 text-xs font-semibold">
                    <div>{format(date, "EEE")}</div>
                    <div className={cn("text-sm", isCurrentDay ? "text-brand-600" : "text-muted-foreground")}>{format(date, "d")}</div>
                  </div>
                  <div
                    className="relative"
                    style={{ height: columnHeight }}
                    onDoubleClick={(event) => handleBlankSlot(event, date)}
                  >
                    <div
                      className="absolute inset-0 grid"
                      style={{ gridTemplateRows: `repeat(${SLOT_COUNT}, minmax(${SLOT_HEIGHT}px, 1fr))` }}
                      onClick={(event) => {
                        if (event.target === event.currentTarget) {
                          handleBlankSlot(event as React.MouseEvent<HTMLDivElement>, date)
                        }
                      }}
                    >
                      {Array.from({ length: SLOT_COUNT }).map((_, index) => (
                        <div
                          key={index}
                          className={cn(
                            "border-b border-dashed border-slate-100",
                            index % (60 / SLOT_MINUTES) === 0 && "border-b border-slate-200"
                          )}
                        />
                      ))}
                    </div>

                    {segments.map((segment) => {
                      const minutesFromStart = differenceInMinutes(segment.segmentStart, dayStart)
                      const durationMinutes = Math.max(
                        SLOT_MINUTES,
                        differenceInMinutes(segment.segmentEnd, segment.segmentStart)
                      )
                      const topPercent = (minutesFromStart / TOTAL_MINUTES) * 100
                      const heightPercent = (durationMinutes / TOTAL_MINUTES) * 100

                      return (
                        <button
                          key={`${segment.id}-${segment.segmentStart.toISOString()}`}
                          type="button"
                          onClick={() => onBlockClick?.(segment)}
                          className={cn(
                            "absolute left-2 right-2 rounded-lg border px-3 py-2 text-left text-xs shadow-sm transition",
                            blockTypeColors[segment.type],
                            highlightedBlockId === segment.id && "ring-2 ring-brand-500"
                          )}
                          style={{ top: `${topPercent}%`, height: `${heightPercent}%` }}
                        >
                          <div className="text-[11px] font-semibold">{segment.title}</div>
                          <div className="text-[10px] text-muted-foreground">{formatRange(segment.segmentStart, segment.segmentEnd)}</div>
                          {segment.course && <div className="mt-1 text-[10px] font-medium">{segment.course}</div>}
                          {segment.isAtRisk && (
                            <div className="mt-1 inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                              At risk
                            </div>
                          )}
                        </button>
                      )
                    })}

                    {showNowIndicator && nowMinutes >= 0 && nowMinutes <= TOTAL_MINUTES && (
                      <div className="pointer-events-none absolute left-2 right-2" style={{ top: `${nowPercent}%` }}>
                        <div className="flex items-center gap-2">
                          <div className="h-[2px] flex-1 bg-brand-500" />
                          <div className="h-2 w-2 rounded-full bg-brand-500" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="border-t px-4 py-2 text-xs text-muted-foreground">
        <div className="inline-flex items-center gap-2">
          <CalendarDays className="h-3.5 w-3.5" />
          Double-click an empty slot to add a block, or click a block to view details.
        </div>
      </div>
    </div>
  )
}
