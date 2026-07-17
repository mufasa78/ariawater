---
name: Convex migration for Ari Water
description: Key decisions and operational details from migrating the API server from PostgreSQL/Drizzle to Convex + JWT auth
---

# Convex Migration — Ari Water

## Deployments
- **Dev deployment**: `original-perch-504` → `https://original-perch-504.convex.cloud`
- **Prod deployment**: `grand-dachshund-295` → `https://grand-dachshund-295.convex.cloud`
- `CONVEX_DEPLOY_KEY` stored as secret is the **prod** key (`prod:grand-dachshund-295|…`)
- `CONVEX_URL` env var is set to `https://grand-dachshund-295.convex.cloud`

**Why:** User provided prod deploy key; prod deployment was used going forward.

## JWT Auth
- JWT stored in httpOnly cookie (`token`), 7-day expiry
- Auth middleware reads `req.cookies.token` or `Authorization: Bearer` header
- `/me` endpoint is stateless — reads JWT payload, no DB call
- Frontend auth-context needs no changes (still calls `/api/auth/me` via cookie)

**How to apply:** Use `req.user.userId` and `req.user.role` in Express routes; never `req.session.*`

## Convex Functions Layout
- `convex/users.ts` — getByEmail, getById, create
- `convex/products.ts` — list (filters: activeOnly, category, inStock), get, create, update, remove
- `convex/orders.ts` — listByCustomer, listAll, get, create, updateStatus, updatePayment, getByPaystackRef
- `convex/dashboard.ts` — summary, recentOrders, revenueTrend
- `convex/reviews.ts` — create, getByOrder

## ConvexHttpClient usage
- Imported from `convex/browser`
- Initialised in `artifacts/api-server/src/lib/convex-client.ts`
- Route files import `{ convex, api }` from `../lib/convex-client`
- `api` stub in `convex/_generated/api.ts` returns `"namespace:function"` strings; replaced by real generated file after `npx convex deploy`

**Why:** Proxy strings match Convex HTTP API path format; allows Express routes to typecheck before deploy.

## String IDs
- All OpenAPI IDs changed from `type: integer` → `type: string` (Convex IDs are strings)
- Codegen re-run after spec update; all Zod schemas regenerated
- Path params `/{id}` all updated to `type: string`

## Seed Data
- Admin: `admin@ariwater.co.ke` / `Admin@123!`
- 6 products seeded (AW-500ML-24, AW-1L-12, AW-5L-4, AW-10L-REF, AW-20L-REF, AW-DISP-HC)
- Seed in future: run `scripts/seed-convex.mjs` or the CodeExecution approach with bcryptjs from pnpm store

## Re-deploying Convex
```bash
CONVEX_DEPLOY_KEY="$CONVEX_DEPLOY_KEY" npx convex deploy
```
Must run from workspace root (where `convex.json` and `package.json` with `convex` dep live).
After deploy, `convex/_generated/` is updated with real types.
