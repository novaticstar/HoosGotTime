import { NextRequest, NextResponse } from "next/server"
import { anthropic } from "@/lib/claude"

export async function POST(req: NextRequest) {
  const { syllabusText } = await req.json()

  if (!syllabusText) {
    return NextResponse.json({ error: "syllabusText is required" }, { status: 400 })
  }

  const prompt = `
You extract graded work from a college syllabus.

Given this syllabus text, extract graded items (homework, exams, projects, quizzes, major readings).

For each item, output:
- title
- type: "homework" | "exam" | "project" | "quiz" | "reading" | "other"
- due_date: YYYY-MM-DD if known, otherwise null
- weight_percent: number or null

Return ONLY a JSON array. No explanation.

Syllabus:
"""${syllabusText}"""
`

  const msg = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    temperature: 0,
    messages: [{ role: "user", content: prompt }],
  })

  const raw = msg.content[0]?.type === "text" ? msg.content[0].text : ""
  try {
    const tasks = JSON.parse(raw)
    return NextResponse.json({ tasks })
  } catch (error) {
    console.error("Syllabus parse JSON error", error, raw)
    return NextResponse.json({ error: "Failed to parse JSON" }, { status: 500 })
  }
}