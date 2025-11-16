import { NextRequest, NextResponse } from "next/server"
import { getScheduleForDate, getScheduleForDateRange } from "@/lib/agentData"
import { requireUser } from "@/lib/auth"
import { ensureUserProfile } from "@/lib/user"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  const user = await requireUser()
  await ensureUserProfile(user.id, user.email)

  if (startDate && endDate) {
    // Get schedule for date range
    const blocks = await getScheduleForDateRange(
      user.id,
      new Date(startDate),
      new Date(endDate)
    )
    return NextResponse.json({ blocks })
  } else if (date) {
    // Get schedule for single date
    const blocks = await getScheduleForDate(user.id, new Date(date))
    return NextResponse.json({ blocks })
  } else {
    // Get schedule for today
    const blocks = await getScheduleForDate(user.id, new Date())
    return NextResponse.json({ blocks })
  }
}
