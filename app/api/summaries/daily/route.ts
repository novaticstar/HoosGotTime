import { NextRequest, NextResponse } from "next/server"
import { anthropic } from "@/lib/claude"
import { getScheduleForDate, getEatingStats, getAtRiskTasks } from "@/lib/agentData"

export async function POST(req: NextRequest) {
  const { userId, date } = await req.json()

  if (!userId || !date) {
    return NextResponse.json({ error: "userId and date are required" }, { status: 400 })
  }

  const [schedule, eatingStats, atRiskTasks] = await Promise.all([
    getScheduleForDate(userId, date),
    getEatingStats(userId, date),
    getAtRiskTasks(userId, date),
  ])

  const prompt = `
You are a concise, supportive academic coach.

Date: ${date}

Schedule blocks:
${JSON.stringify(schedule, null, 2)}

Eating stats:
${JSON.stringify(eatingStats, null, 2)}

At-risk tasks:
${JSON.stringify(atRiskTasks, null, 2)}

Write a 3–6 sentence morning briefing that:
- Mentions key classes and study blocks.
- Calls out where they can/should eat (especially long gaps).
- Flags at-risk tasks with one clear action.
- Tone: practical, calm, no guilt-tripping.

Plain text only.
`

  const msg = await anthropic.messages.create({
    model: "claude-3-5-haiku-20241022",
    max_tokens: 512,
    temperature: 0.6,
    messages: [{ role: "user", content: prompt }],
  })

  const text = msg.content[0]?.type === "text" ? msg.content[0].text : ""
  return NextResponse.json({ summary: text })
}