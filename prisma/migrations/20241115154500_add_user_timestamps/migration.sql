-- Ensure User timestamps and timezone columns exist to match Prisma schema
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "timeZone" TEXT DEFAULT 'America/New_York';

-- Backfill any null values
UPDATE "User" SET "createdAt" = CURRENT_TIMESTAMP WHERE "createdAt" IS NULL;
UPDATE "User" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "updatedAt" IS NULL;
UPDATE "User" SET "timeZone" = 'America/New_York' WHERE "timeZone" IS NULL OR "timeZone" = '';

-- Enforce NOT NULL constraints and defaults
ALTER TABLE "User"
  ALTER COLUMN "createdAt" SET NOT NULL,
  ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "User"
  ALTER COLUMN "updatedAt" SET NOT NULL,
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "User"
  ALTER COLUMN "timeZone" SET NOT NULL,
  ALTER COLUMN "timeZone" SET DEFAULT 'America/New_York';
