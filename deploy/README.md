# Production deployment trigger

This adds fixed, authenticated deployment actions for the production host. **Do not expose this service publicly without the reverse-proxy access controls and bearer secret.** Browser GET requests are intentionally rejected; deployments use POST with an Authorization header, so the secret never goes in a URL.

## What each action does

- `frontend`: fetches the latest `prod` branch, builds frontend, recreates only the frontend service.
- `backend`: fetches the latest `prod` branch, builds backend, recreates only the backend service.
- `all`: fetches the latest `prod` branch, builds frontend/backend/nginx and recreates only those services.
- The database service and persistent volumes are never passed to `docker compose up`.

The script performs `git reset --hard origin/prod` in the fixed application directory. Keep uncommitted changes out of the production checkout.

## Install on the production server (one-time)

Assumes the repository checkout is at `/opt/tailorshopcrm`, owned/configured for production, with Docker Compose working.

```bash
sudo install -o root -g root -m 0750 /opt/tailorshopcrm/deploy/deploy.sh /usr/local/bin/tailorshopcrm-deploy
sudo install -o root -g root -m 0750 /opt/tailorshopcrm/deploy/webhook.py /opt/tailorshopcrm/deploy/webhook.py
sudo install -o root -g root -m 0644 /opt/tailorshopcrm/deploy/tailorshopcrm-deploy-webhook.service /etc/systemd/system/tailorshopcrm-deploy-webhook.service
sudo sh -c 'umask 077; printf "DEPLOY_WEBHOOK_TOKEN=%s\\n" "$(openssl rand -hex 32)" > /etc/tailorshopcrm-deploy.env'
sudo chmod 600 /etc/tailorshopcrm-deploy.env
sudo systemctl daemon-reload
sudo systemctl enable --now tailorshopcrm-deploy-webhook
sudo systemctl status tailorshopcrm-deploy-webhook
```

If your checkout is not `/opt/tailorshopcrm`, set `APP_DIR` in `/etc/tailorshopcrm-deploy.env`. Keep the webhook bound to `127.0.0.1:8765`; do not open port 8765 in UFW/security lists. Configure your host reverse proxy to forward only POST requests for `/frontend`, `/backend`, and `/all` to `http://127.0.0.1:8765`. If Nginx itself runs in Docker, localhost inside that container is not the host; use a host-only bridge route and firewall it so only that proxy can reach the webhook.

## Trigger from a trusted terminal

Read the secret on the server without printing it to chat/logs, then use it from a secure client secret store:

```bash
curl --fail-with-body -X POST https://tailorshopcrm.com/frontend -H "Authorization: Bearer $DEPLOY_WEBHOOK_TOKEN"
curl --fail-with-body -X POST https://tailorshopcrm.com/backend  -H "Authorization: Bearer $DEPLOY_WEBHOOK_TOKEN"
curl --fail-with-body -X POST https://tailorshopcrm.com/all      -H "Authorization: Bearer $DEPLOY_WEBHOOK_TOKEN"
```

Do not put the token in the URL, browser bookmarks, source control, or chat. GET requests return 405 by design. Restrict these proxy paths further by source IP or Cloudflare Access if possible.

## Verification / recovery

```bash
sudo journalctl -u tailorshopcrm-deploy-webhook -n 100 --no-pager
cd /opt/tailorshopcrm && docker compose ps
cd /opt/tailorshopcrm && docker compose logs --tail=100 backend frontend nginx
```

This is an initial implementation template; install and configure the host reverse proxy deliberately before enabling public access. It has not been installed on or tested against the production server by this repository change.
