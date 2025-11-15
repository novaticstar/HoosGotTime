import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

const phases = [
  {
    title: "Phase 0 – Boot",
    items: ["Auth + onboarding", "Prisma/Postgres schema", "Claude client wiring"],
  },
  {
    title: "Phase 1 – Core Scheduling",
    items: ["Deterministic scheduler", "Schedule UI", "Meals + buffers"],
  },
  {
    title: "Phase 2 – AI Ingestion",
    items: ["Syllabus parser", "NL task creator", "Task confirmation flow"],
  },
  {
    title: "Phase 3 – Study Coach",
    items: ["Material ingestion", "Study plan/flashcards", "Task study view"],
  },
  {
    title: "Phase 4 – Summaries & Learning",
    items: ["Daily/weekly summaries", "Multiplier updates", "Completion UX"],
  },
  {
    title: "Phase 5 – Polish",
    items: ["Eating insights", "Calendar sync", "Campus travel defaults"],
  },
]

const agentTools = [
  {
    name: "parseSyllabus",
    description: "Claude → Task[] from syllabus uploads",
  },
  {
    name: "parseNLTasks",
    description: "Claude → Task[] from natural language",
  },
  {
    name: "estimateStudyTime",
    description: "Heuristics + multipliers",
  },
  {
    name: "buildSchedule",
    description: "Deterministic day-grid packing",
  },
  {
    name: "dailySummary",
    description: "Claude morning brief (eating aware)",
  },
  {
    name: "generateStudyPlan",
    description: "Plan + flashcards + quiz",
  },
]

export default function Home() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12">
      <section className="space-y-6 text-center">
        <Badge className="mx-auto w-fit" variant="outline">
          HoosGotTime · Claude + Deterministic Planner
        </Badge>
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Your UVA-aware study agent
          </h1>
          <p className="max-w-3xl text-lg text-slate-600">
            Upload syllabi, sync calendars, set eating habits, and let Claude 3.5 pair with a deterministic
            scheduler to map classes, meals, buffers, and deep work. Study plans, flashcards, quizzes, and
            summaries keep you ahead of every deadline.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Launch Agent (soon)
            </Button>
            <Button variant="outline" size="lg">
              View Architecture
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {agentTools.map((tool) => (
          <Card key={tool.name}>
            <CardHeader>
              <CardTitle>{tool.name}</CardTitle>
              <CardDescription>{tool.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        {phases.map((phase) => (
          <Card key={phase.title}>
            <CardHeader>
              <CardTitle>{phase.title}</CardTitle>
              <CardDescription>What ships in this slice</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                {phase.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  )
}