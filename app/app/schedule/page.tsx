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
    async (
      intent: AssistantIntent,
      payload?: string,
      conversationHistory?: Array<{ role: string; content: string }>
    ) => {
      try {
        const dayLabel = format(selectedDate, "EEEE, MMMM d")
        const todayBlocks = filteredBlocks.filter((block) =>
          isSameDay(new Date(block.start), selectedDate)
        )

        switch (intent) {
          case "summarize-today": {
            const response = await fetch("/api/chat/message", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                message: `Can you give me a summary of my day on ${dayLabel}?`,
                conversationHistory,
                userContext: {
                  currentDate: format(selectedDate, "yyyy-MM-dd"),
                  todaySchedule: todayBlocks.map((b) => ({
                    type: b.type,
                    label: b.title,
                    start: b.start,
                    end: b.end,
                  })),
                  upcomingTasks: atRiskTasks.map((t) => ({
                    title: t.title,
                    dueAt: format(new Date(t.dueDate), "yyyy-MM-dd"),
                  })),
                },
              }),
            })
            const data = await response.json()
            return data.response || `Here's ${dayLabel}: classes anchor your morning, meals guard your energy, and I stacked two study blocks after lunch.`
          }

          case "summarize-week": {
            const response = await fetch("/api/chat/message", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                message: "Can you give me a summary of my week ahead?",
                conversationHistory,
                userContext: {
                  currentDate: format(selectedDate, "yyyy-MM-dd"),
                  upcomingTasks: atRiskTasks.map((t) => ({
                    title: t.title,
                    dueAt: format(new Date(t.dueDate), "yyyy-MM-dd"),
                  })),
                },
              }),
            })
            const data = await response.json()
            return data.response || "Week overview: Tue/Thu are heavy, so I left Wednesday flexible for catch-up and recovery."
          }

          case "parse-syllabus":
            return "I can help you extract tasks from your syllabus! Please paste your syllabus text and I'll identify all assignments, exams, and deadlines with due dates."

          case "nl-create":
            return "I can help you create tasks from natural language! Just tell me what you need to do, like 'finish math homework by Friday' or 'study for bio exam next week', and I'll parse it into structured tasks."

          case "study-plan": {
            if (!payload) {
              return "Pick a task and I'll break it into study steps with time estimates, create flashcards, and generate practice questions to help you prepare."
            }
            const response = await fetch("/api/chat/message", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                message: `Can you help me create a study plan for: ${payload}`,
                conversationHistory,
                userContext: {
                  currentDate: format(selectedDate, "yyyy-MM-dd"),
                },
              }),
            })
            const data = await response.json()
            return data.response || `I'll craft a study plan for ${payload}: spaced repetition, quick recall drills, and flashcards at night. Ready?`
          }

          case "describe-now": {
            const response = await fetch("/api/chat/message", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                message: payload || "What should I be focusing on right now?",
                conversationHistory,
                userContext: {
                  currentDate: format(selectedDate, "yyyy-MM-dd"),
                  todaySchedule: todayBlocks.map((b) => ({
                    type: b.type,
                    label: b.title,
                    start: b.start,
                    end: b.end,
                  })),
                },
              }),
            })
            const data = await response.json()
            return data.response || "You're in a buffer zone. Want me to slot a quick win or open the study view for the next block?"
          }

          case "free-form":
          default: {
            if (!payload) return "I'm here to help! What would you like to know?"

            console.log("Making free-form API call with payload:", payload)
            const response = await fetch("/api/chat/message", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                message: payload,
                conversationHistory,
                userContext: {
                  currentDate: format(selectedDate, "yyyy-MM-dd"),
                  todaySchedule: todayBlocks.map((b) => ({
                    type: b.type,
                    label: b.title,
                    start: b.start,
                    end: b.end,
                  })),
                  upcomingTasks: atRiskTasks.map((t) => ({
                    title: t.title,
                    dueAt: format(new Date(t.dueDate), "yyyy-MM-dd"),
                  })),
                },
              }),
            })

            if (!response.ok) {
              console.error("API response not OK:", response.status, response.statusText)
              const errorData = await response.json().catch(() => null)
              console.error("API error details:", errorData)
              throw new Error(`API request failed: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log("API response data:", data)

            if (!data.response) {
              console.warn("API response missing 'response' field:", data)
              return "I'm here to help with your schedule and tasks!"
            }

            return data.response
          }
        }
      } catch (error) {
        console.error("Error handling assistant intent:", error)
        if (error instanceof Error) {
          return `Sorry, I encountered an error: ${error.message}. Please make sure your ANTHROPIC_API_KEY is configured.`
        }
        return "Sorry, I encountered an error. Please try again."
      }
    },
    [selectedDate, filteredBlocks, atRiskTasks]
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
