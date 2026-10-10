#!/bin/sh
set -eu

# Rebuild the DEMO/UAT PostgreSQL database from the current Git migration set.
# WARNING: this intentionally destroys the current database contents.
# Never run this against production or a database containing real customer data.

cd "${0%/*}/.."

DB_SERVICE="db"
BACKEND_SERVICE="backend"
DB_NAME="${POSTGRES_DB:-tailoring_crm}"
DB_USER="${POSTGRES_USER:-tailoring}"
BACKUP_DIR="./backups"

case "$DB_NAME" in
  tailoring_crm|tailoring_crm_demo|tailoring_crm_uat) ;;
  *)
    echo "Refusing to rebuild unexpected database name: $DB_NAME"
    exit 1
    ;;
esac

echo "=== DEMO DATABASE REBUILD ==="
echo "Database: $DB_NAME"
echo "User:     $DB_USER"
echo

mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/demo-db-before-rebuild-$(date +%Y%m%d-%H%M%S).sql"

echo "[1/7] Stopping application containers..."
docker compose stop backend frontend nginx 2>/dev/null || true

echo "[2/7] Creating a safety backup..."
docker compose exec -T "$DB_SERVICE" sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"' > "$BACKUP_FILE"
echo "Backup saved to: $BACKUP_FILE"

echo "[3/7] Recreating database..."
docker compose exec -T "$DB_SERVICE" psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d postgres \
  -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();"
docker compose exec -T "$DB_SERVICE" psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d postgres \
  -c "DROP DATABASE IF EXISTS \"$DB_NAME\";"
docker compose exec -T "$DB_SERVICE" psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d postgres \
  -c "CREATE DATABASE \"$DB_NAME\" OWNER \"$DB_USER\";"
echo "[4/7] Creating the schema from the current Prisma model..."
docker compose run --rm --no-deps "$BACKEND_SERVICE" ./node_modules/.bin/prisma db push --skip-generate

echo "[5/7] Recording repository migrations as applied..."
docker compose run --rm --no-deps "$BACKEND_SERVICE" ./node_modules/.bin/prisma migrate resolve --applied 20260925_admin_username_transition
docker compose run --rm --no-deps "$BACKEND_SERVICE" ./node_modules/.bin/prisma migrate resolve --applied 20260927160000_invoice_creator_and_line_images

echo "[6/7] Loading clean demo data..."
docker compose run --rm --no-deps -e SEED_DEMO_DATA=true "$BACKEND_SERVICE" node prisma/seed.mjs

echo "[7/7] Verifying core data..."
docker compose exec -T "$DB_SERVICE" sh -c '
  psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "
    SELECT
      (SELECT count(*) FROM \"User\") AS users,
      (SELECT count(*) FROM \"Shop\") AS shops,
      (SELECT count(*) FROM \"Customer\") AS customers,
      (SELECT count(*) FROM \"Design\") AS designs,
      (SELECT count(*) FROM \"Master\") AS masters,
      (SELECT count(*) FROM \"Order\") AS orders,
      (SELECT count(*) FROM \"Payment\") AS payments;
  "
'

echo "[8/7] Starting application..."
docker compose up -d

echo
echo "=== DEMO DATABASE REBUILD COMPLETE ==="
echo "Backup: $BACKUP_FILE"
echo
echo "Run:"
echo "  docker compose ps"
echo "  docker compose logs --tail=100 backend"
