#!/bin/sh
set -eu

# The production database is already provisioned and may contain enum values
# that Prisma db push attempts to recreate. Schema changes must be handled by
# explicit migrations rather than risking startup failures or data changes.
if [ "${SKIP_PRISMA_DB_PUSH:-true}" != "true" ]; then
  ./node_modules/.bin/prisma db push --skip-generate
fi

node prisma/seed.mjs
exec node dist/index.js
