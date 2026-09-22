# Tailoring CRM

Modular-monolith CRM for a four-shop tailoring business in Kuwait.

Phase 1 delivers the project foundation: repository layout, documentation, frontend shell, backend health API, PostgreSQL connectivity, and Docker Compose.

## Architecture

```
Internet → Nginx → React frontend / Node.js API → PostgreSQL
```

Local and first-deployment target: Docker Compose. No microservices. No Kubernetes.

## Prerequisites

- Docker Engine + Docker Compose v2
- Git
- Optional for host-side tooling: Node.js 20 LTS

## Quick start (Docker)

```bash
cp .env.example .env
docker compose up -d --build
```

Then open:

- App: http://localhost/
- Live health: http://localhost/api/health/live
- Full health (includes Postgres): http://localhost/api/health

Stop:

```bash
docker compose down
```

## Host-side frontend / backend (optional)

Backend:

```bash
cd backend
npm install
npx prisma generate
npm run dev
```

Frontend (Vite proxies `/api` to `http://localhost:4000`):

```bash
cd frontend
npm install
npm run dev
```

Postgres still needs to be running (Compose `postgres` service, or another instance matching `DATABASE_URL`).

When developing the API on the host, point `DATABASE_URL` at `localhost` instead of the Docker hostname `postgres`.

## Quality checks

From `backend/` and `frontend/`:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Repository layout

```
frontend/     React + TypeScript + Vite + Tailwind (PWA)
backend/      Node.js + Express + TypeScript + Prisma
database/     Postgres notes and optional init SQL
nginx/        Reverse proxy config
docker/       Image/helper notes
docs/         Product and engineering docs
```

## Git branches

Use `main`, `develop`, and `feature/*`. Do not push unfinished work to `main`.

## Current phase

Phase 1 — Project foundation (complete once health checks pass).

Next: Phase 2 — Database schema and authentication.

See `docs/` for requirements, architecture, database, API, and deployment notes.
