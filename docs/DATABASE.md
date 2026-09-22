# Database

PostgreSQL 16 + Prisma.

## Phase 1

No domain tables yet. Connectivity is verified with `SELECT 1` via Prisma.

Datasource URL comes from `DATABASE_URL`.

## Planned entities (Phase 2+)

User, Role, Permission, Shop, Customer, MeasurementTemplate, CustomerMeasurement, Design, GarmentType, Master, Order, OrderItem, OrderStatusHistory, Payment, Invoice, File, AuditLog.

Conventions for later phases:

- Foreign keys
- Indexes on search and FK columns
- `createdAt` / `updatedAt`
- Migrations committed in git
- Transactions for financial writes

Avoid unnecessary complexity. Prefer clear tables over clever abstraction.
