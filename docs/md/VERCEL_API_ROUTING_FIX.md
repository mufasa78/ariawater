# Vercel API Routing Fix - CRITICAL

## Problem Identified

All API endpoints returning 404 errors:
- `/api/dashboard/*` - 404
- `/api/orders` - 404 then 401/500
- All other API routes failing

## Root Cause

**Vercel was NOT routing API requests to the serverless function!**

The issue was in how the API serverless functions were configured:

###  BEFORE (Broken):
```
api/
├── [...path].js  ← Catch-all file (Vercel doesn't support this syntax properly)
└── index.js      ← Also present, causing conflicts
```

```json
// vercel.json
{
  "rewrites": [
    {
      "source": "/((?!api(?:/|$)).*)",
      "destination": "/index.html"
    }
  ]
}
```

**Problems:**
1. Vercel doesn't properly handle `[...path].js` catch-all syntax in /api directory
2. Having both `index.js` and `[...path].js` caused routing conflicts  
3. No explicit rewrite rule to route `/api/*` to the serverless function
4. API requests were hitting Vercel's routing layer but not reaching our Express app

### ✅ AFTER (Fixed):
```
api/
└── index.js      ← Single entry point for ALL API routes
```

```json
// vercel.json
{
  "functions": {
    "api/**/*.js": {
      "memory": 1024,
      "maxDuration": 10
    }
  },
  "rewrites": [
    {
      "source": "/api/:path*",          ← NEW: Explicitly route all /api/* 
      "destination": "/api"              ← to api/index.js
    },
    {
      "source": "/((?!api(?:/|$)).*)",
      "destination": "/index.html"
    }
  ]
}
```

## How Vercel Routing Works

1. **Request comes in:** `GET /api/dashboard/summary`
2. **Vercel checks rewrites:** Matches `/api/:path*` rule
3. **Routes to:** `/api` (which is `api/index.js`)
4. **Function executes:** Imports Express app from `artifacts/api-server/dist/serverless.mjs`
5. **Express handles:** Routes request to dashboard controller
6. **Response returned:** 200 OK with dashboard data

## Changes Made

### 1. Simplified API Structure ✅
- **Removed:** `api/[...path].js` (catch-all that didn't work)
- **Kept:** `api/index.js` as single entry point
- All API routes now go through one serverless function

### 2. Added Explicit Rewrite Rule ✅
```json
{
  "source": "/api/:path*",
  "destination": "/api"
}
```
This tells Vercel: "Any request to `/api/anything` should be handled by `/api/index.js`"

### 3. Configured Function Settings ✅
```json
{
  "functions": {
    "api/**/*.js": {
      "memory": 1024,
      "maxDuration": 10
    }
  }
}
```
- Increased memory to 1GB for better performance
- Set 10-second timeout for API requests

## Testing After Deployment

Wait 2-3 minutes for Vercel deployment, then test:

### Test 1: Health Check
```bash
curl https://www.aritwin.co.ke/api/health
```
**Expected:**
```json
{
  "status": "ok",
  "timestamp": "2026-08-10T14:20:00.000Z"
}
```

### Test 2: Debug Endpoints
```bash
# Public endpoint
curl https://www.aritwin.co.ke/api/debug/public

# Auth status (in browser while logged in)
https://www.aritwin.co.ke/api/debug/auth

# Admin test (requires admin role)
https://www.aritwin.co.ke/api/debug/admin
```

### Test 3: Dashboard Endpoints
```bash
# Summary (requires admin auth - test in browser while logged in)
curl https://www.aritwin.co.ke/api/dashboard/summary \
  -H "Cookie: your-session-cookie"
```

### Test 4: Orders Endpoint
```bash
# List orders (requires auth)
curl https://www.aritwin.co.ke/api/orders?page=1&limit=20 \
  -H "Cookie: your-session-cookie"
```

## Expected Outcomes

### ✅ SUCCESS Indicators:

1. **No more 404 errors:**
   - `/api/dashboard/summary` → 200 OK or 401/403 (auth required)
   - `/api/orders` → 200 OK or 401 (auth required)
   - `/api/debug/public` → 200 OK (always works)

2. **Dashboard loads:**
   - Admin users see revenue/orders data
   - Non-admin users see helpful error message
   - No 404 errors in console

3. **Orders page works:**
   - Shows list of orders
   - Can filter and paginate
   - Order details load

4. **M-Pesa still works:**
   - STK push initiated
   - Payment status polling works
   - Orders created successfully

### ❌ If Still Getting 404s:

This would indicate a Vercel deployment issue:

1. **Check Vercel deployment logs:**
   - Go to Vercel Dashboard
   - Check latest deployment
   - Look for build errors

2. **Verify file structure:**
   - Ensure `api/index.js` exists in deployed build
   - Check `vercel.json` is deployed correctly

3. **Check environment variables:**
   - `CLERK_SECRET_KEY` - Required for auth
   - `CONVEX_URL` - Required for database
   - All Lipana keys for M-Pesa

## Why Orders Were Showing 401/500

The orders endpoint was getting hit AFTER the 404s because:

1. **First few requests:** 404 (API not reached at all)
2. **After retry:** 401 (API reached but user not authenticated)
3. **Sometimes:** 500 (API reached but server error)

This pattern confirms the routing issue - when Vercel managed to route correctly (intermittently), the API was working but returning auth errors.

## Architecture Overview

```
User Request
    ↓
https://www.aritwin.co.ke/api/dashboard/summary
    ↓
[Vercel Edge Network]
    ↓
[Checks vercel.json rewrites]
    ↓
Matches: /api/:path* → /api
    ↓
[Executes api/index.js serverless function]
    ↓
Imports: artifacts/api-server/dist/serverless.mjs
    ↓
[Express App with all routes]
    ↓
/dashboard/summary route handler
    ↓
requireAdmin middleware (checks Clerk auth)
    ↓
Convex query: dashboard.summary
    ↓
Response: JSON with dashboard data
```

## Prevention

To avoid this issue in future:

1. **Keep API structure simple:**
   - Single `api/index.js` entry point
   - Let Express handle routing internally

2. **Test locally first:**
   ```bash
   vercel dev
   # Test all endpoints before deploying
   ```

3. **Monitor Vercel function logs:**
   - Check for invocation failures
   - Watch for cold start times

4. **Use explicit rewrites:**
   - Don't rely on Vercel's implicit routing
   - Always define how /api/* should be handled

## Files Modified

### Changed:
- `vercel.json` - Added rewrite rule and function config
- `api/index.js` - Recreated as single entry point

### Deleted:
- `api/[...path].js` - Removed conflicting catch-all

## Deployment Status

- ✅ Changes committed
- ✅ Pushed to GitHub  
- ⏳ Waiting for Vercel deployment (~2-3 minutes)
- ⏳ Test endpoints after deployment

## Next Steps

1. **Wait for deployment** (check Vercel dashboard)
2. **Test /api/health** endpoint
3. **Test /api/debug/public** endpoint
4. **Login as admin** and test dashboard
5. **Test orders page**
6. **Test M-Pesa payment flow**

---

**Priority:** CRITICAL  
**Status:** Fix deployed, waiting for Vercel  
**ETA:** 2-3 minutes for deployment

**Last Updated:** 2026-08-10 14:25
