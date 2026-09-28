-- Targeted one-time repair for legacy demo data.
-- Restores only customer rows referenced by existing orders/invoices.
-- Safe to re-run: existing customer IDs are left unchanged.

INSERT INTO "Customer" ("id","customerNo","name","phone","shopId","createdAt","updatedAt")
VALUES
  ('demo-cust-003','CUST-1003','Abdullah Al-Rashid','+965 5000 1003','demo-shop-salmiya',NOW(),NOW()),
  ('demo-cust-006','CUST-1006','Fahad Al-Otaibi','+965 5000 1006','demo-shop-hawally',NOW(),NOW()),
  ('demo-cust-007','CUST-1007','Salem Al-Ajmi','+965 5000 1007','demo-shop-salmiya',NOW(),NOW()),
  ('demo-cust-012','CUST-1012','Turki Al-Shammari','+965 5000 1012','demo-shop-farwaniya',NOW(),NOW())
ON CONFLICT ("id") DO NOTHING;

SELECT id, "customerNo", name
FROM "Customer"
WHERE id IN ('demo-cust-003','demo-cust-006','demo-cust-007','demo-cust-012')
ORDER BY id;
