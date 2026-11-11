-- Reconcile historical customer-design-number migrations without changing Design rows.
-- A legacy database may still expose this as either a UNIQUE constraint or index.
ALTER TABLE "Design" DROP CONSTRAINT IF EXISTS "Design_designNo_key";
DROP INDEX IF EXISTS "Design_designNo_key";

-- Remove the redundant reversed index introduced by an earlier migration.
DROP INDEX IF EXISTS "Design_designNo_customerId_key";

-- Enforce the schema's intended customer-scoped uniqueness.
CREATE UNIQUE INDEX IF NOT EXISTS "Design_customerId_designNo_key"
  ON "Design" ("customerId", "designNo");
