# API

REST JSON API under `/api`.

## Conventions

- JSON request/response bodies
- Standard HTTP status codes
- Central error handler (`code`, `message`; no stack traces to clients in production)
- Validation on write endpoints (from Phase 2)

## Phase 1 endpoints

### `GET /api/health/live`

Liveness. Process is up. Does not query the database.

**200**

```json
{
  "status": "ok",
  "service": "tailoring-crm-api",
  "timestamp": "2026-09-22T07:00:00.000Z",
  "uptimeSeconds": 12
}
```

### `GET /api/health/ready`

Readiness. Database `SELECT 1` must succeed.

**200** when Postgres is reachable  
**503** when it is not

### `GET /api/health`

Combined status used by the frontend shell.

**200** `status: "ok"` when DB is healthy  
**503** `status: "degraded"` when DB is not

```json
{
  "status": "ok",
  "service": "tailoring-crm-api",
  "version": "0.1.0",
  "timestamp": "2026-09-22T07:00:00.000Z",
  "uptimeSeconds": 12,
  "checks": {
    "database": { "status": "ok", "latencyMs": 3 }
  }
}
```

## Planned route groups

`/api/auth`, `/api/users`, `/api/shops`, `/api/customers`, `/api/measurements`, `/api/designs`, `/api/masters`, `/api/orders`, `/api/payments`, `/api/invoices`, `/api/reports`
