# Required Production Environment Variables

This document lists every env var the application reads at runtime, where each one
must be set, and what happens if it's missing.

---

## API Server (Express — Render / cPanel)

Set these wherever the API process runs (Render environment settings, or
`deploy/api/.env` for cPanel).

| Variable | Required | What it does | Startup behaviour if missing |
|---|---|---|---|
| `NODE_ENV` | ✅ | Controls CORS, HSTS, logging verbosity | Defaults to `"development"` — HSTS and strict CORS won't engage |
| `PORT` | ✅ | Port the Express server binds to | Defaults to `3000` |
| `CLERK_SECRET_KEY` | **CRITICAL** | Server-side Clerk auth — validates JWTs and fetches user data from Clerk API | **Hard crash on startup** |
| `CLERK_PUBLISHABLE_KEY` | **CRITICAL** | Passed to `clerkMiddleware()` on the server | **Hard crash on startup** |
| `CONVEX_URL` | **CRITICAL** | Convex deployment HTTP endpoint | **Hard crash on startup** |
| `CONVEX_DEPLOYMENT_URL` | ✅ (fallback) | Alternative name for Convex URL — used if `CONVEX_URL` is absent | Hard crash if both are missing |
| `CONVEX_DEPLOY_KEY` | ✅ | Used by `npx convex deploy` CLI only — not read at runtime | Deploy command fails |
| `LIPANA_SECRET_KEY` | **CRITICAL** | Authenticates outgoing M-Pesa STK push requests | **Runtime crash** when a payment is initiated |
| `LIPANA_PUBLISHABLE_KEY` | **CRITICAL** | Identifies your Lipana merchant account | **Runtime crash** when a payment is initiated |
| `LIPANA_WEBHOOK_SECRET` | **CRITICAL** | Verifies `x-lipana-signature` on inbound webhook calls | Webhook returns `401` — payments are never confirmed |
| `LIPANA_ENVIRONMENT` | ✅ | `"sandbox"` or `"production"` — selects Lipana API base URL | Defaults to `"production"` when `NODE_ENV=production` |
| `JWT_SECRET` | ✅ | Signs magic-link JWTs (legacy passwordless flow) | Magic-link login fails |
| `ALLOWED_ORIGINS` | ✅ | Comma-separated CORS allowlist in production | All cross-origin requests blocked in production |
| `FRONTEND_URL` | ✅ | Used in email templates and redirect links | Links in emails point to undefined |

---

## Frontend (Vite — Vercel)

Set these as Vercel environment variables (they are baked into the JS bundle at build time).

| Variable | Required | What it does | Build/runtime behaviour if missing |
|---|---|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | **CRITICAL** | Initialises `<ClerkProvider>` in the browser | **Hard crash** — app throws and won't render |
| `VITE_API_URL` | ✅ | Base URL for API requests. Leave empty for same-domain deployments | API calls go to relative paths (correct for same-domain) |

> `VITE_CLERK_PUBLIC_KEY` is accepted as a fallback alias for `VITE_CLERK_PUBLISHABLE_KEY`.
> Prefer the canonical name.

---

## Convex (Convex Dashboard)

Set these in the Convex dashboard under **Settings → Environment Variables** for the
`grand-dachshund-295` deployment.

| Variable | Required | What it does |
|---|---|---|
| `LIPANA_SECRET_KEY` | **CRITICAL** | Used by `convex/paymentsActions.ts` (`verifyLipanaSignature`) for the HTTP webhook action at `/lipana/webhook` |
| `LIPANA_WEBHOOK_SECRET` | **CRITICAL** | Used by `convex/http.ts` to verify inbound Lipana webhook signatures |

> The Convex HTTP action (`/lipana/webhook`) runs **inside Convex**, not in Express, so
> it reads from Convex env vars — not from the API server's env.

---

## Setting Admin Role

Admin access is controlled by Clerk `publicMetadata`, not a database field. There is no
in-app UI to elevate a user — you must do it from the **Clerk Dashboard**:

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com)
2. Open your application → **Users**
3. Find the user → **Metadata → Public metadata**
4. Set: `{ "role": "admin", "approved": true }`

The frontend `AdminRoute` and the backend `requireAdmin` middleware both read
`publicMetadata.role` — once it's set in Clerk the user can access `/admin/*` routes
and all admin API endpoints immediately.

---

## Quick health check

After deploying, hit this endpoint to verify all critical vars are present:

```
GET /api/debug/env
```

Response includes `clerkConfigured`, `paymentConfigured`, and `convexConfigured`
boolean flags — no secrets are exposed.

---

## Current `.env.production` status

| Key | Present | Notes |
|---|---|---|
| `NODE_ENV` | ✅ | |
| `PORT` | ✅ | |
| `CONVEX_DEPLOY_KEY` | ✅ | |
| `CONVEX_URL` | ✅ | |
| `CONVEX_DEPLOYMENT_URL` | ✅ | |
| `JWT_SECRET` | ✅ | |
| `ALLOWED_ORIGINS` | ✅ | |
| `FRONTEND_URL` | ✅ | |
| `VITE_API_URL` | ✅ | |
| `CLERK_SECRET_KEY` | ❌ **MISSING** | Add to Render/cPanel env |
| `CLERK_PUBLISHABLE_KEY` | ❌ **MISSING** | Add to Render/cPanel env |
| `VITE_CLERK_PUBLISHABLE_KEY` | ❌ **MISSING** | Add to Vercel env (build var) |
| `LIPANA_SECRET_KEY` | ❌ **MISSING** | Add to Render/cPanel env + Convex dashboard |
| `LIPANA_PUBLISHABLE_KEY` | ❌ **MISSING** | Add to Render/cPanel env |
| `LIPANA_WEBHOOK_SECRET` | ❌ **MISSING** | Add to Render/cPanel env + Convex dashboard |
| `LIPANA_ENVIRONMENT` | ⚠️ optional | Omit to default to `"production"` |

> `.env.production` is for reference/cPanel deploys only. **Never commit real secrets.**
> Production keys should be injected via the hosting platform's env settings, not stored
> in this file.
