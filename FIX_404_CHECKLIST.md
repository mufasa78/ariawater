# 🚨 Fix 404 Errors - Complete Checklist

## Current Problem
Your shop page at `https://www.aritwin.co.ke/shop` shows 404 errors because the API serverless functions aren't deployed with environment variables.

---

## ✅ Quick Fix (10 Minutes)

### 1. Add Environment Variables to Vercel (5 min)

**Go to:** https://vercel.com/mufasa78/ariawater/settings/environment-variables

**Click "Add New" and copy values from your `.env.local` file:**

| Variable Name | Get Value From | Scope |
|---------------|----------------|-------|
| `CLERK_SECRET_KEY` | `.env.local` | Production, Preview, Development |
| `CONVEX_URL` | `.env.local` | All |
| `CONVEX_DEPLOYMENT_URL` | `.env.local` | All |
| `ALLOWED_ORIGINS` | Use: `https://aritwin.co.ke,https://www.aritwin.co.ke` | All |
| `FRONTEND_URL` | Use: `https://www.aritwin.co.ke` | All |
| `PAYMENT_PROVIDER` | Use: `lipana` | All |
| `LIPANA_PUBLISHABLE_KEY` | `.env.local` | All |
| `LIPANA_SECRET_KEY` | `.env.local` | All |
| `LIPANA_WEBHOOK_SECRET` | `.env.local` | All |
| `LIPANA_WEBHOOK_URL` | Use: `https://www.aritwin.co.ke/api/payments/webhook/lipana` | All |
| `VITE_API_URL` | Use: `https://www.aritwin.co.ke` | All |
| `VITE_CLERK_PUBLISHABLE_KEY` | `.env.local` | All |
| `NODE_ENV` | Use: `production` | Production only |
| `PORT` | Use: `3000` | All |

**For each variable:**
1. Click "Add New"
2. Enter name
3. Enter value
4. Select: ✅ Production, ✅ Preview, ✅ Development
5. Click "Save"

### 2. Redeploy (3 min)

1. Go to: https://vercel.com/mufasa78/ariawater
2. Click "Deployments" tab
3. Find latest deployment
4. Click **⋯** (three dots)
5. Click "Redeploy"
6. ✅ Check "Use existing Build Cache"
7. Click "Redeploy"
8. Wait 2-3 minutes

### 3. Test (2 min)

**Test 1:** API Health Check
```
https://www.aritwin.co.ke/api/healthz
```
Expected: `{"status":"ok"}`

**Test 2:** Products API
```
https://www.aritwin.co.ke/api/products?inStock=true
```
Expected: Array of products

**Test 3:** Shop Page
```
https://www.aritwin.co.ke/shop
```
Expected: Products load, no 404 errors

---

## 🧪 Local Testing First (Optional but Recommended)

If you want to test locally before deploying:

### Quick Test Script
Run this command:
```cmd
test-local.cmd
```

This will:
- Check `.env.local` exists
- Build API server
- Build frontend
- Tell you next steps

### Manual Testing

**Terminal 1 - Start API:**
```bash
cd "d:\Work\Websites\Aria Water\App\Aria-Water-Management\aria-water"
pnpm --filter @workspace/api-server run dev
```

**Terminal 2 - Start Frontend:**
```bash
cd "d:\Work\Websites\Aria Water\App\Aria-Water-Management\aria-water"
pnpm --filter @workspace/ari-water run dev
```

**Browser:**
```
http://localhost:5173/shop
```

---

## 🔍 Troubleshooting 404 Errors

### Symptom 1: `/api/products` returns 404

**Causes:**
- Serverless function not deployed
- Build didn't include API server
- Environment variables missing

**Solutions:**

**Check Build Logs:**
1. Go to Vercel deployment
2. Click "Build Logs"
3. Look for:
   ```
   > @workspace/api-server@0.0.0 build
   dist/serverless.mjs created
   ```

**If not found:**
- Check `vercel.json` build command
- Should include: `pnpm --filter @workspace/api-server run build`

**Check Functions Tab:**
1. Go to deployment in Vercel
2. Click "Functions" tab
3. Should see `/api` function listed

**If not listed:**
- API didn't build
- Rebuild and redeploy

---

### Symptom 2: API returns 500 error

**Causes:**
- Missing environment variables
- Invalid Clerk secret key
- Convex URL wrong

**Solutions:**

**Check Function Logs:**
1. Go to deployment
2. Click "Functions" tab
3. Click `/api` function
4. Check logs for errors

**Common errors:**
```
Error: CLERK_SECRET_KEY must be set
```
→ Add environment variable

```
Error: CONVEX_URL must be set
```
→ Add environment variable

```
Error: Cannot connect to Convex
```
→ Check Convex URL is correct

---

### Symptom 3: Shop page blank/empty

**Causes:**
- Products don't exist in database
- API returns empty array
- Frontend routing issue

**Solutions:**

**Check API Response:**
```
curl https://www.aritwin.co.ke/api/products?inStock=true
```

**If returns `[]`:**
- No products in Convex
- Add products via Convex dashboard
- Or run seed script

**If returns error:**
- Check function logs
- Verify Convex connection

---

### Symptom 4: CORS errors

**Error:**
```
Access to fetch at 'https://www.aritwin.co.ke/api/products' 
from origin 'https://www.aritwin.co.ke' has been blocked by CORS
```

**Cause:**
- `ALLOWED_ORIGINS` doesn't include www domain

**Solution:**
Check environment variable in Vercel:
```
ALLOWED_ORIGINS=https://aritwin.co.ke,https://www.aritwin.co.ke
```

Must include BOTH www and non-www.

---

### Symptom 5: Login not working

**Causes:**
- Clerk configuration issue
- Wrong publishable key
- Allowed origins not set

**Solutions:**

**Check Clerk Dashboard:**
1. Go to: https://dashboard.clerk.com/
2. Navigate to "API Keys"
3. Verify publishable key matches:
   ```
   VITE_CLERK_PUBLISHABLE_KEY
   ```

**Check Allowed Origins:**
1. In Clerk Dashboard
2. Go to "Domains"
3. Add:
   - `https://www.aritwin.co.ke`
   - `https://aritwin.co.ke`
   - `http://localhost:5173` (for dev)

---

## 📋 Deployment Verification Checklist

After deploying, verify each:

### Backend API
- [ ] `/api/healthz` returns `{"status":"ok"}`
- [ ] `/api/products` returns products array
- [ ] `/api/auth/me` returns 401 (when not logged in)
- [ ] No 500 errors in function logs

### Frontend
- [ ] Home page loads
- [ ] Shop page loads products
- [ ] Can add to cart
- [ ] Cart updates correctly
- [ ] Checkout form appears

### Authentication
- [ ] Can access login page
- [ ] Can access signup page
- [ ] Clerk sign-in works
- [ ] User data appears in app
- [ ] Logout works

### Admin
- [ ] Admin users can access `/admin`
- [ ] Non-admin redirected
- [ ] Dashboard loads
- [ ] Orders visible

### Payments
- [ ] Checkout button works
- [ ] M-PESA prompt appears
- [ ] Payment processing works
- [ ] Order confirmation shown

---

## 🎯 Success Criteria

Your site is working when:

✅ **Shop Page:**
- Products display without 404 errors
- Can add to cart
- Cart count updates
- Checkout form loads

✅ **API:**
- All endpoints return 200 status
- No CORS errors in console
- Functions execute successfully
- Logs show no errors

✅ **Authentication:**
- Login works
- Sign up works
- User profile shows
- Admin access works

✅ **Payments:**
- M-PESA STK push sends
- Payment confirmation works
- Orders created successfully

---

## 🆘 Still Stuck?

### Option 1: Check Everything is Deployed

**Verify these files exist in your repo:**
```
✅ api/index.js
✅ artifacts/api-server/src/serverless.ts
✅ artifacts/api-server/build.mjs
✅ vercel.json
```

**Verify build outputs:**
After running build, check:
```
✅ artifacts/api-server/dist/serverless.mjs
✅ artifacts/ari-water/dist/public/index.html
```

### Option 2: Rebuild from Scratch

```bash
# Clean everything
rm -rf artifacts/api-server/dist
rm -rf artifacts/ari-water/dist
rm -rf node_modules/.cache

# Install fresh
pnpm install

# Build everything
pnpm run typecheck:libs
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/ari-water run build

# Commit and push
git add -A
git commit -m "rebuild: clean build from scratch"
git push
```

### Option 3: Check Vercel Configuration

**Verify in Vercel dashboard:**
1. Framework Preset: Vite
2. Build Command: Uses `vercel.json`
3. Output Directory: `artifacts/ari-water/dist/public`
4. Node Version: 18.x or higher

---

## 📞 Support Resources

- **Local Testing Guide:** `LOCAL_TEST_GUIDE.md`
- **Vercel Guide:** `VERCEL_FIX_GUIDE.md`
- **Auth Guide:** `SHOP_AND_AUTH_VERIFICATION.md`
- **Urgent Steps:** `URGENT_DEPLOYMENT_STEPS.md`

**External Help:**
- Vercel Support: https://vercel.com/help
- Clerk Support: support@clerk.com
- Convex Discord: https://convex.dev/community

---

**Time Estimate:**
- Quick fix (with env vars): 10 minutes
- Full rebuild + deploy: 30 minutes
- Local testing first: 45 minutes

**Priority:** 🚨 CRITICAL
**Status:** Ready to deploy once environment variables are added
