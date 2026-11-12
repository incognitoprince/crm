-- Replace the former global design-number uniqueness with customer-scoped uniqueness.
ALTER TABLE "Design" DROP CONSTRAINT IF EXISTS "Design_designNo_key";
DROP INDEX IF EXISTS "Design_designNo_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Design_customerId_designNo_key" ON "Design" ("customerId", "designNo");
