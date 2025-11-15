import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import { ensureUserProfile } from "@/lib/user"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { NLTaskWidget } from "@/components/tasks/nl-task-widget"
import { SyllabusWidget } from "@/components/tasks/syllabus-widget"

type TaskWithCourse = Awaited<ReturnType<typeof prisma.task.findMany>>[number] & {
  course?: {
    id: string
    name: string | null
    code: string | null
  } | null
}

type CourseOption = Awaited<ReturnType<typeof prisma.course.findMany>>[number]

const TASK_TYPES = ["homework", "exam", "project", "reading", "quiz", "other", "life"] as const
const dueFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", weekday: "short" })
const completedFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" })

async function createManualTask(formData: FormData) {
  "use server"
  const user = await requireUser()
  await ensureUserProfile(user.id, user.email)

  const title = String(formData.get("title"))
  const dueDate = (formData.get("dueAt") as string) || new Date().toISOString().slice(0, 10)
  const courseId = formData.get("courseId") ? String(formData.get("courseId")) : null
  const estimatedMinutes = Number(formData.get("estimatedMinutes")) || 90
  const type = (formData.get("type") as (typeof TASK_TYPES)[number]) ?? "other"

  await prisma.task.create({
    data: {
      userId: user.id,
      courseId,
      title,
      description: String(formData.get("description") ?? ""),
      type,
      dueAt: new Date(`${dueDate}T23:59:00`),
      estimatedMinutes,
      status: "pending",
      createdFrom: "manual",
    },
  })

  revalidatePath("/app/tasks")
}

async function markTaskComplete(formData: FormData) {
  "use server"
  const taskId = String(formData.get("taskId"))
  const user = await requireUser()
  await ensureUserProfile(user.id, user.email)

  await prisma.task.update({
    where: { id: taskId, userId: user.id },
    data: { status: "completed", completedAt: new Date() },
  })

  revalidatePath("/app/tasks")
}

export default async function TasksPage() {
  const user = await requireUser()
  await ensureUserProfile(user.id, user.email)

  const [tasks, courses] = await Promise.all([
    prisma.task.findMany({
      where: { userId: user.id },
      include: { course: true },
      orderBy: { dueAt: "asc" },
    }),
    prisma.course.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
  ])

  const typedTasks = tasks as TaskWithCourse[]
  const typedCourses = courses as CourseOption[]

  const openTasks = typedTasks.filter((task: TaskWithCourse) => task.status !== "completed")
  const recentlyCompleted = typedTasks
    .filter((task: TaskWithCourse) => task.status === "completed")
    .slice(0, 5)

  const defaultDueDate = new Date().toISOString().slice(0, 10)

  return (
    <div className="space-y-10">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Add a task manually</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createManualTask} className="space-y-3 text-sm">
              <input name="title" placeholder="Task title" className="w-full rounded-md border px-3 py-2" required />
              <textarea
                name="description"
                placeholder="Optional details"
                className="w-full rounded-md border px-3 py-2"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <select name="type" className="rounded-md border px-3 py-2">
                  {TASK_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <select name="courseId" className="rounded-md border px-3 py-2">
                  <option value="">No course</option>
                  {typedCourses.map((course: CourseOption) => (
                    <option key={course.id} value={course.id}>
                      {course.code} · {course.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="text-xs uppercase text-slate-500">Due date</span>
                  <input type="date" name="dueAt" defaultValue={defaultDueDate} className="rounded-md border px-3 py-2" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs uppercase text-slate-500">Estimate (min)</span>
                  <input
                    type="number"
                    name="estimatedMinutes"
                    defaultValue={90}
                    min={15}
                    step={15}
                    className="rounded-md border px-3 py-2"
                  />
                </label>
              </div>
              <Button type="submit" className="w-full">
                Save task
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Natural language intake</CardTitle>
          </CardHeader>
          <CardContent>
            <NLTaskWidget defaultDueDate={defaultDueDate} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Parse a syllabus snippet</CardTitle>
          </CardHeader>
          <CardContent>
            <SyllabusWidget />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Open tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {openTasks.length === 0 ? (
            <p className="text-sm text-slate-500">Nothing pending—nice work.</p>
          ) : (
            <ul className="space-y-4">
              {openTasks.map((task) => (
                <li key={task.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{task.title}</p>
                    <Badge variant="subtle">{task.type}</Badge>
                    {task.course && (
                      <Badge variant="outline">{task.course.code ?? task.course.name ?? "Course"}</Badge>
                    )}
                    {task.atRisk && (
                      <Badge className="border-orange-300 bg-orange-50 text-orange-700" variant="outline">
                        At risk
                      </Badge>
                    )}
                  </div>
                  {task.description && <p className="mt-1 text-sm text-slate-600">{task.description}</p>}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                    <span>Due {dueFormatter.format(task.dueAt)}</span>
                    <span>
                      {task.estimatedMinutes} min • {task.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <form action={markTaskComplete} className="mt-3">
                    <input type="hidden" name="taskId" value={task.id} />
                    <Button type="submit" size="sm" variant="outline">
                      Mark complete
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {recentlyCompleted.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recently completed</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-slate-600">
              {recentlyCompleted.map((task) => (
                <li key={task.id} className="flex justify-between rounded-md border px-3 py-2">
                  <span>{task.title}</span>
                  <span>{task.completedAt ? completedFormatter.format(task.completedAt) : "just now"}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}