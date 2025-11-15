import { NextRequest, NextResponse } from "next/server"
import { addDays, endOfDay, startOfDay } from "date-fns"
import { anthropic } from "@/lib/claude"
import { prisma } from "@/lib/prisma"
import { weeklySummaryPrompt } from "@/lib/ai/prompts"
import { getAtRiskTasks } from "@/lib/agentData"

export async function POST(req: NextRequest) {
  const { userId, startDate } = await req.json()

  if (!userId || !startDate) {
    return NextResponse.json({ error: "userId and startDate are required" }, { status: 400 })
  }

  const start = startOfDay(new Date(startDate))
  const end = endOfDay(addDays(start, 6))

  const [blocks, atRiskTasks] = await Promise.all([
    prisma.scheduleBlock.findMany({
      where: { userId, startAt: { gte: start, lte: end } },
      orderBy: { startAt: "asc" },
    }),
    getAtRiskTasks(userId, startDate),
  ])

  const prompt = weeklySummaryPrompt({
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    blocks,
    atRiskTasks,
  })

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 512,
    temperature: 0.5,
    messages: [{ role: "user", content: prompt }],
  })

  const text = msg.content[0]?.type === "text" ? msg.content[0].text : ""
  return NextResponse.json({ summary: text })
}