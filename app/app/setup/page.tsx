import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/auth"
import { ensureUserProfile } from "@/lib/user"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type Profile = NonNullable<Awaited<ReturnType<typeof ensureUserProfile>>>
type MealPref = Profile["meals"][number]

async function updateSettings(formData: FormData) {
  "use server"
  const user = await requireUser()
  await ensureUserProfile(user.id, user.email)

  await prisma.userSettings.update({
    where: { userId: user.id },
    data: {
      wakeTime: String(formData.get("wakeTime")),
      sleepTime: String(formData.get("sleepTime")),
      buildingWalkBufferMinutes: Number(formData.get("walkBuffer")) || 10,
      commuteBufferMinutes: Number(formData.get("commuteBuffer")) || 15,
      maxStudyMinutesPerDay: Number(formData.get("maxPerDay")) || 360,
      maxStudyBlockMinutes: Number(formData.get("maxBlock")) || 90,
      timeZone: String(formData.get("timeZone")),
    },
  })

  revalidatePath("/app/setup")
}

async function updateMealPreference(formData: FormData) {
  "use server"
  const id = String(formData.get("mealId"))
  await requireUser()
  await prisma.mealPreference.update({
    where: { id },
    data: {
      earliestTime: String(formData.get("earliestTime")),
      latestTime: String(formData.get("latestTime")),
      typicalDurationMin: Number(formData.get("duration")) || 30,
      importance: Number(formData.get("importance")) || 1,
    },
  })

  revalidatePath("/app/setup")
}

export default async function SetupPage() {
  const user = await requireUser()
  const profile = await ensureUserProfile(user.id, user.email)
  const meals = (profile?.meals ?? []) as MealPref[]

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Daily rhythm</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateSettings} className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
              Wake time
              <input name="wakeTime" defaultValue={profile?.settings?.wakeTime} className="rounded-md border px-3 py-2" type="time" required />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
              Sleep time
              <input name="sleepTime" defaultValue={profile?.settings?.sleepTime} className="rounded-md border px-3 py-2" type="time" required />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
              Walking buffer (min)
              <input name="walkBuffer" defaultValue={profile?.settings?.buildingWalkBufferMinutes} className="rounded-md border px-3 py-2" type="number" min={0} />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
              Commute buffer (min)
              <input name="commuteBuffer" defaultValue={profile?.settings?.commuteBufferMinutes} className="rounded-md border px-3 py-2" type="number" min={0} />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
              Max study minutes per day
              <input name="maxPerDay" defaultValue={profile?.settings?.maxStudyMinutesPerDay} className="rounded-md border px-3 py-2" type="number" min={60} step={30} />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
              Max study block minutes
              <input name="maxBlock" defaultValue={profile?.settings?.maxStudyBlockMinutes} className="rounded-md border px-3 py-2" type="number" min={30} step={15} />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
              Time zone
              <input name="timeZone" defaultValue={profile?.settings?.timeZone} className="rounded-md border px-3 py-2" placeholder="America/New_York" />
            </label>
            <div className="sm:col-span-2">
              <Button type="submit">Save settings</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Meal preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {meals.map((meal) => (
            <form key={meal.id} action={updateMealPreference} className="grid gap-4 rounded-lg border p-4 sm:grid-cols-5">
              <input type="hidden" name="mealId" value={meal.id} />
              <div>
                <p className="text-xs uppercase text-slate-500">Meal</p>
                <p className="font-medium capitalize">{meal.mealType}</p>
              </div>
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
                Earliest
                <input name="earliestTime" type="time" defaultValue={meal.earliestTime} className="rounded-md border px-2 py-1" />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
                Latest
                <input name="latestTime" type="time" defaultValue={meal.latestTime} className="rounded-md border px-2 py-1" />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
                Duration (min)
                <input name="duration" type="number" defaultValue={meal.typicalDurationMin} className="rounded-md border px-2 py-1" />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
                Importance (1-3)
                <input name="importance" type="number" min={1} max={3} defaultValue={meal.importance} className="rounded-md border px-2 py-1" />
              </label>
              <div className="sm:col-span-5">
                <Button type="submit" variant="outline">
                  Update {meal.mealType}
                </Button>
              </div>
            </form>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}