# BWAT.md

This file provides guidance to Bwat when working with code in this repository.

**Aria Water Management** — Kenyan bottled-water e-commerce + admin system. pnpm workspace monorepo; React SPA frontend, Express API server, Convex as the database/backend runtime, Clerk for auth, Lipana (M-PESA STK push) for payments. Prices in KES.

## Tech Stack

- **Monorepo**: pnpm workspace (root `package.json`; `preinstall` auto-runs `scripts/ensure-pnpm.cjs`).
- **Frontend** (`artifacts/ari-water`, `@workspace/ari-water`): React 19 + Vite 7 + TypeScript, **wouter** routing (NOT react-router), TanStack Query, Clerk (`@clerk/clerk-react`), zod + react-hook-form, framer-motion, recharts, sonner.
- **UI kit**: shadcn-style — Radix UI primitives, class-variance-authority, tailwind-merge, clsx, lucide-react.
- **Styling**: **Tailwind CSS v4** (CSS-first config — there is NO `tailwind.config.*`; the theme lives in `@theme inline` in `artifacts/ari-water/src/index.css`). Dark mode via `.dark` class.
- **API server** (`artifacts/api-server`, `@workspace/api-server`): Express 5 + TypeScript, built with esbuild (`build.mjs`), `@clerk/express` auth, Convex client, pino logging, multer uploads.
- **Database/backend**: **Convex** (`convex/`) — schema, queries/mutations/actions, and an HTTP action webhook. Deployment URL `https://grand-dachshund-295.convex.cloud/` (dashboard project `mufasa:aria-water:production`).
- **Shared libs**: `lib/api-zod` (`@workspace/api-zod`) — zod schemas for every API request/response, imported by both server routes and frontend; `lib/api-client-react` (`@workspace/api-client-react`) — generated fetch client with base-URL + Bearer-token injection. `lib/api-spec` and `lib/db` (drizzle-orm + pg) are **legacy/dead** — see Gotchas.
- **Scripts** (`scripts/`): admin setup, password hashing, login/Lipana test helpers (run via `pnpm --filter scripts`).

## Brand Identity

All tokens are CSS custom properties in `artifacts/ari-water/src/index.css` (HSL triplets, consumed via `hsl(var(--token))`). Use Tailwind semantic classes (`bg-primary`, `text-muted-foreground`, `border-border`, …) — never hardcode hex.

**Colors**:
- Primary: deep teal-blue `hsl(198 85% 26%)` (light) / `hsl(198 85% 45%)` (dark) — also `--ring`, `--sidebar-primary`, `--chart-1`
- Secondary: soft sky blue `hsl(198 70% 93%)` (light)
- Accent: warm amber "Kenyan sun" `hsl(38 92% 55%)` — also `--chart-2`
- Background: `hsl(204 10% 98%)` (light) / `hsl(210 30% 6%)` (dark)
- Foreground: `hsl(210 30% 12%)` (light) / `hsl(210 20% 96%)` (dark)
- Border/muted: `hsl(210 20% 90%)` / muted-foreground `hsl(210 15% 45%)`
- Destructive: `hsl(0 84% 60%)`

**Typography** (Google Fonts, imported at top of index.css):
- Display/headings: `'Outfit', sans-serif` (`--font-display`; `h1–h6` auto-apply it via base layer)
- Body: `'Plus Jakarta Sans', sans-serif` (`--font-sans`, applied to `body`)
- Mono: `Menlo, monospace`

**Geometry**:
- Border radius: `--radius: 0.75rem` (sm/md/lg/xl derive from it)
- Spacing: default Tailwind scale (`--spacing: 0.25rem`)
- Shadows: custom layered `--shadow-*` scale in index.css

**Visual language**: Clean teal-and-amber commerce design — soft elevated surfaces (custom `hover-elevate`/`active-elevate`/`toggle-elevate` utility system with `--elevate-1/2` overlays), generous rounded corners, light and dark themes. Match existing component patterns; don't introduce new colors outside the token set.

## Coding Conventions

- **Convex is governed by `convex/_generated/ai/guidelines.md`** (auto-generated; CLAUDE.md/AGENTS.md mandate reading it before Convex work). High-value rules that override training-data assumptions:
  - Every `query`/`mutation`/`action`/`internal*` function MUST have argument validators (`v.*`).
  - Private logic → `internalQuery`/`internalMutation`/`internalAction`; public `query`/`mutation`/`action` are internet-exposed.
  - `.take(n)` or paginate — never `.collect()` on unbounded queries; never `.collect().length` for counts (denormalize counters instead).
  - Never read wall-clock (`Date.now()`, `new Date()`) inside queries — pass time in as an arg.
  - No `ctx.db` in actions; `"use node"` only in files exporting actions only; `fetch()` works without it.
  - Use `Doc<"table">` / `Id<"table">` types from `./_generated/dataModel`; type ctx as `QueryCtx`/`MutationCtx`/`ActionCtx` — never `any`.
  - Don't store unbounded arrays on documents (1 MB doc limit); use child tables. (Note: `tickets.messages` is an existing array.)
  - Index names must include all fields (`by_field1_and_field2`).
  - The full file has HTTP endpoint, pagination, storage, and scheduling details — read it.
- **API contracts live in `lib/api-zod`** (`@workspace/api-zod`): define request/response schemas there, validate with `.parse()` in routes and on the frontend. Don't inline ad-hoc shapes in route handlers.
- **Frontend routing is wouter** (`<Route path="..." />` + `Switch`), not react-router — match the existing `App.tsx` pattern.
- `@/` import alias → `artifacts/ari-water/src`.
- Components: PascalCase files in `src/components/`, pages in `src/pages/`. shadcn primitives in `src/components/ui/`.
- Tailwind v4: extend tokens in `@theme` in index.css; dark variants via `dark:` (`.dark` class).

## Architecture Notes

- **Auth is Clerk, end to end.** Frontend wraps the app in `ClerkProvider` + `ClerkAuthWrapper` (`src/lib/clerk-auth-wrapper.tsx`), which registers a Bearer-token getter on the API client (`setAuthTokenGetter(() => getToken())`). The API server mounts `clerkMiddleware()`; `requireAuth`/`optionalAuth`/`requireRole`/`requireAdmin` in `artifacts/api-server/src/middlewares/auth.ts` fetch the user from Clerk and map `publicMetadata.role` (default `"customer"`) and `publicMetadata.approved` (default true) into `req.user`. Admin access = setting `publicMetadata.role: "admin"` in the Clerk dashboard. There is **no `convex/auth.config.ts`** — Convex itself does not validate Clerk tokens; Convex functions receive `customerId` strings (Clerk user IDs) as args.
- **Data flow**: frontend → Express API (`/api/*`, also mounted at `/` so routes work both prefixed and bare) → Convex via `artifacts/api-server/src/lib/convex-client.ts` wrapper. Convex tables: `users` (legacy passwordHash + role + approved), `products` (KRA fields: `vatClass`, `kraItemCode`, `uom`), `orders` (`customerId` is a string — Clerk ID or guest), `orderItems`, `reviews`, `payments` (provider `lipana`), `magicLinkTokens`, `tickets`.
- **Checkout**: guest checkout supported — order creation, payment initialize/verify use `optionalAuth`. Orders get an `orderNumber` (e.g. `ARI-20260808-001`) and a `ticketNumber` for tracking/support.
- **Payments**: Lipana M-PESA STK push (`lib/lipana-client.ts`, `LIPANA_PRODUCTION=true` for live). The Lipana webhook is a **Convex HTTP action** (`convex/http.ts`, path `/lipana/webhook`) that verifies `x-lipana-signature` and marks payments via `internal.payments.markByProviderTransactionId` — not an Express route.
- **Routing**: public pages (Landing, Shop, Track, About, policies), Clerk auth pages (`/login`, `/sign-up` with `:rest*` catch-alls), admin pages behind `AdminRoute` role guard (dashboard, orders, products, marketing, accounting).
- **Deployment**: dev on Replit-style setup (`.replit`, PNPM_WORKSPACE); production cPanel from `deploy/` (`deploy/public` = built frontend for `public_html`, `deploy/api` = bundled `serverless.mjs` Express app with `.env.production`). `deploy/api/serverless.mjs` is a 2.3 MB esbuild bundle — never edit it by hand; it's generated from `artifacts/api-server`.
- **`.migration-backup/`** holds a snapshot of the old codebase — reference-only, never edit; it also contains older docs.

## Commands

- Install: `pnpm install` (at workspace root; `preinstall` ensures pnpm itself).
- Dev (two terminals): `pnpm --filter @workspace/api-server dev` → API on **port 8080**; `pnpm --filter @workspace/ari-water dev` → frontend on **port 18090** (Vite proxies `/api` → `127.0.0.1:8080`).
- **Windows note**: the api-server dev script starts with POSIX syntax (`NODE_ENV=development pnpm run build && …`) which fails in cmd/PowerShell. Workaround: run `pnpm --filter @workspace/api-server build` first, then `node --env-file-if-exists .env.local --enable-source-maps ./dist/index.mjs` (or `pnpm --filter @workspace/api-server start` after building).
- Typecheck all: `pnpm run typecheck` (root). Full build: `pnpm run build`.
- Convex backend: `npx convex dev` (local push while coding), `npx convex deploy` (production). Dashboard: https://dashboard.convex.dev/ → `mufasa:aria-water:production`.
- Helpers: `pnpm --filter scripts run hash-password "MyPassword"` (bcrypt hash — only needed for the legacy JWT system), `pnpm --filter scripts run test-lipana`.
- Frontend build output goes to `artifacts/ari-water/dist/public` — copy to `deploy/public/` when releasing via cPanel.

## Gotchas

- **Docs describing the old JWT login are stale.** `README_LOGIN_SETUP.md`, `LOGIN_VERIFICATION.md`, `LOGIN_STATUS.md`, `MANUAL_ADMIN_SETUP.md` document the retired custom-JWT auth (bcrypt + `/api/auth/register|login` + httpOnly cookie). Those endpoints are gone (`auth.ts` now only has `/me` and a no-op `/logout`). The current source of truth is `CLERK_BACKEND_INTEGRATION.md`. Don't resurrect JWT auth.
- **Magic-link auth is a separate, experimental flow**: `POST /api/magic-auth/*` (Express) + `convex/magicLinks.ts` mint a JWT in an httpOnly cookie using `JWT_SECRET`, bypassing Clerk entirely, and auto-approve users. Email sending is a TODO — in dev the link/token is returned in the response body. Leave it alone unless explicitly asked to work on it.
- **`lib/db` (drizzle-orm + pg) is unwired**: `@workspace/db` is a declared dependency of api-server but imported nowhere — **all live data is in Convex**. Don't add code to `lib/db` or `lib/api-spec`; don't run its drizzle push scripts.
- **API server hard-requires env vars at boot**: `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY` (or `VITE_CLERK_PUBLISHABLE_KEY`), and `CONVEX_URL`/`CONVEX_DEPLOYMENT_URL` — it throws if missing. Frontend throws without `VITE_CLERK_PUBLISHABLE_KEY`. Env lives in root `.env.local` (loaded via `--env-file-if-exists`); production uses `.env.production` / platform env vars. Never commit real secrets — `.env.production.example` shows the template.
- **CORS is locked down in production** to `ALLOWED_ORIGINS` (comma-separated); dev allows all origins.
- **Payment env vars**: `PAYMENT_PROVIDER=lipana`, `LIPANA_PUBLISHABLE_KEY`, `LIPANA_SECRET_KEY`, `LIPANA_WEBHOOK_SECRET`, `LIPANA_WEBHOOK_URL`, `LIPANA_PRODUCTION=true` for live STK push. Webhook endpoint is `convex/http.ts` at `/lipana/webhook` (Convex-hosted URL), verified against the raw body.
- **Vite dev server requires `strictPort`**: PORT is read from env (default 18090); if the port is taken it fails rather than auto-incrementing.
- **Frontend analytics**: GA4 boots from `initAnalytics()` in `main.tsx` (needs `VITE_GA_MEASUREMENT_ID`); consent-gated by the `CookieConsentBanner` context.
