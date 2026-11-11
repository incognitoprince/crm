DROP INDEX IF EXISTS "Design_designNo_key";
CREATE UNIQUE INDEX "Design_designNo_customerId_key" ON "Design"("designNo", "customerId");
