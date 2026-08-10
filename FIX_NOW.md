# 🚨 FIX DATABASE 500 ERRORS NOW - 5 MINUTE SOLUTION

**Problem:** All API endpoints returning 500 errors  
**Cause:** `CONVEX_URL` environment variable not set in Vercel  
**Time to Fix:** 5 minutes  

---

## ⚡ QUICK FIX (DO THIS NOW)

### Step 1: Open Vercel Dashboard (1 minute)
1. Go to: **https://vercel.com/dashboard**
2. Click on your **ariawater** project
3. Click **Settings** (top menu)
4. Click **Environment Variables** (left sidebar)

### Step 2: Add CONVEX_URL (2 minutes)
Click **Add New** and enter:

**Name:**
```
CONVEX_URL
```

**Value:**
```
https://grand-dachshund-295.convex.cloud/
```

**Environments:** Select ALL THREE:
- ✅ Production
- ✅ Preview  
- ✅ Development

Click **Save**

### Step 3: Add Other Required Variables (1 minute)

While you're there, verify these are also set. If any are missing, add them:

```
CLERK_SECRET_KEY=<from .env.local>
CLERK_PUBLISHABLE_KEY=<from .env.local>
VITE_CLERK_PUBLISHABLE_KEY=<from .env.local>
VITE_CLERK_PUBLIC_KEY=<from .env.local>
VITE_CLERK_JWKS_URL=https://clerk.aritwin.co.ke/.well-known/jwks.json
VITE_CLERK_ISSUER=https://clerk.aritwin.co.ke

LIPANA_PUBLISHABLE_KEY=<from .env.local>
LIPANA_SECRET_KEY=<from .env.local>
LIPANA_WEBHOOK_SECRET=<from .env.local>

ALLOWED_ORIGINS=https://aritwin.co.ke,https://www.aritwin.co.ke
```

**Get values from:** Your `.env.local` file in the project root

### Step 4: Redeploy (2 minutes)
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click the **"..."** menu (3 dots)
4. Click **"Redeploy"**
5. Wait 2-3 minutes for deployment to complete

### Step 5: Verify Fix (1 minute)
Open this URL in your browser:
```
https://www.aritwin.co.ke/api/debug/env
```

**Should show:**
```json
{
  "message": "Environment variable status...",
  "environment": {
    "CONVEX_URL": true,
    "convexUrl": "https://grand-dachshund-295.convex.cloud/"
  },
  "critical_missing": [],
  "action_required": "All critical variables are set!"
}
```

**Then test products:**
```
https://www.aritwin.co.ke/api/products?inStock=true
```

**Should return:** JSON array of products (NOT 500 error)

---

## ✅ After Fix, Everything Will Work

- ✅ Products load on shop page
- ✅ Can add to cart and checkout
- ✅ M-Pesa payments work
- ✅ Pay Later orders work  
- ✅ Admin dashboard loads
- ✅ Order tracking works
- ✅ No more 500 errors

---

## 🔍 Why This Happened

The API server needs to connect to Convex database using `CONVEX_URL`. 

This variable was in your local `.env.local` file but **not set in Vercel production environment**.

Without it, every API call fails with 500 error because the server can't connect to the database.

---

## 📊 Current Status

| Component | Status | Fix |
|-----------|--------|-----|
| Code | ✅ Working | Already deployed |
| Database (Convex) | ✅ Running | Active and healthy |
| Environment Variables | ❌ Missing | **YOU NEED TO SET THESE** |
| Vercel Deployment | ✅ Ready | Will work after env vars set |

---

## 🆘 Still Having Issues?

### Check 1: Variable Names
Make sure you typed **exactly**:
- `CONVEX_URL` (not `CONVEX_URI` or `CONVEX_PATH`)
- Value must end with `/` slash

### Check 2: Applied to Production
When adding variables, make sure **Production** checkbox is ✅ checked

### Check 3: Redeployed
Environment variable changes require a **Redeploy** to take effect

### Check 4: Convex is Active
Visit https://dashboard.convex.dev and verify your deployment is running

---

## 📞 Quick Verification Commands

After setting variables and redeploying:

```bash
# 1. Check environment variables are set
curl https://www.aritwin.co.ke/api/debug/env

# 2. Check health
curl https://www.aritwin.co.ke/api/debug/health-detailed

# 3. Test products endpoint
curl https://www.aritwin.co.ke/api/products?inStock=true

# 4. Open shop page
# Open: https://www.aritwin.co.ke/shop
# Should show products, no errors
```

---

## 🎯 Success Criteria

After fix:
- [ ] `/api/debug/env` shows CONVEX_URL = true
- [ ] `/api/products` returns products (200 OK)
- [ ] Shop page loads products
- [ ] No console errors
- [ ] Can checkout and place orders
- [ ] Payments work (both M-Pesa and Pay Later)

---

## ⏱️ Timeline

- **Now:** Set CONVEX_URL in Vercel (2 mins)
- **+2 mins:** Redeploy (automatic, 2-3 mins)
- **+5 mins:** Test and verify everything works
- **Total:** 5-7 minutes to full restoration

---

**CRITICAL:** Do this immediately. Your production site is down until CONVEX_URL is set.

**File Reference:** Your `.env.local` has all the correct values  
**Vercel Dashboard:** https://vercel.com/dashboard  
**Created:** 2026-08-10  
**Priority:** P0 - PRODUCTION DOWN

🚨 **GO TO VERCEL NOW AND SET CONVEX_URL**
