"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { addDays, format, formatDistanceToNowStrict, isSameDay, startOfToday, startOfWeek } from "date-fns"
import { AlertTriangle } from "lucide-react"

import { AssistantActionTrigger, AssistantIntent, AssistantPanel } from "@/components/assistant/AssistantPanel"
import { DayView, ViewMode } from "@/components/schedule/DayView"
import { MiniSidebar } from "@/components/schedule/MiniSidebar"
import { Button } from "@/components/ui/button"
import {
  defaultBlockFilters,
  ScheduleBlock as ScheduleBlockType,
  ScheduleBlockType as BlockType,
} from "@/lib/schedule-data"
import { cn } from "@/lib/utils"

type ScheduleBlock = {
  id: string
  title: string
  type: BlockType
  course?: string | null
  location?: string
  start: string
  end: string
  description?: string
  isAtRisk?: boolean
}

type AtRiskTask = {
  id: string
  title: string
  dueDate: string
  riskLevel: "medium" | "high"
  blockId?: string
}

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday())
  const [viewMode, setViewMode] = useState<ViewMode>("day")
  const [filters, setFilters] = useState<Record<BlockType, boolean>>(defaultBlockFilters)
  const [selectedCourse, setSelectedCourse] = useState<string>("all")
  const [highlightedBlockId, setHighlightedBlockId] = useState<string | null>(null)
  const [selectedBlock, setSelectedBlock] = useState<ScheduleBlock | null>(null)
  const [assistantAction, setAssistantAction] = useState<AssistantActionTrigger | null>(null)
  const [contextualSuggestion, setContextualSuggestion] = useState<
    { label: string; intent: AssistantIntent; payload?: string } | null
  >(null)
  const [mobileTab, setMobileTab] = useState<"calendar" | "assistant">("calendar")
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([])
  const [atRiskTasks, setAtRiskTasks] = useState<AtRiskTask[]>([])
  const [courses, setCourses] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch schedule data based on view mode and selected date
  const fetchScheduleData = useCallback(async () => {
    try {
      setLoading(true)
      let startDate: Date
      let endDate: Date

      if (viewMode === "day") {
        startDate = selectedDate
        endDate = selectedDate
      } else {
        // Week view
        startDate = startOfWeek(selectedDate, { weekStartsOn: 1 })
        endDate = addDays(startDate, 6)
      }

      const response = await fetch(
        `/api/schedule/get?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      )
      
      if (!response.ok) {
        console.error("Failed to fetch schedule:", response.statusText)
        return
      }

      const data = await response.json()
      
      // Fetch course details for blocks with courseId
      const courseIds = [...new Set(data.blocks.map((b: any) => b.courseId).filter(Boolean))]
      let coursesMap: Record<string, any> = {}
      
      if (courseIds.length > 0) {
        const coursesResponse = await fetch(`/api/courses/get`)
        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json()
          coursesMap = coursesData.courses.reduce((acc: any, course: any) => {
            acc[course.id] = course
            return acc
          }, {})
        }
      }
      
      // Transform database blocks to match component format
      const transformedBlocks: ScheduleBlock[] = data.blocks.map((block: any) => {
        const course = block.courseId ? coursesMap[block.courseId] : null
        return {
          id: block.id,
          title: block.label,
          type: block.type,
          course: course ? (course.code || course.name) : null,
          start: block.startAt,
          end: block.endAt,
          description: block.meta?.description,
          isAtRisk: block.task?.atRisk || false,
        }
      })

      setScheduleBlocks(transformedBlocks)

      // Extract unique courses
      const uniqueCourses = new Set<string>()
      transformedBlocks.forEach((block) => {
        if (block.course) uniqueCourses.add(block.course)
      })
      setCourses(Array.from(uniqueCourses))
    } catch (error) {
      console.error("Error fetching schedule:", error)
    } finally {
      setLoading(false)
    }
  }, [selectedDate, viewMode])

  // Fetch at-risk tasks
  const fetchAtRiskTasks = useCallback(async () => {
    try {
      const response = await fetch("/api/tasks/get?atRiskOnly=true")
      
      if (!response.ok) {
        console.error("Failed to fetch at-risk tasks:", response.statusText)
        return
      }

      const data = await response.json()
      
      const transformedTasks: AtRiskTask[] = data.tasks.map((task: any) => ({
        id: task.id,
        title: `${task.title}${task.course ? ` (${task.course.code || task.course.name})` : ""}`,
        dueDate: task.dueAt,
        riskLevel: task.estimatedMinutes > 180 ? "high" : "medium",
      }))

      setAtRiskTasks(transformedTasks)
    } catch (error) {
      console.error("Error fetching at-risk tasks:", error)
    }
  }, [])

  // Initial fetch and refetch when date/view changes
  useEffect(() => {
    void fetchScheduleData()
  }, [fetchScheduleData])

  useEffect(() => {
    void fetchAtRiskTasks()
  }, [fetchAtRiskTasks])

  const filteredBlocks = useMemo(() => {
    return scheduleBlocks.filter((block) => {
      if (!filters[block.type]) return false
      if (selectedCourse !== "all" && block.course !== selectedCourse) return false
      return true
    })
  }, [scheduleBlocks, filters, selectedCourse])

  const toggleFilter = (type: BlockType) => {
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
    const timeStr = format(date, "h:mm a")
    const dateStr = format(date, "EEEE, MMMM d 'at' h:mm a")
    
    setContextualSuggestion({
      label: `Add a block at ${timeStr}`,
      intent: "nl-create",
      payload: `Create a task or study block on ${dateStr}`,
    })
    
    // Automatically trigger the assistant with a prompt
    setAssistantAction({
      id: Math.random().toString(36).slice(2),
      intent: "nl-create",
      payload: `I want to add something to my schedule on ${dateStr}. What would you like to schedule?`,
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
                    course: b.course,
                  })),
                  upcomingTasks: atRiskTasks.map((t) => ({
                    title: t.title,
                    dueAt: format(new Date(t.dueDate), "yyyy-MM-dd"),
                  })),
                },
              }),
            })
            const data = await response.json()
            
            // Refresh data after AI response
            await fetchScheduleData()
            await fetchAtRiskTasks()
            
            return data.response || `Here's ${dayLabel}: your schedule has been loaded from the database.`
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
                  weekSchedule: scheduleBlocks.map((b) => ({
                    type: b.type,
                    label: b.title,
                    start: b.start,
                    end: b.end,
                    course: b.course,
                  })),
                  upcomingTasks: atRiskTasks.map((t) => ({
                    title: t.title,
                    dueAt: format(new Date(t.dueDate), "yyyy-MM-dd"),
                  })),
                },
              }),
            })
            const data = await response.json()
            
            // Refresh data after AI response
            await fetchScheduleData()
            await fetchAtRiskTasks()
            
            return data.response || "Week overview: Your schedule is loaded from your actual calendar data."
          }

          case "parse-syllabus":
            return "I can help you extract tasks from your syllabus! Please paste your syllabus text and I'll identify all assignments, exams, and deadlines with due dates."

          case "nl-create":
            {
              // Check if payload contains task creation request
              if (payload && (payload.toLowerCase().includes("task") || payload.toLowerCase().includes("assignment") || payload.toLowerCase().includes("study") || payload.toLowerCase().includes("schedule"))) {
                // Ask AI to create the task
                const response = await fetch("/api/chat/message", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    message: `Create task(s) from this request: ${payload}. After understanding what task(s) to create, confirm with the user what will be created and ask if they want to proceed.`,
                    conversationHistory,
                    userContext: {
                      currentDate: format(selectedDate, "yyyy-MM-dd"),
                    },
                  }),
                })
                
                const data = await response.json()
                return data.response || "I can help you create tasks from natural language! Just tell me what you need to do, like 'finish math homework by Friday' or 'study for bio exam next week', and I'll parse it into structured tasks. You can also go to the Tasks page to add tasks manually or paste a syllabus."
              }
              
              return "I can help you create tasks from natural language! Just tell me what you need to do, like 'finish math homework by Friday' or 'study for bio exam next week', and I'll parse it into structured tasks. You can also go to the Tasks page to add tasks manually or paste a syllabus."
            }

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
                  relatedTasks: atRiskTasks.filter(t => t.title.includes(payload)),
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
                  currentTime: format(new Date(), "HH:mm"),
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
                    course: b.course,
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

            // Refresh data after AI response if it might have changed something
            if (payload.toLowerCase().includes("task") || payload.toLowerCase().includes("schedule")) {
              await fetchScheduleData()
              await fetchAtRiskTasks()
            }

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
    [selectedDate, filteredBlocks, atRiskTasks, scheduleBlocks, fetchScheduleData, fetchAtRiskTasks]
  )

  const handleGenerateSchedule = () => {
    handleActionIntent("summarize-week")
    // Refresh schedule after generation
    setTimeout(() => {
      void fetchScheduleData()
      void fetchAtRiskTasks()
    }, 1000)
  }
  
  const handleAddTask = () => handleActionIntent("nl-create")
  const handlePasteSyllabus = () => handleActionIntent("parse-syllabus")

  const handleSelectAtRisk = (taskId?: string) => {
    if (!taskId) return
    // Find the task and navigate to it
    const task = atRiskTasks.find((t) => t.id === taskId)
    if (!task) return
    
    // Set the date to the task's due date
    setSelectedDate(new Date(task.dueDate))
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
                    onClick={() => handleSelectAtRisk(task.id)}
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
            {loading ? (
              <div className="flex h-96 items-center justify-center text-muted-foreground">
                Loading schedule...
              </div>
            ) : (
              <DayView
                selectedDate={selectedDate}
                viewMode={viewMode}
                blocks={filteredBlocks.map(block => ({
                  ...block,
                  course: block.course || undefined
                }))}
                onChangeDate={setSelectedDate}
                onChangeView={setViewMode}
                onToday={() => setSelectedDate(startOfToday())}
                onRegenerate={handleGenerateSchedule}
                onBlockClick={handleBlockClick}
                highlightedBlockId={highlightedBlockId}
                onBlankSlotRequest={handleBlankSlot}
              />
            )}
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
