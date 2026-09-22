# Database

PostgreSQL 16 is the system of record for Tailoring CRM.

## Local container

Compose starts Postgres with credentials from `.env`.

Health check:

```bash
docker compose exec postgres pg_isready -U tailoring -d tailoring_crm
```

## Prisma

The Prisma schema lives in `backend/prisma/`. Phase 1 only verifies connectivity (`SELECT 1`). Domain models are added in Phase 2.

Optional SQL placed in `database/init/` runs once on a fresh volume via `/docker-entrypoint-initdb.d`.
