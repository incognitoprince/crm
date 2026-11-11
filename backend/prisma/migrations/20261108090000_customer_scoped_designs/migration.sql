-- The column and index may already exist on a database bootstrapped before
-- migration history was recorded. Keep this migration safe in that case.
ALTER TABLE "Design" ADD COLUMN IF NOT EXISTS "customerId" TEXT;
CREATE INDEX IF NOT EXISTS "Design_customerId_idx" ON "Design"("customerId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Design_customerId_fkey'
      AND conrelid = 'public."Design"'::regclass
      AND contype = 'f'
  ) THEN
    ALTER TABLE "Design"
      ADD CONSTRAINT "Design_customerId_fkey"
      FOREIGN KEY ("customerId") REFERENCES "Customer"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
