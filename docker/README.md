# Docker notes

Images:

- `frontend/Dockerfile` — multi-stage Vite build, Nginx static server
- `backend/Dockerfile` — multi-stage Node 20 Alpine build
- `postgres` and `nginx` use official images

Root `docker-compose.yml` is the local (and later VPS) stack.

Do not add Kubernetes manifests.
