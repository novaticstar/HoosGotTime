import { NextRequest, NextResponse } from "next/server"
import { anthropic, CLAUDE_MODELS } from "@/lib/claude"
import { buildTaskParserPrompt } from "@/lib/ai/prompts"
import { requireUser } from "@/lib/auth"
import { ensureUserProfile } from "@/lib/user"
import { prisma } from "@/lib/prisma"

type TaskTypeValue = "homework" | "exam" | "project" | "reading" | "quiz" | "other" | "life"

type ParsedTask = {
  title: string
  due_date?: string
  estimated_minutes?: number
  type?: TaskTypeValue
  priority?: number
  notes?: string
}

export async function POST(req: NextRequest) {
  const { text, defaultDueDate, save } = await req.json()

  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 })
  }

  const fallback = defaultDueDate ?? new Date().toISOString().slice(0, 10)
  const prompt = buildTaskParserPrompt(text)

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    temperature: 0.4,
    messages: [{ role: "user", content: prompt }],
  })

  const raw = msg.content[0]?.type === "text" ? msg.content[0].text : ""
  try {
    const parsedTasks = JSON.parse(raw) as ParsedTask[]

    if (save) {
      const supabaseUserId = await requireUser()
      await ensureUserProfile(supabaseUserId, supabaseUserId)

      const user = await prisma.user.findUnique({
        where: { supabaseId: supabaseUserId }
      })

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      const created = await Promise.all(
        parsedTasks.map((task) =>
          prisma.task.create({
            data: {
              userId: user.id,
              title: task.title,
              type: task.type ?? "other",
              dueAt: new Date(task.due_date ?? fallback),
              estimatedMinutes: task.estimated_minutes ?? 90,
              priority: task.priority ?? 5,
              notes: task.notes,
              status: "PENDING",
              createdFrom: "nl_input",
            },
          })
        )
      )

      return NextResponse.json({ tasks: parsedTasks, saved: created })
    }

    return NextResponse.json({ tasks: parsedTasks })
  } catch (error) {
    console.error("NL tasks parse error", error, raw)
    return NextResponse.json({ error: "Bad JSON" }, { status: 500 })
  }
}