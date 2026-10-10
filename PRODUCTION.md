# Production Deployment

## Security requirements

- Serve the application through HTTPS. Do not expose the application over plain HTTP to end users.
- Use a strong random AUTH_SECRET of at least 32 characters.
- Use unique long passwords for PostgreSQL and the initial Admin account.
- Keep the production .env file outside Git and restrict it to the deployment administrator.
- Set CORS_ORIGIN to the exact HTTPS origin used by the application. Do not use *.
- Keep SEED_DEMO_DATA=false.
- The PostgreSQL port is intentionally not published to the host.
- Uploaded files are authenticated, size-limited, signature-validated, and stored under generated filenames.
- Application sessions use HttpOnly, Secure, SameSite cookies in production; authentication tokens are not stored in browser localStorage.
- Configure encrypted backups for PostgreSQL and the uploads volume.

## First deployment

1. Copy .env.production.example to a deployment-only .env file.
2. Replace every REPLACE_WITH_* value with a unique secret.
3. Set CORS_ORIGIN to the real HTTPS application origin.
4. Review the resolved Compose configuration before starting: docker compose config
5. Build: docker compose build
6. Start: docker compose up -d
7. Check service health: docker compose ps
8. Verify the HTTPS endpoint externally and confirm the response contains the expected security headers.
9. Sign in with the initial Admin account and immediately create the required staff accounts through User management.
10. Remove temporary bootstrap credentials from shell history and secret files that are not needed for deployment.

## Upgrade

Before an upgrade:
- Take a PostgreSQL backup.
- Back up the uploads volume.
- Review the Git commit being deployed.
- Run CI checks and build the images before changing the running deployment.

Then:
git fetch origin
git checkout prod
git pull --ff-only origin prod
docker compose build
docker compose up -d
docker compose ps

## Important

The current database workflow uses Prisma db push because the project did not begin with a complete Prisma migration history. Before a future major schema change, establish a complete migration baseline and switch production deployments to prisma migrate deploy.