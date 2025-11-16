"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { format } from "date-fns"
import { HelpCircle, MessageSquare, Send, Sparkles } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { cn } from "@/lib/utils"

export type AssistantIntent =
  | "summarize-today"
  | "summarize-week"
  | "parse-syllabus"
  | "nl-create"
  | "study-plan"
  | "describe-now"
  | "free-form"

export interface AssistantActionTrigger {
  id: string
  intent: AssistantIntent
  payload?: string
}

export interface AssistantPanelProps {
  selectedDate: Date
  onRunAction?: (
    intent: AssistantIntent,
    payload?: string,
    conversationHistory?: Array<{ role: string; content: string }>
  ) => Promise<string>
  externalAction?: AssistantActionTrigger | null
  contextualSuggestion?: { label: string; intent: AssistantIntent; payload?: string } | null
}

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

const baseQuickActions: { label: string; intent: AssistantIntent; payload?: string }[] = [
  { label: "Summarize today", intent: "summarize-today" },
  { label: "Plan this week", intent: "summarize-week" },
  { label: "Parse syllabus", intent: "parse-syllabus" },
  { label: "Describe what to do", intent: "describe-now" },
]

export function AssistantPanel({ selectedDate, onRunAction, externalAction, contextualSuggestion }: AssistantPanelProps) {
  const createId = () =>
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I’m keeping an eye on your classes, meals, and study blocks. Ask me to plan your day or drop a syllabus to extract tasks.",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isThinking, setIsThinking] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const lastExternalId = useRef<string | null>(null)

  const quickActions = useMemo(() => {
    const actions = [...baseQuickActions]
    if (contextualSuggestion) {
      actions.push(contextualSuggestion)
    }
    return actions
  }, [contextualSuggestion])

  useEffect(() => {
    if (!externalAction) return
    if (externalAction.id === lastExternalId.current) return
    lastExternalId.current = externalAction.id
    void runIntentFromOutside(externalAction.intent, externalAction.payload)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalAction])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  const appendMessage = (role: Message["role"], content: string) => {
    setMessages((prev) => [...prev, { id: createId(), role, content, timestamp: new Date() }])
  }

  const resolveIntent = async (intent: AssistantIntent, payload?: string) => {
    if (onRunAction) {
      // Pass conversation history (excluding the welcome message) to the action handler
      const history = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }))
      return onRunAction(intent, payload, history)
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
    switch (intent) {
      case "summarize-today":
        return `Here's a quick snapshot for ${format(selectedDate, "EEEE")}—classes, meals, and study blocks are spaced to keep energy balanced.`
      case "summarize-week":
        return "Your week leans heavier Tue/Thu. Consider sliding one ECON session to Wednesday to stay ahead."
      case "parse-syllabus":
        return "Paste the syllabus text when you're ready and I'll propose tasks with due dates."
      case "nl-create":
        return "Tell me what needs to get done and I'll draft tasks with time estimates."
      case "study-plan":
        return payload
          ? `I can spin up a study plan for ${payload}. Want spaced 90-minute blocks with flashcards afterward?`
          : "Pick a task and I'll craft a study plan with practice questions."
      case "describe-now":
        return "Right now you have a transition buffer before your next block. Want me to slot a quick win?"
      default:
        return "Got it. I'll keep iterating on your plan."
    }
  }

  const runIntentFromOutside = async (intent: AssistantIntent, payload?: string) => {
    setIsThinking(true)
    appendMessage("assistant", "Working on that…")
    const result = await resolveIntent(intent, payload)
    setMessages((prev) => [
      ...prev.slice(0, -1),
      { id: createId(), role: "assistant", content: result, timestamp: new Date() },
    ])
    setIsThinking(false)
  }

  const handleQuickAction = async (intent: AssistantIntent, payload?: string) => {
    appendMessage("user", baseLabelForIntent(intent))
    await runIntent(intent, payload)
  }

  const runIntent = async (intent: AssistantIntent, payload?: string) => {
    setIsThinking(true)
    const response = await resolveIntent(intent, payload)
    appendMessage("assistant", response)
    setIsThinking(false)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!input.trim()) return
    const text = input.trim()
    appendMessage("user", text)
    setInput("")
    await runIntent("free-form", text)
  }

  return (
    <div className="flex h-full flex-col rounded-xl border bg-white shadow">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">HoosGotTime Assistant</p>
            <p className="text-xs text-muted-foreground">Synced to your schedule</p>
          </div>
        </div>
        <button
          type="button"
          className="text-muted-foreground transition hover:text-foreground"
          aria-label="Assistant tips"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "max-w-[90%] rounded-lg px-3 py-2",
              message.role === "assistant"
                ? "bg-muted text-foreground"
                : "ml-auto bg-brand-600 text-white"
            )}
          >
            <div 
              className={cn(
                "prose prose-sm max-w-none overflow-y-auto",
                message.role === "user" ? "prose-invert max-h-[400px]" : "max-h-[600px]"
              )}
              style={{
                maxHeight: message.content.length > 1000 ? "400px" : "none"
              }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="mb-2 ml-4 list-disc">{children}</ul>,
                  ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal">{children}</ol>,
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                  code: ({ inline, children, ...props }: any) =>
                    inline ? (
                      <code className="rounded bg-slate-100 px-1 py-0.5 text-xs font-mono text-slate-800" {...props}>
                        {children}
                      </code>
                    ) : (
                      <code className="block rounded bg-slate-100 p-2 text-xs font-mono text-slate-800 overflow-x-auto" {...props}>
                        {children}
                      </code>
                    ),
                  pre: ({ children }) => <pre className="mb-2 overflow-x-auto">{children}</pre>,
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  h1: ({ children }) => <h1 className="mb-2 text-lg font-bold">{children}</h1>,
                  h2: ({ children }) => <h2 className="mb-2 text-base font-bold">{children}</h2>,
                  h3: ({ children }) => <h3 className="mb-2 text-sm font-bold">{children}</h3>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
              {format(message.timestamp, "h:mm a")}
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MessageSquare className="h-4 w-4 animate-pulse" />
            Thinking through your plan…
          </div>
        )}
      </div>

      <div className="border-t px-4 py-3">
        <div className="mb-3 flex flex-wrap gap-2 text-[11px]">
          {quickActions.map((action) => (
            <button
              key={`${action.intent}-${action.label}`}
              type="button"
              onClick={() => handleQuickAction(action.intent, action.payload)}
              className="rounded-full border border-slate-200 px-3 py-1 font-medium text-slate-600 hover:border-slate-300"
            >
              {action.label}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask me to plan your day, add tasks, or study for an exam…"
            className="min-h-[40px] flex-1 resize-none rounded-lg border px-3 py-2 text-sm shadow-sm"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-brand-500"
            disabled={!input.trim()}
          >
            Send <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  )
}

function baseLabelForIntent(intent: AssistantIntent) {
  switch (intent) {
    case "summarize-today":
      return "Summarize today"
    case "summarize-week":
      return "Plan this week"
    case "parse-syllabus":
      return "Parse a syllabus"
    case "nl-create":
      return "Add tasks from natural language"
    case "study-plan":
      return "Help me study"
    case "describe-now":
      return "What should I do now?"
    default:
      return "Assistant action"
  }
}
