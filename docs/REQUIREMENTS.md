# Requirements

Living product requirements for Tailoring CRM. Phase 1 implements foundation only.

## Product

Simple, reliable, user-friendly CRM for a tailoring business in Kuwait with four shops. Owner monitors all shops from one system. Staff operate day-to-day work under RBAC.

## Non-goals

- Microservices
- Kubernetes
- Over-engineered infrastructure

## Users (v1)

- **Owner** — full access across shops
- **Staff / Operator** — permission-based operational access

## Phase 1 scope (this release)

- Repository structure and documentation
- Frontend Vite/React TypeScript shell with PWA config and dashboard landing
- Backend Express TypeScript API with health endpoints
- PostgreSQL via Docker
- Nginx reverse proxy
- Docker Compose stack
- Environment template (no secrets in git)
- Frontend calling backend health through Nginx
- Lint, typecheck, test, and production build scripts

## Out of scope until later phases

Authentication, domain modules (customers, orders, payments, etc.), invoices, reports, and production VPS cutover.

## Functional modules (full product)

Authentication, dashboard, users, roles/permissions, shops, customers, measurements, measurement templates, designs, masters, garment types, work orders, order items, order status history, payments, bills/invoices, files/images, reports, audit logs, settings.

## Main workflow (later)

Customer → Measurements → Design → Work Order → Shop assignment → Master assignment → Production → Quality check → Ready → Payment → Delivery

Order statuses: `PENDING`, `IN_PROGRESS`, `QUALITY_CHECK`, `READY`, `DELIVERED`, `CANCELLED`

## Quality attributes

Simplicity, reliability, security, maintainability, easy troubleshooting, responsive UI, easy local Docker development, future single-VPS deploy behind Cloudflare + HTTPS + Nginx.
