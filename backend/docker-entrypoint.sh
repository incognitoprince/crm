#!/bin/sh
set -eu

DB_PUSH_LOG="/tmp/prisma-db-push.log"

if ! ./node_modules/.bin/prisma db push --skip-generate >"$DB_PUSH_LOG" 2>&1; then
  if grep -Eq 'enumtypid.*enumlabel|Unique constraint failed on the fields: \(\x60enumtypid\x60,\x60enumlabel\x60\)' "$DB_PUSH_LOG"; then
    echo "Prisma schema sync hit an existing PostgreSQL enum value; continuing with the existing database schema."
    cat "$DB_PUSH_LOG"
  else
    cat "$DB_PUSH_LOG"
    exit 1
  fi
else
  cat "$DB_PUSH_LOG"
fi

node prisma/seed.mjs
exec node dist/index.js
