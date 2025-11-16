-- Add the supabaseId column if it does not already exist
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "supabaseId" TEXT;

-- Backfill existing records so supabaseId mirrors the primary id
UPDATE "User"
SET "supabaseId" = "id"
WHERE "supabaseId" IS NULL;

-- Ensure the column is required going forward
ALTER TABLE "User"
  ALTER COLUMN "supabaseId" SET NOT NULL;

-- Enforce uniqueness for supabaseId values
CREATE UNIQUE INDEX IF NOT EXISTS "User_supabaseId_key"
  ON "User"("supabaseId");
