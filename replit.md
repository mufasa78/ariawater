# Ari Water — Commerce & Operations Platform

A full-stack commerce and operations platform for Ari Water (Aritwin Limited), a Kenyan water packaging and refilling company. Gives the business a branded storefront, order management, and admin dashboard — replacing manual WhatsApp and spreadsheet processes.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — API server (port 8080, served at `/api`)
- `pnpm --filter @workspace/ari-water run dev` — Frontend (served at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `SESSION_SECRET` — express-session secret (already set)
- Optional env: `PAYSTACK_SECRET_KEY` — enables live Paystack payments (falls back to mock mode)
- Optional env: `ALLOWED_ORIGINS` — comma-separated list of allowed CORS origins in production

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19, Vite 7, TailwindCSS 4, Wouter, TanStack Query
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: express-session + bcryptjs (cookie-based sessions, 7-day TTL)
- Payments: Paystack (M-Pesa, card, bank transfer) — mock mode when no key set
- Validation: Zod (zod/v4), drizzle-zod
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle schema (users, products, orders, order_items, reviews)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/middlewares/auth.ts` — requireAuth + requireAdmin middleware
- `artifacts/ari-water/src/pages/` — React page components
- `artifacts/ari-water/src/lib/` — auth-context, cart-context, utils

## Architecture decisions

- **Session-based auth** (not JWT): SESSION_SECRET already available; simpler for a web-only Phase 1 app with custom roles (admin/customer).
- **Paystack mock mode**: When PAYSTACK_SECRET_KEY is absent, payment routes return mock references so checkout flows can be tested without real credentials.
- **Drizzle transactions for order creation**: createOrder uses a DB transaction with FOR UPDATE locks on product rows to prevent concurrent oversell.
- **CORS scoped in production**: `ALLOWED_ORIGINS` env var controls allowed origins; all origins allowed in development.
- **Admin seeded at launch**: admin@ariwater.co.ke / admin123 (bcrypt). Change immediately in production.

## Product

- **Public storefront** (`/`): Landing page with hero, product showcase, trust signals, CTAs
- **Shop** (`/shop`): Product catalogue, cart, checkout (delivery address, phone, payment method)
- **Customer portal** (`/orders`): Order history, real-time status tracking, review submission
- **Admin dashboard** (`/admin`): Revenue summary (today/week/all-time), order status breakdown, 30-day revenue trend, low stock alerts
- **Admin products** (`/admin/products`): Full product CRUD — create, edit, toggle active, manage stock
- **Admin orders** (`/admin/orders`): All orders table, status update controls

## Roles

- **admin**: full access to all routes and admin pages. Login: admin@ariwater.co.ke / admin123
- **customer**: can place orders, view own orders, submit reviews for delivered orders

## User preferences

_Populate as you build._

## Gotchas

- After any OpenAPI spec change, run `pnpm --filter @workspace/api-spec run codegen` before touching frontend code.
- `priceKes` and `totalKes` are stored as Postgres `numeric` (returned as string from Drizzle) — always cast to `Number()` before math or JSON response.
- Frontend sends session cookies — the custom-fetch client is cookie-based (no Bearer token needed).
- Vite HMR works in dev; after restarting the API workflow, the frontend reconnects automatically.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
