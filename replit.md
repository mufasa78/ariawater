# Ari Water — Commerce & Operations Platform

A full-stack commerce and operations platform for Ari Water (Aritwin Limited), a Kenyan water packaging and refilling company. Gives the business a branded storefront, order management, and admin dashboard.

## Run & Operate

- Frontend: `pnpm --filter @workspace/ari-water run dev` — served at `/`
- API: `pnpm --filter @workspace/api-server run dev` — served at `/api`
- `pnpm run typecheck` — full typecheck
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas

## Required environment variables

- `JWT_SECRET` — JWT signing secret (loaded from `.env.local` in dev)
- `CONVEX_URL` or `CONVEX_DEPLOYMENT_URL` — Convex deployment URL (**must not have a trailing slash**)
- `CONVEX_DEPLOY_KEY` — Convex deploy key (for `npx convex deploy`)

## Optional environment variables

- `LIPANA_PUBLISHABLE_KEY` / `LIPANA_SECRET_KEY` / `LIPANA_WEBHOOK_SECRET` — Lipana M-Pesa payments
- `PAYSTACK_SECRET_KEY` — Paystack payments (alternative to Lipana)
- `ALLOWED_ORIGINS` — comma-separated list of allowed CORS origins in production

## Stack

- pnpm workspaces, Node.js 20, TypeScript 5.9
- Frontend: React 19, Vite 7, TailwindCSS 4, Wouter, TanStack Query
- API: Express 5, JWT (cookie-based, 7-day TTL), bcryptjs
- Database: Convex (cloud-hosted)
- API codegen: Orval (from OpenAPI spec in `lib/api-spec/openapi.yaml`)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for API contracts
- `lib/api-client-react/src/generated/` — React Query hooks (generated)
- `lib/api-zod/src/generated/` — Zod request/response schemas (generated)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/lib/convex-client.ts` — Convex HTTP client setup
- `artifacts/ari-water/src/pages/` — React page components
- `artifacts/ari-water/src/lib/` — auth-context, cart-context, utils
- `convex/` — Convex schema and serverless functions

## Architecture decisions

- **JWT auth** (not sessions): JWT stored as HttpOnly cookie; 7-day expiry.
- **Convex as the database**: All data (users, products, orders, reviews) lives in the Convex cloud deployment at `https://grand-dachshund-295.convex.cloud/`.
- **CONVEX_URL trailing-slash warning**: The ConvexHttpClient appends `/api/query` to the URL — a trailing slash produces a double slash and 404. Always strip trailing slashes.
- **Admin seeded in Convex**: admin@ariwater.co.ke / Admin@123! (change in production).

## Product

- **Public storefront** (`/`): Landing page with hero, product showcase, trust signals, CTAs
- **Shop** (`/shop`): Product catalogue, cart, checkout
- **Customer portal** (`/orders`): Order history and real-time status tracking
- **Admin dashboard** (`/admin`): Revenue summary, order status breakdown, revenue trend
- **Admin products** (`/admin/products`): Full product CRUD
- **Admin orders** (`/admin/orders`): All orders table with status update controls

## Roles

- **admin**: full access. Login: admin@ariwater.co.ke / Admin@123!
- **customer**: place orders, view own orders, submit reviews

## User preferences

_Populate as you build._

## Gotchas

- After any OpenAPI spec change, run `pnpm --filter @workspace/api-spec run codegen` before touching frontend code.
- `CONVEX_URL` must NOT have a trailing slash — see architecture decisions above.
- Frontend sends session cookies — the custom-fetch client is cookie-based (no Bearer token needed in the frontend).
