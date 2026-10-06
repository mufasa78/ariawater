# CORS Fix Applied ✅

## Problem Solved
Your shop page was getting CORS errors because:
- Frontend: `https://www.aritwin.co.ke`
- API calls going to: `https://aritwin.co.ke/api` (without www)
- Browser blocked cross-origin requests

## Solution Applied
Changed the frontend to use **relative URLs** instead of absolute URLs:

### Before (BROKEN):
```
www.aritwin.co.ke → fetch("https://aritwin.co.ke/api/products")
❌ CORS Error: Different origins (www vs non-www)
```

### After (FIXED):
```
www.aritwin.co.ke → fetch("/api/products")
✅ Same origin, no CORS issues
```

## Changes Made

### 1. `.env.local`
```bash
# OLD:
VITE_API_URL=https://aritwin.co.ke

# NEW:
VITE_API_URL=
# Empty = use relative URLs (same domain)
```

### 2. `App.tsx`
```tsx
// Now handles empty VITE_API_URL correctly
const apiUrl = import.meta.env.VITE_API_URL;
if (apiUrl) {
  setBaseUrl(apiUrl);
} else {
  setBaseUrl(''); // Use relative URLs
}
```

## What You Need to Do

### Option 1: Update Vercel Environment Variable (Recommended)

1. Go to: https://vercel.com/mufasa78/ariawater/settings/environment-variables
2. Find `VITE_API_URL`
3. **Option A:** Delete it entirely
4. **Option B:** Set it to empty string: ``
5. Redeploy

### Option 2: Set to Same Domain

If you prefer explicit URL:
1. Set `VITE_API_URL` to: `https://www.aritwin.co.ke`
2. This ensures www matches www
3. Redeploy

## Testing After Deploy

### Test 1: Check API directly
Open: https://www.aritwin.co.ke/api/healthz
Expected: `{"status":"ok"}`

### Test 2: Check Shop Page  
1. Open: https://www.aritwin.co.ke/shop
2. Press F12 (DevTools)
3. Go to Network tab
4. Look for `/api/products` request
5. Should show: Status 200, no CORS errors

### Test 3: Verify Request URL
In Network tab:
- Request URL should be: `https://www.aritwin.co.ke/api/products` (with www)
- NOT: `https://aritwin.co.ke/api/products` (without www)

## Why This Works

### Vercel Routing
```
User visits: https://www.aritwin.co.ke/shop
             ↓
Frontend makes request: /api/products (relative URL)
             ↓
Browser resolves to: https://www.aritwin.co.ke/api/products
             ↓
Vercel rewrites: /api/* → /api serverless function
             ↓
Express app handles request
             ↓
Returns products from Convex
```

**Key Point:** Both frontend and API are on **same domain** (www.aritwin.co.ke), so no CORS issues!

## Domain Configuration

### Current Setup
- Primary domain: `https://www.aritwin.co.ke` (with www)
- All traffic should go through www

### Recommended: Redirect non-www to www

In Vercel dashboard:
1. Go to Settings → Domains
2. Ensure `aritwin.co.ke` redirects to `www.aritwin.co.ke`
3. This makes all URLs consistent

## CORS Configuration (Backend)

Your backend already allows both domains:
```bash
ALLOWED_ORIGINS=https://aritwin.co.ke,https://www.aritwin.co.ke
```

This is good for flexibility, but **relative URLs are better** because:
- ✅ No CORS issues ever
- ✅ Works on any domain (staging, production)
- ✅ Faster (no DNS lookup)
- ✅ Simpler configuration

## If Still Getting CORS Errors

### Check 1: Vercel Environment Variable
Make sure `VITE_API_URL` is either:
- Empty/deleted
- OR set to `https://www.aritwin.co.ke` (with www)

### Check 2: Hard Reload
After redeploying:
1. Open shop page
2. Press Ctrl+Shift+R (hard reload)
3. This clears cached JavaScript

### Check 3: Check Request in DevTools
1. F12 → Network tab
2. Look at `/api/products` request
3. Check "Request URL" - should have www

### Check 4: Verify Build
1. Go to Vercel deployment
2. Check build logs
3. Ensure no errors during build

## Success Indicators

✅ Shop page loads without errors
✅ Products display correctly
✅ No CORS errors in console
✅ Network tab shows 200 status for /api/products
✅ Can add products to cart
✅ Checkout works

## Related Files Updated

- ✅ `.env.local` - Removed VITE_API_URL value
- ✅ `deploy/api/.env.production` - Removed VITE_API_URL value
- ✅ `App.tsx` - Enhanced to handle empty URL
- ✅ Code committed and pushed to GitHub

## Next Steps

1. **Update Vercel env var** (remove/empty VITE_API_URL)
2. **Redeploy** from Vercel dashboard
3. **Test** shop page loads
4. **Verify** no CORS errors

After this works, you still need to:
- Add all other environment variables (Clerk, Lipana, etc.)
- Set admin role in Clerk Dashboard
- Test complete checkout flow

---

**Status:** 🚨 CRITICAL FIX APPLIED
**Action Required:** Update Vercel environment variable and redeploy
**Expected Result:** Shop page loads with products, no CORS errors
