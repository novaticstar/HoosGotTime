import { NextRequest, NextResponse } from "next/server"
import { getUserCoursesWithMeetings } from "@/lib/agentData"
import { requireUser } from "@/lib/auth"
import { ensureUserProfile } from "@/lib/user"

export async function GET(req: NextRequest) {
  const supabaseUserId = await requireUser()
  await ensureUserProfile(supabaseUserId, supabaseUserId)

  const courses = await getUserCoursesWithMeetings(supabaseUserId)
  return NextResponse.json({ courses })
}
