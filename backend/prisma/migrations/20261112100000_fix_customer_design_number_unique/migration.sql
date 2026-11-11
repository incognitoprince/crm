-- Ensure design numbers are unique per customer, not globally.
-- Drop the legacy single-column unique index/constraint if it remains on an upgraded database.
ALTER TABLE "Design" DROP CONSTRAINT IF EXISTS "Design_designNo_key";
DROP INDEX IF EXISTS "Design_designNo_key";

-- Recreate the intended customer-scoped uniqueness rule.
CREATE UNIQUE INDEX IF NOT EXISTS "Design_customerId_designNo_key"
  ON "Design" ("customerId", "designNo");
