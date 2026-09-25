#!/bin/sh
set -eu

./node_modules/.bin/prisma db push --skip-generate
node prisma/seed.mjs
exec node dist/index.js
