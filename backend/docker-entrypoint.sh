#!/bin/sh
set -eu

# Schema management is explicit and opt-in for normal deployments.
# On a brand-new database, the repository's migration history starts from an
# already-existing schema, so bootstrap the schema with Prisma db push and then
# record every bundled migration as applied. Existing databases use normal,
# forward-only Prisma migrations.
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
    for migration_dir in prisma/migrations/*; do
      [ -d "$migration_dir" ] || continue
      ./node_modules/.bin/prisma migrate resolve --applied "$(basename "$migration_dir")"
    done
  fi
fi

if [ "${RUN_DB_SEED:-false}" = "true" ]; then
  node prisma/seed.mjs
fi

exec node dist/index.js
