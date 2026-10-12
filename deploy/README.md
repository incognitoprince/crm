# Production deployment trigger

This adds fixed, authenticated deployment actions for the production host. **Do not expose this service publicly without the reverse-proxy access controls and bearer secret.** Browser GET requests are intentionally rejected; deployments use POST with an Authorization header, so the secret never goes in a URL.

## What each action does

- `frontend`: fetches the latest `prod` branch, builds frontend, recreates only the frontend service.
- `backend`: fetches the latest `prod` branch, builds backend, recreates only the backend service.
- `all`: fetches the latest `prod` branch, builds frontend/backend/nginx and recreates only those services.
- The database service and persistent volumes are never passed to `docker compose up`.

The script performs `git reset --hard origin/prod` in the fixed application directory. Keep uncommitted changes out of the production checkout.

## Install on the production server (one-time)

Assumes the repository checkout is at `/opt/tailorshopcrm`, owned/configured for production, with Docker Compose working. The Nginx container uses `host.docker.internal` (added in `docker-compose.yml`) to reach the webhook on the host.

```bash
sudo install -o root -g root -m 0750 /opt/tailorshopcrm/deploy/deploy.sh /usr/local/bin/tailorshopcrm-deploy
sudo chown root:root /opt/tailorshopcrm/deploy/webhook.py && sudo chmod 0750 /opt/tailorshopcrm/deploy/webhook.py
sudo install -o root -g root -m 0644 /opt/tailorshopcrm/deploy/tailorshopcrm-deploy-webhook.service /etc/systemd/system/tailorshopcrm-deploy-webhook.service
sudo sh -c 'umask 077; printf "DEPLOY_WEBHOOK_TOKEN=%s\\n" "$(openssl rand -hex 32)" > /etc/tailorshopcrm-deploy.env'
sudo chmod 600 /etc/tailorshopcrm-deploy.env
sudo systemctl daemon-reload
sudo systemctl enable --now tailorshopcrm-deploy-webhook
sudo systemctl status tailorshopcrm-deploy-webhook
```

If your checkout is not `/opt/tailorshopcrm`, set `APP_DIR` in `/etc/tailorshopcrm-deploy.env`. The webhook listens on port `8765` so the Docker Nginx container can reach it through `host.docker.internal`. **Do not allow inbound port 8765 in UFW or your cloud security list.** Only publish the domain's existing 80/443 ports. The Nginx config forwards only POST requests for `/frontend`, `/backend`, and `/all` to the webhook; GET requests are denied. Keep the bearer token secret and consider restricting these paths with Cloudflare Access or source-IP allow-listing.

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

The repository includes the Docker Nginx routes and host-gateway mapping. It still requires one-time host installation and a secret in `/etc/tailorshopcrm-deploy.env`. This has not been installed on or tested against the production server by this repository change.
