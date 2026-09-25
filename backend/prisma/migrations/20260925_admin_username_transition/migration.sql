-- Safe upgrade from the original OWNER/email-based users to ADMIN/username-based users.
-- This migration is intentionally idempotent because the project previously used
-- prisma db push without a migration history.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'UserRole'
      AND e.enumlabel = 'OWNER'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'UserRole'
      AND e.enumlabel = 'ADMIN'
  ) THEN
    ALTER TYPE "UserRole" RENAME VALUE 'OWNER' TO 'ADMIN';
  END IF;
END $$;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "username" TEXT;

UPDATE "User"
SET "username" = CASE
  WHEN "email" = 'owner@tailoring.local' THEN 'admin'
  WHEN "email" = 'staff@tailoring.local' THEN 'staff'
  ELSE LOWER(REPLACE("name", ' ', '.'))
END
WHERE "username" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key"
  ON "User" ("username");
