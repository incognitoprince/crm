ALTER TABLE "Design" ADD COLUMN IF NOT EXISTS "customerId" TEXT;
CREATE INDEX IF NOT EXISTS "Design_customerId_idx" ON "Design"("customerId");
ALTER TABLE "Design" ADD CONSTRAINT "Design_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
