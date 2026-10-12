#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

# Install this script on the production host as /usr/local/bin/tailorshopcrm-deploy.
APP_DIR="${APP_DIR:-/opt/tailorshopcrm}"
BRANCH="${DEPLOY_BRANCH:-prod}"
ACTION="${1:-}"

case "$ACTION" in
  frontend) SERVICES=(frontend) ;;
  backend)  SERVICES=(backend) ;;
  all)      SERVICES=(frontend backend nginx) ;;
  *) echo "Usage: tailorshopcrm-deploy {frontend|backend|all}" >&2; exit 2 ;;
esac

if [[ ! -d "$APP_DIR/.git" ]]; then
  echo "Repository not found at $APP_DIR" >&2
  exit 1
fi
cd "$APP_DIR"

# Prevent two deploys from running simultaneously.
exec 9>/run/lock/tailorshopcrm-deploy.lock
if ! flock -n 9; then
  echo "Another deployment is already running." >&2
  exit 1
fi

echo "Fetching origin/$BRANCH..."
git fetch --prune origin "$BRANCH"
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "Building: ${SERVICES[*]}"
docker compose build "${SERVICES[@]}"

echo "Recreating only selected application services (database is not recreated)."
docker compose up -d --no-deps "${SERVICES[@]}"

echo "Deployment command completed. Container status:"
docker compose ps "${SERVICES[@]}"
