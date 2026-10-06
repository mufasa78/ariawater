# Local Testing Guide - Fix 404 Errors

## The Problem

Your shop page shows 404 errors because:
1. ❌ API endpoints aren't deployed to Vercel yet
2. ❌ Environment variables not set in Vercel
3. ❌ The serverless functions aren't running

## Solution: Test Locally First, Then Deploy

### Step 1: Test API Server Locally

Open a terminal and run:

```bash
cd "d:\Work\Websites\Aria Water\App\Aria-Water-Management\aria-water"
pnpm --filter @workspace/api-server run dev
```

This will:
- Build the API server
- Start it on http://localhost:3000
- Connect to Convex database
- Enable Clerk authentication

**Expected Output:**
```
Server listening on port 3000
```

### Step 2: Test Frontend Locally

Open a **NEW** terminal (keep API server running) and run:

```bash
cd "d:\Work\Websites\Aria Water\App\Aria-Water-Management\aria-water"
pnpm --filter @workspace/ari-water run dev
```

This will:
- Build the frontend
- Start it on http://localhost:5173
- Connect to local API server

**Expected Output:**
```
  ➜  Local:   http://localhost:5173/
```

### Step 3: Test in Browser

1. Open: http://localhost:5173/shop
2. Check browser console (F12)
3. Look for errors

**If you see 404 errors:**
- API server not running
- Wrong API URL in `.env.local`

**If products don't load:**
- Check Convex has products
- Check API endpoint: http://localhost:3000/api/products?inStock=true

---

## Quick Fixes for Common Issues

### Issue 1: API Server Won't Start

**Error:** `CLERK_SECRET_KEY must be set`

**Fix:** Check `.env.local` has:
```bash
CLERK_SECRET_KEY=sk_live_xxx
CONVEX_URL=https://grand-dachshund-295.convex.cloud/
```

### Issue 2: Products Don't Load

**Check API directly:**
```bash
curl http://localhost:3000/api/products?inStock=true
```

**If returns empty array `[]`:**
- No products in Convex database
- Add products via Convex dashboard

**If returns error:**
- Check Convex URL is correct
- Check Convex has products table

### Issue 3: CORS Errors Locally

**Error:** `Access-Control-Allow-Origin`

**Fix:** Local development bypasses CORS. This shouldn't happen.

If it does, check `.env.local`:
```bash
NODE_ENV=development  # NOT production
```

### Issue 4: Login Doesn't Work

**Check Clerk configuration:**
1. Go to: https://dashboard.clerk.com/
2. Check "Allowed origins" includes:
   - http://localhost:5173
   - https://www.aritwin.co.ke
   - https://aritwin.co.ke

---

## Production Deployment (After Local Testing Works)

### Step 1: Commit Any Changes

```bash
git add -A
git commit -m "fix: final shop and auth fixes"
git push
```

### Step 2: Add Environment Variables to Vercel

Go to: https://vercel.com/mufasa78/ariawater/settings/environment-variables

**Copy these from `.env.local`:**

```
CLERK_SECRET_KEY=<value from .env.local>
CONVEX_URL=https://grand-dachshund-295.convex.cloud/
CONVEX_DEPLOYMENT_URL=https://grand-dachshund-295.convex.cloud/
ALLOWED_ORIGINS=https://aritwin.co.ke,https://www.aritwin.co.ke
FRONTEND_URL=https://www.aritwin.co.ke
PAYMENT_PROVIDER=lipana
LIPANA_PUBLISHABLE_KEY=<value from .env.local>
LIPANA_SECRET_KEY=<value from .env.local>
LIPANA_WEBHOOK_SECRET=<value from .env.local>
LIPANA_WEBHOOK_URL=https://www.aritwin.co.ke/api/payments/webhook/lipana
VITE_API_URL=https://www.aritwin.co.ke
VITE_CLERK_PUBLISHABLE_KEY=<value from .env.local>
NODE_ENV=production
PORT=3000
```

**For each variable:**
- ✅ Production
- ✅ Preview  
- ✅ Development

### Step 3: Redeploy Vercel

1. Go to: https://vercel.com/mufasa78/ariawater
2. Click "Deployments"
3. Click ⋯ on latest deployment
4. Click "Redeploy"
5. Wait 2-3 minutes

### Step 4: Test Production

**Test API:**
```
https://www.aritwin.co.ke/api/healthz
```
Should return: `{"status":"ok"}`

**Test Products:**
```
https://www.aritwin.co.ke/api/products?inStock=true
```
Should return: Array of products

**Test Shop Page:**
```
https://www.aritwin.co.ke/shop
```
Should show products, no 404 errors

---

## Debugging 404 Errors in Production

### Check 1: Vercel Function Logs

1. Go to deployment in Vercel
2. Click "Functions" tab
3. Look for `/api` function
4. Check logs for errors

**Common errors:**
- Missing environment variables
- Clerk secret key invalid
- Convex URL wrong

### Check 2: Browser DevTools

1. Open shop page
2. Press F12
3. Go to "Network" tab
4. Reload page
5. Look for red entries

**Click on failed request:**
- Request URL - should be `https://www.aritwin.co.ke/api/products`
- Status - 404 means endpoint not found
- Response - error message

### Check 3: Test API Directly

Open in browser:
```
https://www.aritwin.co.ke/api/healthz
```

**If 404:**
- Serverless function didn't deploy
- Check Vercel build logs
- Ensure `vercel.json` is correct

**If 500:**
- Environment variables missing
- Check function logs in Vercel

---

## Vercel Build Command Check

Your `vercel.json` should have:

```json
{
  "buildCommand": "pnpm run typecheck:libs && pnpm --filter @workspace/api-server run build && pnpm --filter @workspace/ari-water run build",
  "outputDirectory": "artifacts/ari-water/dist/public",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api"
    }
  ]
}
```

This ensures:
1. API server is built
2. Frontend is built
3. API requests routed to serverless function

---

## File Structure Check

Verify these files exist:

```
aria-water/
├── api/
│   └── index.js          # Serverless function entry point
├── artifacts/
│   ├── api-server/
│   │   ├── dist/
│   │   │   ├── index.mjs        # Standalone server
│   │   │   └── serverless.mjs   # Serverless bundle ✅
│   │   └── src/
│   │       ├── app.ts
│   │       ├── index.ts
│   │       └── serverless.ts
│   └── ari-water/
│       └── dist/
│           └── public/   # Frontend build output
└── vercel.json
```

**Key file:** `artifacts/api-server/dist/serverless.mjs`
- This is what Vercel deploys
- Must exist after build
- Contains Express app

---

## Success Checklist

Local Testing:
- [ ] API server starts on localhost:3000
- [ ] Frontend starts on localhost:5173
- [ ] Shop page loads products
- [ ] Can add to cart
- [ ] Login works with Clerk
- [ ] No 404 errors in console

Production Testing:
- [ ] `/api/healthz` returns OK
- [ ] `/api/products` returns products
- [ ] Shop page loads without errors
- [ ] Can complete checkout
- [ ] M-PESA payments work

---

## Still Getting 404s?

### Option 1: Check Vercel Deployment Details

1. Go to: https://vercel.com/mufasa78/ariawater
2. Click latest deployment
3. Check "Build Logs"
4. Look for:
   ```
   Building API server...
   dist/serverless.mjs created
   ```

If not found:
- Build command might be wrong
- Check `vercel.json` matches above

### Option 2: Check Serverless Function

1. In Vercel deployment
2. Go to "Functions" tab
3. Should see `/api` function
4. Click to view logs

If no function:
- API wasn't built
- Check build logs

### Option 3: Rebuild Everything

```bash
# Clean build
cd "d:\Work\Websites\Aria Water\App\Aria-Water-Management\aria-water"
rm -rf artifacts/api-server/dist
rm -rf artifacts/ari-water/dist
rm -rf node_modules/.cache

# Rebuild
pnpm run typecheck:libs
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/ari-water run build

# Commit
git add -A
git commit -m "rebuild: fresh build of API and frontend"
git push
```

Then redeploy on Vercel.

---

## Contact Support

If still stuck:
- **Vercel Support:** https://vercel.com/help
- **Clerk Support:** support@clerk.com
- **Convex Discord:** https://convex.dev/community

---

**Priority:** 🚨 Test locally FIRST, then deploy
**Estimated Time:** 
- Local testing: 15 minutes
- Production deploy: 10 minutes
