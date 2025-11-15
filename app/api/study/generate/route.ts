import { NextRequest, NextResponse } from "next/server"
import { anthropic } from "@/lib/claude"
import { studyContentPrompt } from "@/lib/ai/prompts"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const { task, materialText } = await req.json()

  if (!task) {
    return NextResponse.json({ error: "task payload is required" }, { status: 400 })
  }

  const prompt = studyContentPrompt(task, materialText)

  const msg = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2048,
    temperature: 0.4,
    messages: [{ role: "user", content: prompt }],
  })

  const raw = msg.content[0]?.type === "text" ? msg.content[0].text : ""
  try {
    const parsed = JSON.parse(raw)

    if (task?.id) {
      const payloads = [
        { type: "study_plan", content: parsed.study_plan },
        { type: "flashcards", content: parsed.flashcards },
        { type: "quiz", content: parsed.practice_questions },
      ]

      await prisma.studyContent.createMany({
        data: payloads.map((entry) => ({
          taskId: task.id,
          type: entry.type as "study_plan" | "flashcards" | "quiz",
          contentJson: JSON.stringify(entry.content ?? {}),
          model: "claude-3-5-sonnet-20241022",
        })),
      })
    }

    return NextResponse.json(parsed)
  } catch (error) {
    console.error("Study JSON parse error", error, raw)
    return NextResponse.json({ error: "Bad JSON" }, { status: 500 })
  }
}