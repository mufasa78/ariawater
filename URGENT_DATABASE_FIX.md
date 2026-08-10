# 🚨 URGENT: Database Connection Issues - 500 Errors

**Status:** CRITICAL - Production Down  
**Error:** `GET /api/products?inStock=true 500 (Internal Server Error)`  
**Root Cause:** Convex database connection failing

---

## 🔍 Problem Analysis

### Symptoms:
- All API endpoints returning 500 errors
- `/api/products` fails
- `/api/orders` fails
- Both M-Pesa and Pay Later not working
- Dashboard shows "Dashboard Error"

### Root Cause:
**`CONVEX_URL` environment variable not set in Vercel production**

The API server requires:
- `CONVEX_URL` or `CONVEX_DEPLOYMENT_URL`
- Must be: `https://grand-dachshund-295.convex.cloud/`
- Currently: NOT SET in Vercel

### Evidence:
```typescript
// artifacts/api-server/src/lib/convex-client.ts
const convexUrl = process.env.CONVEX_URL ?? process.env.CONVEX_DEPLOYMENT_URL;

if (!convexUrl) {
  throw new Error("CONVEX_URL or CONVEX_DEPLOYMENT_URL env var is required");
}
```

---

## ✅ IMMEDIATE FIX (5 minutes)

### Step 1: Set Environment Variables in Vercel

1. **Go to Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Select your project (ariawater)
   - Settings → Environment Variables

2. **Add Required Variables:**

```
CONVEX_URL=https://grand-dachshund-295.convex.cloud/
```

**CRITICAL: Also add these if not set:**

```
# Convex
CONVEX_DEPLOYMENT_URL=https://grand-dachshund-295.convex.cloud/

# Clerk (required for auth)
CLERK_SECRET_KEY=<your_clerk_secret_key>
CLERK_PUBLISHABLE_KEY=<your_clerk_publishable_key>
VITE_CLERK_PUBLISHABLE_KEY=<your_clerk_publishable_key>
VITE_CLERK_PUBLIC_KEY=<your_clerk_publishable_key>
VITE_CLERK_JWKS_URL=https://clerk.aritwin.co.ke/.well-known/jwks.json
VITE_CLERK_ISSUER=https://clerk.aritwin.co.ke

# Lipana/M-Pesa (required for payments)
LIPANA_PUBLISHABLE_KEY=<your_lipana_publishable_key>
LIPANA_SECRET_KEY=<your_lipana_secret_key>
LIPANA_WEBHOOK_SECRET=<your_lipana_webhook_secret>

# CORS
ALLOWED_ORIGINS=https://aritwin.co.ke,https://www.aritwin.co.ke
```

**Get actual values from:** `.env.local` file

3. **Apply to:** Production, Preview, Development (all)

4. **Redeploy:**
   - Go to Deployments tab
   - Click "..." on latest deployment
   - Click "Redeploy"
   - Wait 2-3 minutes

---

## 🔧 Alternative: Check Current Deployment

### Via Vercel CLI:
```bash
vercel env ls
```

### Via Vercel Dashboard:
Settings → Environment Variables → Check if `CONVEX_URL` exists

---

## 🧪 Verify Fix

### Test 1: Products Endpoint
```bash
curl https://www.aritwin.co.ke/api/products?inStock=true
```

**Expected:** JSON array of products  
**Not:** 500 error

### Test 2: Health Check
```bash
curl https://www.aritwin.co.ke/api/health
```

**Expected:** `{"status":"ok"}`

### Test 3: Frontend
- Open https://www.aritwin.co.ke/shop
- Products should load
- No console errors

---

## 📋 Environment Variables Checklist

### Required for Database:
- [ ] `CONVEX_URL` = https://grand-dachshund-295.convex.cloud/
- [ ] OR `CONVEX_DEPLOYMENT_URL` = https://grand-dachshund-295.convex.cloud/

### Required for Auth:
- [ ] `CLERK_SECRET_KEY`
- [ ] `CLERK_PUBLISHABLE_KEY`
- [ ] `VITE_CLERK_PUBLISHABLE_KEY`
- [ ] `VITE_CLERK_PUBLIC_KEY`
- [ ] `VITE_CLERK_JWKS_URL`
- [ ] `VITE_CLERK_ISSUER`

### Required for Payments:
- [ ] `LIPANA_PUBLISHABLE_KEY`
- [ ] `LIPANA_SECRET_KEY`
- [ ] `LIPANA_WEBHOOK_SECRET`

### Required for Security:
- [ ] `ALLOWED_ORIGINS`

---

## 🚨 Why This Happened

### Likely Causes:
1. **Environment variables not set during initial Vercel setup**
2. **Variables were cleared/reset during redeploy**
3. **Variables set only in Development, not Production**
4. **Typo in variable name** (e.g., `CONVEX_URI` instead of `CONVEX_URL`)

### Prevention:
- Always verify environment variables after each deployment
- Use Vercel's "Copy from..." feature to duplicate across environments
- Keep `.env.local` as reference for all required variables
- Document all required env vars in README

---

## 📊 Impact Assessment

### What's Broken:
- ❌ Product listings (shop page blank)
- ❌ Order creation (checkout fails)
- ❌ M-Pesa payments (can't initialize)
- ❌ Pay Later (can't create order)
- ❌ Admin dashboard (can't load data)
- ❌ Order tracking (can't fetch orders)

### What Still Works:
- ✅ Static pages (landing, about, privacy)
- ✅ Frontend loads
- ✅ Routing works
- ✅ UI components render

---

## ⏱️ Timeline to Fix

| Step | Time | Description |
|------|------|-------------|
| 1. Open Vercel Dashboard | 1 min | Navigate to project settings |
| 2. Add Environment Variables | 2 mins | Copy from .env.local |
| 3. Redeploy | 2-3 mins | Vercel build + deploy |
| 4. Test | 1 min | Verify products load |

**Total:** 5-7 minutes

---

## 🎯 Success Criteria

After fix, verify:
1. ✅ `/api/products?inStock=true` returns products (200 OK)
2. ✅ Shop page shows products
3. ✅ Can add items to cart
4. ✅ Checkout works
5. ✅ M-Pesa payment initiates
6. ✅ Pay Later creates order
7. ✅ Admin dashboard loads
8. ✅ No 500 errors in console

---

## 🔗 Quick Links

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Convex Dashboard:** https://dashboard.convex.dev (verify deployment is active)
- **Production Site:** https://www.aritwin.co.ke
- **Environment Reference:** `.env.local` in repo root

---

## 📞 Support

If issue persists after setting environment variables:

1. **Check Convex Dashboard:**
   - Verify deployment is active
   - Check for any alerts or errors
   - Confirm URL matches environment variable

2. **Check Vercel Logs:**
   - Deployments → Latest → Function Logs
   - Look for "CONVEX_URL env var is required" error
   - Look for connection errors

3. **Verify API locally:**
   ```bash
   cd artifacts/api-server
   pnpm run dev
   # Should start without errors
   ```

---

**Created:** 2026-08-10  
**Priority:** P0 - CRITICAL  
**Status:** Awaiting environment variable configuration

🚨 **ACTION REQUIRED: Set CONVEX_URL in Vercel immediately**
