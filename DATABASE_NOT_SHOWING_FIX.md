# Database Products Not Showing - URGENT FIX

## Current Situation

You have products in Convex database, but they're not showing on the website because:
1. ❌ API serverless functions not deployed to Vercel
2. ❌ Environment variables not added to Vercel
3. ❌ Without env vars, API can't connect to Convex

Result: Website can't fetch products from database.

---

## Root Cause

**The API endpoint isn't working because:**

```
Browser → www.aritwin.co.ke/api/products
          ↓
       Vercel serverless function
          ↓
       NEEDS CONVEX_URL environment variable
          ↓
       ❌ Variable missing → Can't connect to database
          ↓
       Returns 404 or 500 error
```

---

## IMMEDIATE FIX (5 Minutes)

### Step 1: Add Environment Variables to Vercel

Go to: https://vercel.com/mufasa78/ariawater/settings/environment-variables

**Add these CRITICAL variables:**

```
CONVEX_URL=https://grand-dachshund-295.convex.cloud/
CONVEX_DEPLOYMENT_URL=https://grand-dachshund-295.convex.cloud/
CLERK_SECRET_KEY=<get from .env.local file>
ALLOWED_ORIGINS=https://aritwin.co.ke,https://www.aritwin.co.ke
NODE_ENV=production
```

**For each variable:**
- Click "Add New"
- Enter name and value
- Select: ✅ Production, ✅ Preview, ✅ Development
- Click "Save"

### Step 2: Redeploy

1. Go to: https://vercel.com/mufasa78/ariawater
2. Click "Deployments" tab
3. Click ⋯ on latest deployment
4. Click "Redeploy"
5. Wait 2-3 minutes

### Step 3: Test API

**Test 1: Health Check**
```
https://www.aritwin.co.ke/api/healthz
```
Should return: `{"status":"ok"}`

**Test 2: Products**
```
https://www.aritwin.co.ke/api/products
```
Should return: Array of products from your database

**Test 3: Shop Page**
```
https://www.aritwin.co.ke/shop
```
Should display products

---

## Test Locally FIRST (Recommended)

Before deploying, verify locally that database connection works:

### Run Test Script

```cmd
test-convex-connection.cmd
```

This will:
1. Check .env.local exists
2. Start API server
3. Tell you test URLs

### Manual Test

**Terminal 1 - Start API:**
```bash
cd "d:\Work\Websites\Aria Water\App\Aria-Water-Management\aria-water"
pnpm --filter @workspace/api-server run dev
```

Wait for: `Server listening on port 3000`

**Terminal 2 - Test API:**
```bash
# Test health
curl http://localhost:3000/api/healthz

# Test products
curl http://localhost:3000/api/products

# Test with filter
curl "http://localhost:3000/api/products?inStock=true"
```

**Expected Response:**
```json
[
  {
    "id": "...",
    "name": "20L Water Bottle",
    "priceKes": 150,
    "stockQuantity": 100,
    "isActive": true,
    ...
  }
]
```

**If you get empty array `[]`:**
Products exist but filters are too restrictive.

**If you get error:**
- Check CONVEX_URL in .env.local
- Check Convex dashboard has products

---

## Verify Products Exist in Convex

### Go to Convex Dashboard

1. Open: https://dashboard.convex.dev/
2. Select your project: `grand-dachshund-295`
3. Click "Data" tab
4. Click "products" table
5. Check products exist

### Product Requirements

Each product needs:
- `name` - Product name
- `sku` - Unique SKU
- `priceKes` - Price in Kenyan shillings
- `stockQuantity` - Must be > 0 to show on shop
- `isActive` - Must be `true`
- `packSize` - e.g., "20L", "10L"

### Add Sample Product (If Needed)

In Convex dashboard Data tab:

```json
{
  "name": "20L Water Bottle",
  "sku": "WATER-20L-001",
  "description": "Pure drinking water, 20 liter bottle",
  "packSize": "20L",
  "priceKes": 150,
  "stockQuantity": 100,
  "isActive": true,
  "category": "water",
  "imageUrl": null
}
```

---

## Debugging: Why Products Don't Show

### Issue 1: No Products Returned

**Symptoms:**
- API returns `[]` (empty array)
- No errors in console

**Causes:**
- `isActive` is false
- `stockQuantity` is 0
- Query filter too restrictive

**Fix:**
1. Go to Convex dashboard
2. Check products table
3. Set `isActive = true`
4. Set `stockQuantity > 0`

### Issue 2: API Returns 500 Error

**Symptoms:**
- API request fails
- Server logs show error

**Causes:**
- Can't connect to Convex
- `CONVEX_URL` missing or wrong
- Convex deployment offline

**Fix:**
1. Check environment variables in Vercel
2. Verify `CONVEX_URL=https://grand-dachshund-295.convex.cloud/`
3. Check Convex dashboard - deployment should be green

### Issue 3: API Returns 404

**Symptoms:**
- `/api/products` not found
- Serverless function not deployed

**Causes:**
- API not built during Vercel deployment
- Build command wrong
- `vercel.json` misconfigured

**Fix:**
1. Check `vercel.json` has correct build command
2. Check Vercel build logs for errors
3. Ensure `artifacts/api-server/dist/serverless.mjs` was created

### Issue 4: CORS Errors

**Symptoms:**
- Browser blocks requests
- "Access-Control-Allow-Origin" error

**Fix:**
- Already fixed in latest code (uses relative URLs)
- Ensure `VITE_API_URL` is empty or removed in Vercel

---

## Vercel Build Verification

### Check Build Logs

1. Go to latest Vercel deployment
2. Click "Build Logs"
3. Look for:

```
> @workspace/api-server@0.0.0 build
Building API server...
✓ dist/index.mjs created
✓ dist/serverless.mjs created
Done in 47s
```

**If not found:**
- Build command is wrong
- Check `vercel.json`

### Check Functions Tab

1. In Vercel deployment
2. Click "Functions" tab
3. Should see: `/api` function (Node.js)

**If missing:**
- API didn't build
- Redeploy after fixing build command

---

## Complete Environment Variables Checklist

### Backend (CRITICAL for database connection)

```
CONVEX_URL=https://grand-dachshund-295.convex.cloud/
CONVEX_DEPLOYMENT_URL=https://grand-dachshund-295.convex.cloud/
CLERK_SECRET_KEY=<from .env.local>
ALLOWED_ORIGINS=https://aritwin.co.ke,https://www.aritwin.co.ke
NODE_ENV=production
PORT=3000
```

### Payment (For M-PESA)

```
PAYMENT_PROVIDER=lipana
LIPANA_PUBLISHABLE_KEY=<from .env.local>
LIPANA_SECRET_KEY=<from .env.local>
LIPANA_WEBHOOK_SECRET=<from .env.local>
LIPANA_WEBHOOK_URL=https://www.aritwin.co.ke/api/payments/webhook/lipana
```

### Frontend

```
VITE_CLERK_PUBLISHABLE_KEY=<from .env.local>
VITE_API_URL=  (leave empty!)
```

---

## Success Criteria

✅ **Local Test:**
- `curl http://localhost:3000/api/products` returns products
- No connection errors
- Products array not empty

✅ **Production:**
- `https://www.aritwin.co.ke/api/products` returns 200
- Response contains products from database
- Shop page displays products
- No 404 or CORS errors

---

## If Still Not Working

### Check 1: Convex Dashboard

- Deployment status: Green ✓
- Products table: Has data
- No error messages

### Check 2: Vercel Function Logs

1. Go to deployment
2. Click "Functions"
3. Click `/api`
4. Check logs for errors:
   - Connection errors → Check CONVEX_URL
   - Auth errors → Check CLERK_SECRET_KEY
   - Query errors → Check Convex query syntax

### Check 3: Network Tab in Browser

1. Open shop page
2. Press F12
3. Go to Network tab
4. Find `/api/products` request
5. Check:
   - Status code (should be 200)
   - Response (should have products array)
   - Request URL (should have www)

### Check 4: Rebuild Everything

```bash
cd "d:\Work\Websites\Aria Water\App\Aria-Water-Management\aria-water"

# Clean
rm -rf artifacts/api-server/dist
rm -rf artifacts/ari-water/dist

# Rebuild
pnpm run typecheck:libs
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/ari-water run build

# Verify serverless bundle exists
dir artifacts\api-server\dist\serverless.mjs

# Commit and push
git add -A
git commit -m "rebuild: ensure API serverless bundle is created"
git push
```

---

## Quick Command Reference

**Test API locally:**
```cmd
test-convex-connection.cmd
```

**Test with curl:**
```bash
curl http://localhost:3000/api/products
curl "http://localhost:3000/api/products?inStock=true"
```

**Check build output:**
```cmd
dir artifacts\api-server\dist
```

**View Convex data:**
```
https://dashboard.convex.dev/
```

---

## Summary

**Why products don't show:**
1. API serverless function needs environment variables
2. Without CONVEX_URL, can't connect to database
3. Without connection, no products can be fetched

**The fix:**
1. Add CONVEX_URL (and other env vars) to Vercel
2. Redeploy
3. Products will load from database

**Time to fix:** 5 minutes once env vars are added

---

**Status:** 🚨 BLOCKING ISSUE
**Action:** Add environment variables to Vercel NOW
**Priority:** CRITICAL - Site completely broken without this
