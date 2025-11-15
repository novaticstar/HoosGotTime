"use client"

import Link from "next/link"
import { useCallback, useMemo, useState } from "react"
import { format, formatDistanceToNowStrict, isSameDay, startOfToday } from "date-fns"
import { AlertTriangle } from "lucide-react"

import { AssistantActionTrigger, AssistantIntent, AssistantPanel } from "@/components/assistant/AssistantPanel"
import { DayView, ViewMode } from "@/components/schedule/DayView"
import { MiniSidebar } from "@/components/schedule/MiniSidebar"
import { Button } from "@/components/ui/button"
import {
  availableCourses,
  defaultBlockFilters,
  sampleAtRiskTasks,
  sampleScheduleBlocks,
  ScheduleBlock,
  ScheduleBlockType,
} from "@/lib/schedule-data"
import { cn } from "@/lib/utils"

const courses = availableCourses

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday())
  const [viewMode, setViewMode] = useState<ViewMode>("day")
  const [filters, setFilters] = useState<Record<ScheduleBlockType, boolean>>(defaultBlockFilters)
  const [selectedCourse, setSelectedCourse] = useState<string>("all")
  const [highlightedBlockId, setHighlightedBlockId] = useState<string | null>(null)
  const [selectedBlock, setSelectedBlock] = useState<ScheduleBlock | null>(null)
  const [assistantAction, setAssistantAction] = useState<AssistantActionTrigger | null>(null)
  const [contextualSuggestion, setContextualSuggestion] = useState<
    { label: string; intent: AssistantIntent; payload?: string } | null
  >(null)
  const [mobileTab, setMobileTab] = useState<"calendar" | "assistant">("calendar")

  const filteredBlocks = useMemo(() => {
    return sampleScheduleBlocks.filter((block) => {
      if (!filters[block.type]) return false
      if (selectedCourse !== "all" && block.course !== selectedCourse) return false
      return true
    })
  }, [filters, selectedCourse])

  const atRiskTasks = sampleAtRiskTasks

  const toggleFilter = (type: ScheduleBlockType) => {
    setFilters((prev) => ({ ...prev, [type]: !prev[type] }))
  }

  const handleActionIntent = useCallback((intent: AssistantIntent, payload?: string) => {
    setAssistantAction({
      id: Math.random().toString(36).slice(2),
      intent,
      payload,
    })
  }, [])

  const handleBlockClick = useCallback((block: ScheduleBlock) => {
    setSelectedBlock(block)
    setHighlightedBlockId(block.id)
    if (block.type === "study" || block.type === "class") {
      setContextualSuggestion({
        label: `Help me with ${block.title}`,
        intent: "study-plan",
        payload: block.title,
      })
    } else {
      setContextualSuggestion({
        label: `Adjust ${block.title}`,
        intent: "describe-now",
        payload: block.title,
      })
    }
  }, [])

  const handleBlankSlot = useCallback((date: Date) => {
    setContextualSuggestion({
      label: `Add a block at ${format(date, "h:mm a")}`,
      intent: "nl-create",
      payload: `Add time on ${format(date, "EEEE h:mm a")}`,
    })
  }, [])

  const handleAssistantIntent = useCallback(
    async (intent: AssistantIntent, payload?: string) => {
      await new Promise((resolve) => setTimeout(resolve, 350))
      const dayLabel = format(selectedDate, "EEEE")
      switch (intent) {
        case "summarize-today":
          return `Here’s ${dayLabel}: classes anchor your morning, meals guard your energy, and I stacked two study blocks after lunch.`
        case "summarize-week":
          return "Week overview: Tue/Thu are heavy, so I left Wednesday flexible for catch-up and recovery." 
        case "parse-syllabus":
          return "Paste the syllabus text and I’ll extract tasks with due dates plus study recommendations."
        case "nl-create":
          return "Drafted tasks from your note—confirm to save them and I’ll queue the scheduler."
        case "study-plan":
          return payload
            ? `I’ll craft a study plan for ${payload}: spaced repetition, quick recall drills, and flashcards at night. Ready?`
            : "Pick a task and I’ll break it into study reps."
        case "describe-now":
          return "You’re in a buffer zone. Want me to slot a quick win or open the study view for the next block?"
        case "free-form":
        default:
          return payload ? `Logged your note: ${payload}` : "Noted!"
      }
    },
    [selectedDate]
  )

  const handleGenerateSchedule = () => handleActionIntent("summarize-week")
  const handleAddTask = () => handleActionIntent("nl-create")
  const handlePasteSyllabus = () => handleActionIntent("parse-syllabus")

  const handleSelectAtRisk = (blockId?: string) => {
    if (!blockId) return
    const block = sampleScheduleBlocks.find((candidate) => candidate.id === blockId)
    if (!block) return
    setSelectedDate(new Date(block.start))
    handleBlockClick(block)
  }

  const formatBlockRange = (block: ScheduleBlock) => {
    const start = new Date(block.start)
    const end = new Date(block.end)
    const sameDay = isSameDay(start, end)
    return sameDay
      ? `${format(start, "EEE h:mm a")} – ${format(end, "h:mm a")}`
      : `${format(start, "EEE h:mm a")} → ${format(end, "EEE h:mm a")}`
  }

  return (
    <div className="flex flex-col">
      <div className="mx-auto mt-4 w-full max-w-6xl px-4 md:hidden">
        <div className="flex items-center gap-1 rounded-full border bg-white px-1 py-1 text-xs font-semibold shadow-sm">
          {(
            [
              { label: "Calendar", value: "calendar" },
              { label: "Assistant", value: "assistant" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setMobileTab(tab.value)}
              className={cn(
                "flex-1 rounded-full px-3 py-2",
                mobileTab === tab.value ? "bg-brand-600 text-white" : "text-muted-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-4 md:flex-row">
        <aside className="hidden w-64 flex-col gap-4 md:flex">
          <MiniSidebar
            selectedDate={selectedDate}
            filters={filters}
            selectedCourse={selectedCourse}
            courses={courses}
            onSelectDate={setSelectedDate}
            onToggleFilter={toggleFilter}
            onSelectCourse={setSelectedCourse}
            onGenerateSchedule={handleGenerateSchedule}
            onAddTask={handleAddTask}
            onPasteSyllabus={handlePasteSyllabus}
          />
        </aside>

  <section className={cn("flex-1 space-y-4", mobileTab === "assistant" ? "hidden md:block" : "block")}>
          <div className="rounded-xl border bg-white p-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              {atRiskTasks.length ? (
                atRiskTasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => handleSelectAtRisk(task.blockId)}
                    className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-medium text-amber-800"
                  >
                    {task.title} · due {formatDistanceToNowStrict(new Date(task.dueDate), { addSuffix: true })}
                  </button>
                ))
              ) : (
                <span>All tasks on-track</span>
              )}
            </div>
          </div>

          {selectedBlock && (
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{selectedBlock.title}</p>
                  <p className="text-xs text-muted-foreground">{formatBlockRange(selectedBlock)}</p>
                  {selectedBlock.description && (
                    <p className="mt-2 text-sm text-slate-600">{selectedBlock.description}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/app/tasks">View task</Link>
                  </Button>
                  <Button size="sm" onClick={() => handleActionIntent("study-plan", selectedBlock.title)}>
                    Discuss with assistant
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border bg-white shadow">
            <DayView
              selectedDate={selectedDate}
              viewMode={viewMode}
              blocks={filteredBlocks}
              onChangeDate={setSelectedDate}
              onChangeView={setViewMode}
              onToday={() => setSelectedDate(startOfToday())}
              onRegenerate={() => handleActionIntent("summarize-week")}
              onBlockClick={handleBlockClick}
              highlightedBlockId={highlightedBlockId}
              onBlankSlotRequest={handleBlankSlot}
            />
          </div>
        </section>

  <aside className={cn("w-full md:w-96", mobileTab === "calendar" ? "hidden md:block" : "block")}>
          <AssistantPanel
            selectedDate={selectedDate}
            onRunAction={handleAssistantIntent}
            externalAction={assistantAction}
            contextualSuggestion={contextualSuggestion}
          />
        </aside>
      </main>
    </div>
  )
}
