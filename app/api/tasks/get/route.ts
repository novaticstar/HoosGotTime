import { NextRequest, NextResponse } from "next/server"
import { getPendingTasks, getAtRiskTasks } from "@/lib/agentData"
import { requireUser } from "@/lib/auth"
import { ensureUserProfile } from "@/lib/user"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const atRiskOnly = searchParams.get('atRiskOnly') === 'true'

  const user = await requireUser()
  await ensureUserProfile(user.id, user.email)

  if (atRiskOnly) {
    const tasks = await getAtRiskTasks(user.id)
    return NextResponse.json({ tasks })
  } else {
    const tasks = await getPendingTasks(user.id)
    return NextResponse.json({ tasks })
  }
}
