# Deployment

Phase 1 target is **local Docker Compose**, typically on a Linux VM. Production VPS is later.

## Local Compose

```bash
cp .env.example .env
docker compose up -d --build
docker compose ps
curl http://localhost/api/health
```

Logs:

```bash
docker compose logs -f backend
```

Migrations (from Phase 2 onward):

```bash
docker compose exec backend npx prisma migrate deploy
```

Phase 1 has no domain migrations.

## Health checks

Compose healthchecks exist on `postgres`, `backend`, `frontend`, and `nginx`.

## Future production (not this phase)

One Ubuntu VPS:

Cloudflare → HTTPS → Nginx → Docker Compose → React + Node.js + PostgreSQL

Secrets only from environment variables. Never commit `.env`.
