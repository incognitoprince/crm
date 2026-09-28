#!/bin/sh
set -eu

# The production database is already provisioned. Schema changes must be
# handled by explicit migrations rather than running db push on every startup.
if [ "${SKIP_PRISMA_DB_PUSH:-true}" != "true" ]; then
  ./node_modules/.bin/prisma db push --skip-generate
fi

# Seeding is an explicit operation. It must never block the API from starting
# during normal production restarts.
if [ "${RUN_DB_SEED:-false}" = "true" ]; then
  node prisma/seed.mjs
fi

exec node dist/index.js
