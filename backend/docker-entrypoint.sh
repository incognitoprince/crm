#!/bin/sh
set -eu

# Schema management is explicit and opt-in for normal deployments.
# On a brand-new database, the repository's historical migration set starts
# from an already-existing schema, so bootstrap the schema with Prisma db push
# and mark those historical migrations as applied. On an existing database,
# use normal Prisma migrations.
if [ "${RUN_DB_MIGRATIONS:-true}" = "true" ]; then
  SCHEMA_EXISTS=$(node --input-type=module - <<'NODE'
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
try {
  const rows = await prisma.$queryRawUnsafe('SELECT to_regclass(\'public."User"\') AS table_name');
  process.stdout.write(rows?.[0]?.table_name ? "true" : "false");
} catch {
  process.stdout.write("false");
} finally {
  await prisma.$disconnect();
}
NODE
)
  if [ "$SCHEMA_EXISTS" = "true" ]; then
    ./node_modules/.bin/prisma migrate deploy
  else
    ./node_modules/.bin/prisma db push --skip-generate
    ./node_modules/.bin/prisma migrate resolve --applied 20260925_admin_username_transition || true
    ./node_modules/.bin/prisma migrate resolve --applied 20260927160000_invoice_creator_and_line_images || true
  fi
fi

if [ "${RUN_DB_SEED:-false}" = "true" ]; then
  node prisma/seed.mjs
fi

exec node dist/index.js
