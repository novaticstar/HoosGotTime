import { NextRequest, NextResponse } from "next/server"
import { getUserCoursesWithMeetings } from "@/lib/agentData"
import { requireUser } from "@/lib/auth"
import { ensureUserProfile } from "@/lib/user"

export async function GET(req: NextRequest) {
  const user = await requireUser()
  await ensureUserProfile(user.id, user.email)

  const courses = await getUserCoursesWithMeetings(user.id)
  return NextResponse.json({ courses })
}
