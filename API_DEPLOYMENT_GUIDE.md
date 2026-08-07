# API Deployment Guide - URGENT FIX NEEDED

## Current Problem

Your frontend (Vercel) is trying to call APIs at `https://aritwin.co.ke/api/*`, but:
- ❌ The backend API server is NOT deployed
- ❌ CORS is blocking requests from `https://www.aritwin.co.ke`
- ❌ Products are not loading because Convex can't be reached

## Solution: Deploy Backend API Server

### Option 1: Deploy to Render.com (RECOMMENDED)

#### Step 1: Create Render Account
1. Go to https://render.com/
2. Sign up with GitHub
3. Connect your `mufasa78/ariawater` repository

#### Step 2: Create New Web Service
1. Click "New +" → "Web Service"
2. Select your `ariawater` repository
3. Configure:
   - **Name:** `aria-water-api`
   - **Region:** Oregon (or closest to Kenya)
   - **Branch:** `main`
   - **Root Directory:** `.` (leave empty)
   - **Runtime:** Node
   - **Build Command:**
     ```bash
     pnpm install --frozen-lockfile && pnpm run typecheck:libs && pnpm --filter @workspace/api-server run build
     ```
   - **Start Command:**
     ```bash
     cd artifacts/api-server && node dist/index.mjs
     ```
   - **Plan:** Starter (Free) or Standard ($7/month for better performance)

#### Step 3: Add Environment Variables
In Render dashboard, add these environment variables:

```bash
NODE_ENV=production
PORT=10000

# Clerk Authentication
CLERK_SECRET_KEY=sk_live_xxx_get_from_env_local

# Convex Database
CONVEX_URL=https://grand-dachshund-295.convex.cloud/
CONVEX_DEPLOYMENT_URL=https://grand-dachshund-295.convex.cloud/

# CORS - IMPORTANT: Include both www and non-www
ALLOWED_ORIGINS=https://aritwin.co.ke,https://www.aritwin.co.ke
FRONTEND_URL=https://www.aritwin.co.ke

# Lipana M-PESA Payments
PAYMENT_PROVIDER=lipana
LIPANA_PUBLISHABLE_KEY=lip_pk_live_xxx_get_from_env_local
LIPANA_SECRET_KEY=lip_sk_live_xxx_get_from_env_local
LIPANA_WEBHOOK_SECRET=xxx_get_from_env_local
LIPANA_WEBHOOK_URL=https://aria-water-api.onrender.com/api/payments/webhook/lipana
```

#### Step 4: Deploy
1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. Your API will be at: `https://aria-water-api.onrender.com`

#### Step 5: Update Vercel Environment Variables
1. Go to Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Update/Add:
   ```
   VITE_API_URL=https://www.aritwin.co.ke
   ```
   (Keep it as same domain since we're proxying)

5. Redeploy frontend

---

### Option 2: Deploy to Railway.app

#### Step 1: Create Railway Account
1. Go to https://railway.app/
2. Sign up with GitHub

#### Step 2: Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Select `mufasa78/ariawater`
4. Configure:
   - **Build Command:**
     ```bash
     pnpm install && pnpm run typecheck:libs && pnpm --filter @workspace/api-server run build
     ```
   - **Start Command:**
     ```bash
     cd artifacts/api-server && node dist/index.mjs
     ```

#### Step 3: Add Environment Variables
Same as Render (see above), but use Railway's dashboard

#### Step 4: Get Domain
Railway will give you a domain like: `aria-water-api.up.railway.app`

---

## Current Configuration Status

### ✅ Files Updated
- `vercel.json` - Now proxies `/api/*` to Render backend
- `.env.local` - CORS includes both www and non-www
- `deploy/api/.env.production` - CORS configuration updated

### ⚠️ Action Required
1. **Deploy backend API to Render or Railway** (15 minutes)
2. **Add all environment variables** to hosting platform
3. **Update `vercel.json`** if your backend URL is different
4. **Redeploy Vercel frontend**

---

## Testing After Deployment

### 1. Test API Health Check
```bash
curl https://aria-water-api.onrender.com/api/healthz
```
Should return: `{"status":"ok"}`

### 2. Test Products Endpoint
```bash
curl https://aria-water-api.onrender.com/api/products?inStock=true
```
Should return products array

### 3. Test CORS
```bash
curl -H "Origin: https://www.aritwin.co.ke" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://aria-water-api.onrender.com/api/products
```
Should return CORS headers

### 4. Test Frontend
1. Go to https://www.aritwin.co.ke/shop
2. Products should load
3. Check browser console - no CORS errors

---

## Alternative: If You Can't Deploy Backend Right Now

### Quick Fix: Use Vercel Serverless Functions

This is NOT ideal for production, but can work temporarily:

1. **Update `vercel.json`:**
```json
{
  "buildCommand": "pnpm run build",
  "outputDirectory": "artifacts/ari-water/dist/public",
  "framework": "vite"
}
```

2. **Create Vercel API Routes:** (Not recommended with your current setup)

---

## Recommended Architecture

```
┌─────────────────────────────────────┐
│  Frontend (Vercel)                  │
│  https://www.aritwin.co.ke          │
│  https://aritwin.co.ke              │
└────────────┬────────────────────────┘
             │
             │ Proxy /api/* requests
             │
             ▼
┌─────────────────────────────────────┐
│  Backend API (Render/Railway)       │
│  https://aria-water-api.onrender.com│
│  - Express Server                   │
│  - Clerk Authentication             │
│  - M-PESA Payments                  │
└────────────┬────────────────────────┘
             │
             │ Queries
             │
             ▼
┌─────────────────────────────────────┐
│  Convex Database                    │
│  https://grand-dachshund-295.       │
│  convex.cloud/                      │
└─────────────────────────────────────┘
```

---

## Cost Estimate

### Free Tier (Good for development/testing)
- **Vercel:** Free (includes 100GB bandwidth)
- **Render:** Free (sleeps after 15 min inactivity)
- **Convex:** Free (up to 1M function calls/month)
- **Clerk:** Free (up to 5,000 MAUs)
- **Total:** $0/month

### Production Tier (Recommended)
- **Vercel:** Free
- **Render Starter:** $7/month (always on, 512MB RAM)
- **Convex:** $25/month (unlimited functions)
- **Clerk:** Free (or $25/month for advanced features)
- **Total:** ~$32-57/month

---

## Immediate Next Steps (DO THIS NOW)

1. ✅ Code changes committed (vercel.json, CORS config)
2. ⚠️ **DEPLOY BACKEND TO RENDER** (15 min)
3. ⚠️ **ADD ENVIRONMENT VARIABLES** to Render
4. ⚠️ **VERIFY BACKEND URL** in vercel.json matches Render URL
5. ⚠️ **REDEPLOY VERCEL FRONTEND**
6. ✅ Test shop page loads products

---

## Support

- **Render Docs:** https://render.com/docs
- **Railway Docs:** https://docs.railway.app/
- **Vercel Rewrites:** https://vercel.com/docs/projects/project-configuration#rewrites

---

**Last Updated:** $(Get-Date -Format "yyyy-MM-dd HH:mm")
**Priority:** 🚨 CRITICAL - Site is broken without backend deployment
