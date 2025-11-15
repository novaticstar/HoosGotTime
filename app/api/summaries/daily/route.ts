import { NextRequest, NextResponse } from "next/server"
import { anthropic } from "@/lib/claude"
import { getScheduleForDate, getEatingStats, getAtRiskTasks } from "@/lib/agentData"
import { dailySummaryPrompt } from "@/lib/ai/prompts"

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

  const prompt = dailySummaryPrompt({ date, schedule, eatingStats, atRiskTasks })

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 512,
    temperature: 0.6,
    messages: [{ role: "user", content: prompt }],
  })

  const text = msg.content[0]?.type === "text" ? msg.content[0].text : ""
  return NextResponse.json({ summary: text })
}