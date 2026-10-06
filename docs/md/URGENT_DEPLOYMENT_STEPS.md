# 🚨 URGENT: Vercel Deployment Fix

## Current Problem
Your website at `https://www.aritwin.co.ke` shows CORS errors because the API isn't working.

## ✅ What I Fixed in Code
1. Updated `vercel.json` to build API server for serverless functions
2. Fixed `api/tsconfig.json` configuration
3. Added both `www` and non-www domains to CORS whitelist
4. Configured Express app to run as Vercel serverless function

## ⚠️ WHAT YOU NEED TO DO NOW (5 MINUTES)

### Step 1: Add Environment Variables to Vercel

Go to: https://vercel.com/mufasa78/ariawater/settings/environment-variables

Copy all values from your `.env.local` file and add them to Vercel:

**Required Variables:**
```
CLERK_SECRET_KEY=<copy from .env.local>
CONVEX_URL=https://grand-dachshund-295.convex.cloud/
CONVEX_DEPLOYMENT_URL=https://grand-dachshund-295.convex.cloud/
ALLOWED_ORIGINS=https://aritwin.co.ke,https://www.aritwin.co.ke
FRONTEND_URL=https://www.aritwin.co.ke
PAYMENT_PROVIDER=lipana
LIPANA_PUBLISHABLE_KEY=<copy from .env.local>
LIPANA_SECRET_KEY=<copy from .env.local>
LIPANA_WEBHOOK_SECRET=<copy from .env.local>
LIPANA_WEBHOOK_URL=https://www.aritwin.co.ke/api/payments/webhook/lipana
VITE_API_URL=https://www.aritwin.co.ke
VITE_CLERK_PUBLISHABLE_KEY=<copy from .env.local>
NODE_ENV=production
PORT=3000
```

**For each variable:**
- Select: ✅ Production, ✅ Preview, ✅ Development
- Click "Save"

### Step 2: Redeploy

1. Go to: https://vercel.com/mufasa78/ariawater
2. Click "Deployments" tab
3. Find the latest deployment
4. Click the **⋯** (three dots) menu
5. Click "Redeploy"
6. ✅ Check "Use existing Build Cache"
7. Click "Redeploy"

### Step 3: Wait & Test (2-3 minutes)

Wait for deployment to complete, then test:

**Test 1:** https://www.aritwin.co.ke/api/healthz
Should return: `{"status":"ok"}`

**Test 2:** https://www.aritwin.co.ke/shop
Products should load without errors

**Test 3:** Check browser console (F12)
Should be NO CORS errors

---

## How It Works Now

```
User visits: www.aritwin.co.ke/shop
     ↓
Browser requests: /api/products
     ↓
Vercel routes to: /api serverless function
     ↓
Express app (running serverless) queries Convex
     ↓
Convex returns products
     ↓
API returns to browser
     ↓
React renders products
```

Your Express API server now runs as a **Vercel Serverless Function** instead of needing a separate server on Render/Railway.

---

## Why This is Better

**Before:**
- Frontend on Vercel
- Backend on Render (not deployed) ❌
- Convex database
- Result: CORS errors, site broken

**After:**
- Frontend + Backend both on Vercel ✅
- Backend runs as serverless function ✅
- Convex database
- Result: Everything works!

---

## Benefits
- ✅ No separate backend server needed
- ✅ Free hosting (within Vercel free tier limits)
- ✅ Automatic scaling
- ✅ Same domain = no CORS issues
- ✅ Faster (no extra network hop)
- ✅ Simpler deployment

---

## After Deployment Works

Then you need to:

1. **Set admin role in Clerk Dashboard**
   - Go to: https://dashboard.clerk.com/
   - Find user: admin@aritwin.co.ke
   - Add to Public Metadata:
     ```json
     {
       "role": "admin",
       "approved": true
     }
     ```

2. **Test all features**
   - ✅ User signup/login
   - ✅ Guest checkout
   - ✅ M-PESA payments
   - ✅ Admin dashboard

---

## If You Get Stuck

### Build Fails?
Check build logs in Vercel deployment details. Common issues:
- Missing environment variables
- TypeScript errors

### API Returns 500?
Check function logs:
1. Go to deployment in Vercel
2. Click "Functions" tab
3. Click on `/api` function
4. View logs for errors

### Still CORS Errors?
Double-check `ALLOWED_ORIGINS` includes both:
```
https://aritwin.co.ke,https://www.aritwin.co.ke
```

---

## Summary

**What Changed:**
- Express API now runs on Vercel as serverless function (not separate server)
- CORS configured for both www and non-www domains
- All code committed and pushed to GitHub

**What You Must Do:**
1. Add environment variables to Vercel (5 min)
2. Redeploy from Vercel dashboard (3 min)
3. Test the site

**Estimated Total Time:** 10 minutes

---

**Priority:** 🚨 CRITICAL - Do this now to fix your site
