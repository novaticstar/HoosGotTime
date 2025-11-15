# HoosGotTime – Claude-backed UVA Scheduler

HoosGotTime is an AI agent that combines deterministic scheduling with Claude 3.5 guidance to keep busy UVA students on top of their classes, meals, and deep work. Upload syllabi, jot down plans in natural language, and receive tailored study plans, flashcards, quizzes, and summaries that adapt as you log time.

## 🧱 High-level architecture

| Layer | Tech | Responsibilities |
| --- | --- | --- |
| Frontend | Next.js (App Router) · TypeScript · Tailwind · shadcn/ui | Setup / Tasks / Schedule / Study experiences, optimistic state, fetch API routes |
| Backend | Next server (route handlers + server actions) | CRUD via Prisma, deterministic scheduler, multiplier adjustments |
| Database | Postgres (Prisma schema in `prisma/schema.prisma`) | Users, settings, courses, tasks, schedules, study content |
| AI Agent | Claude 3.5 via `@anthropic-ai/sdk` | Syllabus parsing, NL task structuring, study plan generation, daily/weekly summaries |
| Infra (later) | Cron/background worker | Regenerate schedules, send summaries, sync calendars |

### Agent mental model

- **Ingest / Understand**: `parseSyllabus`, `parseNLTasks`
- **Plan**: `estimateStudyTime`, `buildSchedule`
- **Guide**: `generateStudyPlan`, `dailySummary`, `weeklySummary`
- **Learn**: `updateMultiplierForTask`

Claude only handles the understanding/guidance flows; planning and learning are deterministic functions in `/lib`.

## 🔑 Environment & Supabase

1. Duplicate `.env.example` to `.env.local`.
2. Fill in:
	- `ANTHROPIC_API_KEY` – Claude 3.5 key from Anthropic.
	- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` – found in Supabase project settings (these ship to the browser).
	- `SUPABASE_SERVICE_ROLE_KEY` (optional) – only needed for future cron jobs or server actions that require elevated access.
	- `DATABASE_URL` – **use the Supabase PgBouncer string** (port `6543`) with `pgbouncer=true&connection_limit=1`. This is what Prisma/Next server use at runtime.
	- `DIRECT_URL` – Supabase direct connection string (port `5432`). Prisma migrations read this when they need non-pooled access.
	- `ALLOW_DEMO_USER` (optional) – set to `1` only if you explicitly want to bypass Supabase auth and use the built-in demo account for local UI previews.

`lib/claude.ts` throws if `ANTHROPIC_API_KEY` is missing. The Supabase helpers in `utils/supabase/*` throw when the public URL/anon key are absent, so the app fails fast instead of silently missing data.

> **Heads up:** Supabase PgBouncer sometimes causes `prisma db push` to hang. If that happens, run `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > supabase-init.sql` and paste the generated SQL into the Supabase SQL editor. Once the tables exist, you can delete the temporary SQL file.

## 🗄️ Prisma schema snapshot

`prisma/schema.prisma` encodes the models described in the product brief: `User`, `UserSettings`, `Course`, `ClassMeeting`, `Task`, `TaskTimeLog`, `MealPreference`, `ScheduleBlock`, `StudyMaterial`, `StudyContent`, `UserMultiplier` plus enums for difficulty, task type, etc. Run `npm run db:push` to sync to Postgres, then `npx prisma studio` to explore data.

## 🛠️ Key libs & directories

- `lib/claude.ts` – authenticated Anthropic client (server-only)
- `lib/prisma.ts` – singleton Prisma client
- `lib/scheduler.ts` – deterministic day-grid scaffold with TODOs for buffers/meals/study placement
- `lib/multipliers.ts` – smoothing algorithm that adjusts `UserMultiplier` on task completion
- `lib/agentData.ts` – placeholder helpers powering daily summary prompts
- `app/api/*` – Claude-powered APIs for syllabus parsing, NL task creation, study assets, and eating-aware daily summaries
- `components/ui/*` – shadcn-inspired primitives (Button, Badge, Card)
- `utils/supabase/server.ts` & `client.ts` – SSR/browser clients wired to Supabase cookies
- `middleware.ts` – keeps Supabase auth cookies in sync via PgBouncer-safe headers

## 📄 Frontend flow outline

Pages to build next (see `/app/page.tsx` for the visual roadmap):

- `/setup` – collect wake/sleep, meal windows, walking/parking buffers
- `/tasks` – manual adds, syllabus ingest, NL magic prompt
- `/schedule` – weekly grid with regenerate button + “Today” sidebar (classes, study blocks, meals, daily summary)
- `/study/[taskId]` – Claude study plan, flashcards, quiz viewer

## 🚀 Development phases

1. **Phase 0 – Boot**: Next.js + Tailwind + Prisma + auth + Claude wiring
2. **Phase 1 – Core Scheduling**: Implement scheduler + schedule UI + meal/buffer logic
3. **Phase 2 – AI Ingestion**: Syllabus & NL task APIs + confirmation UI + DB persistence
4. **Phase 3 – Study Coach**: Study material ingestion + `/api/study/generate` + study page
5. **Phase 4 – Summaries & Learning**: Daily/weekly summaries + multiplier updates on completion
6. **Phase 5 – Polish & integrations**: Eating insights, Google Calendar sync, UVA-specific travel defaults

## 🧑‍💻 Local development

```powershell
cd "C:\Users\mattm\OneDrive\Documents\github-repositories\HoosGotTime"
npm install
npm run db:push   # ensure DATABASE_URL is set locally
npm run dev
```

Optional quality gates:

```powershell
npm run lint
npm run typecheck
npm run build
```

## 🧭 Next steps

- Flesh out the scheduler TODOs (sleep/class/meal blocking + study chunk placement)
- Add UI flows for setup/tasks/schedule/study pages
- Wire task ingestion responses into Prisma mutations and schedule regeneration
- Connect cron/background worker for scheduled summaries
- Harden Claude prompts (guardrails, retries, schema validation)

Contributions and ideas are welcome—let’s make HoosGotTime the definitive planning buddy for UVA students.
