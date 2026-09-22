# Architecture

## Style

Modular monolith. One deployable system. Clear module boundaries inside one backend and one frontend.

## Runtime topology

```
Client
  → Nginx (:80)
      → frontend (static React PWA)
      → backend (/api/* Express)
          → PostgreSQL
```

Compose services: `frontend`, `backend`, `postgres`, `nginx`.

## Request flow (Phase 1)

1. Browser loads the React app from Nginx → frontend container.
2. App calls `GET /api/health`.
3. Nginx proxies `/api/` to the backend.
4. Backend checks process liveness and runs `SELECT 1` against PostgreSQL.

## Backend layout

`backend/src/` — `config`, `controllers`, `services`, `routes`, `middleware`, `validators`, `utils`.

Prisma lives in `backend/prisma/`.

## Frontend layout

`frontend/src/` — `components`, `pages`, `layouts`, `hooks`, `services`, `types`, `utils`.

## Logging

Structured JSON logs (Pino). Do not log passwords, tokens, or secrets.

## Future production

Cloudflare → HTTPS → Nginx → Docker Compose on a single Ubuntu VPS.

Still one monolith. Still no Kubernetes.
