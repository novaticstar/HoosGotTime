BEGIN;

-- ==================================================================
-- Ensure core User fields are present and properly constrained
-- ==================================================================
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "supabaseId" TEXT,
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "timeZone" TEXT DEFAULT 'America/New_York';

UPDATE "User"
SET "supabaseId" = COALESCE("supabaseId", "id"),
    "createdAt" = COALESCE("createdAt", CURRENT_TIMESTAMP),
    "updatedAt" = COALESCE("updatedAt", CURRENT_TIMESTAMP),
    "timeZone" = CASE WHEN "timeZone" IS NULL OR "timeZone" = '' THEN 'America/New_York' ELSE "timeZone" END;

ALTER TABLE "User"
  ALTER COLUMN "supabaseId" SET NOT NULL,
  ALTER COLUMN "createdAt" SET NOT NULL,
  ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "updatedAt" SET NOT NULL,
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "timeZone" SET NOT NULL,
  ALTER COLUMN "timeZone" SET DEFAULT 'America/New_York';

CREATE UNIQUE INDEX IF NOT EXISTS "User_supabaseId_key"
  ON "User"("supabaseId");

-- ==================================================================
-- UserSettings auditing columns
-- ==================================================================
ALTER TABLE "UserSettings"
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

UPDATE "UserSettings"
SET "createdAt" = COALESCE("createdAt", CURRENT_TIMESTAMP),
    "updatedAt" = COALESCE("updatedAt", CURRENT_TIMESTAMP);

ALTER TABLE "UserSettings"
  ALTER COLUMN "createdAt" SET NOT NULL,
  ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "updatedAt" SET NOT NULL,
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- ==================================================================
-- Course auditing columns
-- ==================================================================
ALTER TABLE "Course"
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

UPDATE "Course"
SET "createdAt" = COALESCE("createdAt", CURRENT_TIMESTAMP),
    "updatedAt" = COALESCE("updatedAt", CURRENT_TIMESTAMP);

ALTER TABLE "Course"
  ALTER COLUMN "createdAt" SET NOT NULL,
  ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "updatedAt" SET NOT NULL,
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- ==================================================================
-- Task auditing columns
-- ==================================================================
ALTER TABLE "Task"
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "priority" INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS "notes" TEXT;

UPDATE "Task"
SET "createdAt" = COALESCE("createdAt", CURRENT_TIMESTAMP),
    "updatedAt" = COALESCE("updatedAt", CURRENT_TIMESTAMP),
    "priority" = COALESCE("priority", 5);

ALTER TABLE "Task"
  ALTER COLUMN "createdAt" SET NOT NULL,
  ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "updatedAt" SET NOT NULL,
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "priority" SET NOT NULL,
  ALTER COLUMN "priority" SET DEFAULT 5;

-- ==================================================================
-- TaskTimeLog auditing column
-- ==================================================================
ALTER TABLE "TaskTimeLog"
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

UPDATE "TaskTimeLog"
SET "createdAt" = COALESCE("createdAt", CURRENT_TIMESTAMP);

ALTER TABLE "TaskTimeLog"
  ALTER COLUMN "createdAt" SET NOT NULL,
  ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- ==================================================================
-- MealPreference auditing column
-- ==================================================================
ALTER TABLE "MealPreference"
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

UPDATE "MealPreference"
SET "createdAt" = COALESCE("createdAt", CURRENT_TIMESTAMP);

ALTER TABLE "MealPreference"
  ALTER COLUMN "createdAt" SET NOT NULL,
  ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- ==================================================================
-- ScheduleBlock auditing column
-- ==================================================================
ALTER TABLE "ScheduleBlock"
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

UPDATE "ScheduleBlock"
SET "createdAt" = COALESCE("createdAt", CURRENT_TIMESTAMP);

ALTER TABLE "ScheduleBlock"
  ALTER COLUMN "createdAt" SET NOT NULL,
  ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- ==================================================================
-- StudyMaterial auditing column
-- ==================================================================
ALTER TABLE "StudyMaterial"
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

UPDATE "StudyMaterial"
SET "createdAt" = COALESCE("createdAt", CURRENT_TIMESTAMP);

ALTER TABLE "StudyMaterial"
  ALTER COLUMN "createdAt" SET NOT NULL,
  ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- ==================================================================
-- StudyContent auditing column
-- ==================================================================
ALTER TABLE "StudyContent"
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

UPDATE "StudyContent"
SET "createdAt" = COALESCE("createdAt", CURRENT_TIMESTAMP);

ALTER TABLE "StudyContent"
  ALTER COLUMN "createdAt" SET NOT NULL,
  ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- ==================================================================
-- UserMultiplier auditing columns
-- ==================================================================
ALTER TABLE "UserMultiplier"
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

UPDATE "UserMultiplier"
SET "createdAt" = COALESCE("createdAt", CURRENT_TIMESTAMP),
    "updatedAt" = COALESCE("updatedAt", CURRENT_TIMESTAMP);

ALTER TABLE "UserMultiplier"
  ALTER COLUMN "createdAt" SET NOT NULL,
  ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "updatedAt" SET NOT NULL,
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

COMMIT;
