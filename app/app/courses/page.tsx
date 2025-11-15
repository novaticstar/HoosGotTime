import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import { ensureUserProfile } from "@/lib/user"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type CourseWithMeetings = Awaited<ReturnType<typeof prisma.course.findMany>>[number] & {
  meetings: Array<{
    id: string
    dayOfWeek: number
    startTime: string
    endTime: string
    building: string
  }>
}

async function createCourse(formData: FormData) {
  "use server"
  const user = await requireUser()
  await ensureUserProfile(user.id, user.email)

  await prisma.course.create({
    data: {
      userId: user.id,
      name: String(formData.get("name")),
      code: String(formData.get("code")),
      difficulty: (formData.get("difficulty") as "easy" | "medium" | "hard") ?? "medium",
    },
  })

  revalidatePath("/app/courses")
}

async function addMeeting(formData: FormData) {
  "use server"
  const courseId = String(formData.get("courseId"))
  await prisma.classMeeting.create({
    data: {
      courseId,
      dayOfWeek: Number(formData.get("day")) ?? 0,
      startTime: String(formData.get("startTime")),
      endTime: String(formData.get("endTime")),
      building: String(formData.get("building")),
    },
  })

  revalidatePath("/app/courses")
}

export default async function CoursesPage() {
  const user = await requireUser()
  await ensureUserProfile(user.id, user.email)
  const courses = (await prisma.course.findMany({
    where: { userId: user.id },
    include: { meetings: true },
    orderBy: { name: "asc" },
  })) as CourseWithMeetings[]

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Add a course</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCourse} className="grid gap-4 sm:grid-cols-4">
            <input name="name" placeholder="Course name" className="rounded-md border px-3 py-2" required />
            <input name="code" placeholder="CS 2150" className="rounded-md border px-3 py-2" required />
            <select name="difficulty" className="rounded-md border px-3 py-2">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <Button type="submit">Add course</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
  {courses.map((course: CourseWithMeetings) => (
          <Card key={course.id}>
            <CardHeader>
              <CardTitle>{course.name}</CardTitle>
              <p className="text-sm text-slate-500">{course.code} · {course.difficulty}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs uppercase text-slate-500">Meetings</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                  {course.meetings.map((meeting: CourseWithMeetings["meetings"][number]) => (
                    <li key={meeting.id}>
                      {weekdays[meeting.dayOfWeek]} · {meeting.startTime}–{meeting.endTime} @ {meeting.building}
                    </li>
                  ))}
                  {course.meetings.length === 0 && <li>No meetings yet</li>}
                </ul>
              </div>
              <form action={addMeeting} className="grid gap-2 rounded-md border p-3 text-sm">
                <input type="hidden" name="courseId" value={course.id} />
                <select name="day" className="rounded-md border px-2 py-1">
                  {weekdays.map((day, idx) => (
                    <option key={day} value={idx}>
                      {day}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input name="startTime" type="time" className="w-full rounded-md border px-2 py-1" required />
                  <input name="endTime" type="time" className="w-full rounded-md border px-2 py-1" required />
                </div>
                <input name="building" placeholder="Thornton" className="rounded-md border px-2 py-1" />
                <Button type="submit" variant="outline">
                  Add meeting
                </Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]