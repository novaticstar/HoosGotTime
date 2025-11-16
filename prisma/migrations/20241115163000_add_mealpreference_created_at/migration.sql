-- Ensure MealPreference createdAt column exists per Prisma schema
ALTER TABLE "MealPreference"
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- Backfill existing records
UPDATE "MealPreference"
SET "createdAt" = COALESCE("createdAt", CURRENT_TIMESTAMP);

-- Enforce NOT NULL + default
ALTER TABLE "MealPreference"
  ALTER COLUMN "createdAt" SET NOT NULL,
  ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;
