import { NextRequest, NextResponse } from "next/server"
import { anthropic } from "@/lib/claude"

export async function POST(req: NextRequest) {
  const { text, defaultDueDate } = await req.json()

  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 })
  }

  const fallback = defaultDueDate ?? new Date().toISOString().slice(0, 10)
  const prompt = `
You convert a student's free-text plan into structured tasks.

Input:
"""${text}"""

For each distinct task, output:
- title
- type: "homework" | "exam" | "project" | "reading" | "life"
- estimated_minutes: integer, rough guess based on text
- due_date: YYYY-MM-DD (use mentioned date; otherwise fallback to ${fallback})

Return ONLY a JSON array.
`

  const msg = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    temperature: 0.4,
    messages: [{ role: "user", content: prompt }],
  })

  const raw = msg.content[0]?.type === "text" ? msg.content[0].text : ""
  try {
    const tasks = JSON.parse(raw)
    return NextResponse.json({ tasks })
  } catch (error) {
    console.error("NL tasks parse error", error, raw)
    return NextResponse.json({ error: "Bad JSON" }, { status: 500 })
  }
}