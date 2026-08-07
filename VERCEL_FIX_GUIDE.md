# Vercel Deployment Fix Guide

## Current Issue

Your site at `https://www.aritwin.co.ke` is getting CORS errors when trying to access the API because:
1. The API serverless functions aren't being built
2. Environment variables might be missing
3. CORS only allows `https://aritwin.co.ke` but not `https://www.aritwin.co.ke`

## ✅ Code Changes Made

1. **Updated `vercel.json`** - Added API server build step
2. **Updated `.env.local`** - Added both www and non-www to ALLOWED_ORIGINS
3. **Verified serverless setup** - Everything is already configured correctly

## 🔧 Vercel Dashboard Setup Required

### Step 1: Add Environment Variables

Go to your Vercel project dashboard: https://vercel.com/mufasa78/ariawater/settings/environment-variables

Add these environment variables:

#### Clerk Authentication
```
CLERK_SECRET_KEY=sk_live_xxx_get_from_env_local
```

#### Convex Database
```
CONVEX_URL=https://grand-dachshund-295.convex.cloud/
CONVEX_DEPLOYMENT_URL=https://grand-dachshund-295.convex.cloud/
```

#### CORS Configuration (CRITICAL!)
```
ALLOWED_ORIGINS=https://aritwin.co.ke,https://www.aritwin.co.ke
FRONTEND_URL=https://www.aritwin.co.ke
```

#### Lipana M-PESA Payments
```
PAYMENT_PROVIDER=lipana
LIPANA_PUBLISHABLE_KEY=lip_pk_live_xxx_get_from_env_local
LIPANA_SECRET_KEY=lip_sk_live_xxx_get_from_env_local
LIPANA_WEBHOOK_SECRET=xxx_get_from_env_local
LIPANA_WEBHOOK_URL=https://www.aritwin.co.ke/api/payments/webhook/lipana
```

#### Frontend Configuration
```
VITE_API_URL=https://www.aritwin.co.ke
VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxx_get_from_env_local
```

#### Node Environment
```
NODE_ENV=production
PORT=3000
```

### Step 2: Set Environment Scope

For each variable, select:
- ✅ Production
- ✅ Preview
- ✅ Development

### Step 3: Redeploy

After adding all environment variables:
1. Go to **Deployments** tab
2. Click the **3-dot menu** on the latest deployment
3. Click **Redeploy**
4. ✅ Check "Use existing Build Cache"
5. Click **Redeploy**

---

## How It Works

### Architecture

```
┌──────────────────────────────────────────┐
│  Browser                                 │
│  https://www.aritwin.co.ke/shop          │
└───────────────┬──────────────────────────┘
                │
                │ Fetches: /api/products
                │
                ▼
┌──────────────────────────────────────────┐
│  Vercel                                  │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ Static Site (Vite Build)           │ │
│  │ artifacts/ari-water/dist/public/   │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ Serverless Function: /api          │ │
│  │ api/index.js → Express App         │ │
│  │                                    │ │
│  │  - Clerk Authentication            │ │
│  │  - M-PESA Payment Processing       │ │
│  │  - File Uploads                    │ │
│  └────────────┬───────────────────────┘ │
└───────────────┼──────────────────────────┘
                │
                │ Queries Convex
                │
                ▼
┌──────────────────────────────────────────┐
│  Convex (Hosted Database)                │
│  https://grand-dachshund-295.convex.cloud│
│                                          │
│  - Products                              │
│  - Orders                                │
│  - Users                                 │
│  - Reviews                               │
└──────────────────────────────────────────┘
```

### Request Flow

1. **User visits:** `https://www.aritwin.co.ke/shop`
2. **Browser fetches:** `/api/products?inStock=true`
3. **Vercel rewrites** `/api/*` → `/api` serverless function
4. **Serverless function** loads Express app
5. **Express app** validates request with Clerk
6. **Express app** queries Convex database
7. **Convex** returns products
8. **Express** returns products to browser
9. **React** renders products on page

---

## Testing After Deployment

### 1. Check API Health
Open: https://www.aritwin.co.ke/api/healthz

Should return:
```json
{"status":"ok"}
```

### 2. Check Products API
Open: https://www.aritwin.co.ke/api/products?inStock=true

Should return:
```json
[
  {
    "id": "...",
    "name": "20L Water Bottle",
    "priceKes": 150,
    ...
  }
]
```

### 3. Check Shop Page
Open: https://www.aritwin.co.ke/shop

- ✅ Products should load
- ✅ No CORS errors in console
- ✅ Can add products to cart
- ✅ Can proceed to checkout

### 4. Check Admin Dashboard
Open: https://www.aritwin.co.ke/admin

- ✅ Redirects to Clerk login if not authenticated
- ✅ Admin users can access dashboard
- ✅ Orders display correctly

---

## Troubleshooting

### Issue: Still Getting CORS Errors

**Solution:** Check that `ALLOWED_ORIGINS` includes both domains:
```
ALLOWED_ORIGINS=https://aritwin.co.ke,https://www.aritwin.co.ke
```

### Issue: API Returns 500 Error

**Check:**
1. Are all environment variables set in Vercel?
2. Is `CONVEX_URL` correct?
3. Is `CLERK_SECRET_KEY` correct?

**View Logs:**
1. Go to Vercel dashboard
2. Click on deployment
3. Go to "Functions" tab
4. Click on `/api` function
5. View logs

### Issue: Products Not Loading

**Check:**
1. Open browser console (F12)
2. Look for errors
3. Check Network tab for failed requests

**Common causes:**
- Convex URL is wrong
- Products don't exist in database
- API isn't built (check build logs)

### Issue: Build Fails

**Check build logs for:**
- Missing dependencies
- TypeScript errors
- Environment variable issues

**Solution:**
```bash
# Test build locally
pnpm run typecheck:libs
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/ari-water run build
```

---

## Domain Configuration

### Primary Domain
- `www.aritwin.co.ke` - Main site

### Redirect Configuration
Set up redirect from `aritwin.co.ke` → `www.aritwin.co.ke` in Vercel:

1. Go to **Settings** → **Domains**
2. Add `aritwin.co.ke` as domain
3. Enable **Redirect to www**

This ensures all traffic goes through `www` subdomain and simplifies CORS.

---

## Performance Optimization

### Serverless Function Regions
- Default region: Washington, D.C. (iad1)
- Closest to Kenya: Frankfurt (fra1) or Mumbai (bom1)

To change region:
1. Add to `vercel.json`:
```json
{
  "functions": {
    "api/index.js": {
      "memory": 1024,
      "maxDuration": 10,
      "regions": ["fra1"]
    }
  }
}
```

### Convex Edge Functions
Convex automatically routes to nearest region.

---

## Cost Estimate

### Vercel (Free Tier)
- 100GB Bandwidth
- 100 GB-hours serverless execution
- Unlimited static requests

Your current usage should stay within free tier unless you get massive traffic.

### If You Exceed Free Tier
- Vercel Pro: $20/month
- Includes 1TB bandwidth
- 1000 GB-hours execution

---

## Next Steps

1. ✅ Commit and push code changes (already done)
2. ⚠️ **ADD ENVIRONMENT VARIABLES** to Vercel dashboard
3. ⚠️ **REDEPLOY** from Vercel dashboard
4. ✅ Test all endpoints
5. ✅ Set up domain redirect (www)
6. ✅ Test M-PESA payments
7. ✅ Monitor logs for errors

---

## Support

- **Vercel Docs:** https://vercel.com/docs
- **Convex Docs:** https://docs.convex.dev
- **Clerk Docs:** https://clerk.com/docs

---

**Priority:** 🚨 HIGH - Site is currently broken
**Estimated Time:** 10-15 minutes
**Last Updated:** $(Get-Date -Format "yyyy-MM-dd HH:mm")
