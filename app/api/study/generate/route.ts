import { NextRequest, NextResponse } from "next/server"
import { anthropic } from "@/lib/claude"

export async function POST(req: NextRequest) {
  const { task, materialText } = await req.json()

  if (!task) {
    return NextResponse.json({ error: "task payload is required" }, { status: 400 })
  }

  const prompt = `
You are a study coach for a busy university student.

Given:
Task:
${JSON.stringify(task, null, 2)}

Source material:
"""${materialText || "N/A"}"""

Create:
1. A structured study plan.
2. 8 flashcards.
3. 5 practice questions.

Output JSON ONLY:

{
  "study_plan": {
    "overview": "...",
    "sessions": [
      { "title": "...", "duration_minutes": 45, "focus": "..." }
    ]
  },
  "flashcards": [
    { "question": "...", "answer": "..." }
  ],
  "practice_questions": [
    { "question": "...", "answer": "...", "explanation": "..." }
  ]
}
`

  const msg = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2048,
    temperature: 0.4,
    messages: [{ role: "user", content: prompt }],
  })

  const raw = msg.content[0]?.type === "text" ? msg.content[0].text : ""
  try {
    const parsed = JSON.parse(raw)
    return NextResponse.json(parsed)
  } catch (error) {
    console.error("Study JSON parse error", error, raw)
    return NextResponse.json({ error: "Bad JSON" }, { status: 500 })
  }
}