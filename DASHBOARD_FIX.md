# Dashboard 404 Fix Guide

## Problem Summary
Dashboard API endpoints (`/api/dashboard/summary`, `/api/dashboard/recent-orders`, `/api/dashboard/revenue-trend`) are returning 404 errors.

## Root Cause
The endpoints exist and are deployed, but they require **admin authentication**. The 404 errors are likely caused by one of these issues:

1. User is not logged in
2. User doesn't have admin role in Clerk
3. Clerk JWT token is not being sent with requests
4. API route registration issue

## Verification Steps

### Step 1: Check User Authentication
Open browser console and run:
```javascript
// Check if user is signed in
console.log('Clerk User:', window.Clerk?.user);

// Check if auth token is available
const token = await window.Clerk?.session?.getToken();
console.log('Auth Token:', token ? 'Present' : 'Missing');
```

### Step 2: Verify Admin Role in Clerk Dashboard
1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Navigate to **Users**
3. Find your admin user
4. Click user → **Metadata** tab
5. Under **Public Metadata**, ensure you have:
```json
{
  "role": "admin",
  "approved": true
}
```

### Step 3: Test API Endpoint Directly
Open browser console and run:
```javascript
// Test with credentials
fetch('/api/dashboard/summary', {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
}).then(r => r.json()).then(console.log).catch(console.error);
```

### Step 4: Check Network Requests
1. Open Developer Tools (F12)
2. Go to Network tab
3. Reload the admin dashboard page
4. Look for failed requests to `/api/dashboard/*`
5. Check if:
   - Request has Authorization header or session cookie
   - Response shows 401 (unauthorized) or 403 (forbidden) instead of 404
   - Response body contains error message

## Quick Fixes

### Fix 1: Rebuild and Redeploy API
The routes might not be properly registered. Rebuild the API:

```cmd
cd artifacts\api-server
pnpm run build
```

Then copy to deploy folder and push to production.

### Fix 2: Verify Environment Variables
Check that these are set in **production**:

**Vercel (Frontend)**
- `VITE_CLERK_PUBLISHABLE_KEY`
- `VITE_API_URL` (should be empty for same-domain)

**Backend (Vercel Functions)**
- `CLERK_SECRET_KEY`
- `CONVEX_URL`

### Fix 3: Check Clerk Middleware
Ensure the clerkMiddleware is running before routes:

In `artifacts/api-server/src/app.ts`, verify this order:
1. ✅ CORS middleware
2. ✅ Body parsers
3. ✅ `clerkMiddleware()` ← Must be before routes
4. ✅ Route mounting

### Fix 4: Test with Admin Token
Create a test endpoint that doesn't require admin:

```typescript
// In artifacts/api-server/src/routes/dashboard.ts
router.get("/test", optionalAuth, async (req, res) => {
  res.json({ 
    message: "Dashboard route works",
    user: req.user || null,
    isAdmin: req.user?.role === "admin"
  });
});
```

Test: `https://www.aritwin.co.ke/api/dashboard/test`

## M-PESA Verification

### Verify STK Push Still Works
Test payment flow:
1. Add items to cart
2. Go to checkout
3. Select "Pay with M-Pesa"
4. Enter phone number
5. Click "Place Order and Pay"
6. Check if STK push is received on phone

### Verify Lipa Later Works
Test "Pay Later" flow:
1. Add items to cart
2. Go to checkout
3. Select "Pay Later"
4. Click "Place Order"
5. Check if order is created successfully

### Check Payment Webhook
Ensure webhook URL is configured in Lipana dashboard:
- Webhook URL: `https://aritwin.co.ke/api/payments/webhook/lipana`
- Signature verification enabled

## Implementation Fixes

### Fix: Add Error Logging to Dashboard Component

Add this to `AdminDashboard.tsx`:

```typescript
const { data: summary, isLoading: isLoadingSummary, error: summaryError } = useGetDashboardSummary();

useEffect(() => {
  if (summaryError) {
    console.error('Dashboard Summary Error:', summaryError);
  }
}, [summaryError]);

// Show error state in UI
if (summaryError) {
  return (
    <div className="p-8 text-center">
      <p className="text-red-600">Failed to load dashboard</p>
      <p className="text-sm text-gray-500">{summaryError.message}</p>
    </div>
  );
}
```

### Fix: Add Authentication Debug Route

Create `artifacts/api-server/src/routes/debug.ts`:

```typescript
import { Router } from "express";
import { optionalAuth, requireAdmin } from "../middlewares/auth.js";

const router = Router();

// Public test endpoint
router.get("/public", (req, res) => {
  res.json({ message: "Public route works", timestamp: new Date().toISOString() });
});

// Authenticated test endpoint
router.get("/auth", optionalAuth, (req, res) => {
  res.json({ 
    message: "Auth route works",
    user: req.user || null,
    hasAuth: !!req.auth,
    timestamp: new Date().toISOString()
  });
});

// Admin test endpoint
router.get("/admin", requireAdmin, (req, res) => {
  res.json({ 
    message: "Admin route works",
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

export default router;
```

Register in `routes/index.ts`:
```typescript
import debugRouter from "./debug.js";
router.use("/debug", debugRouter);
```

Test endpoints:
- `GET /api/debug/public` - Should always work
- `GET /api/debug/auth` - Shows your auth status
- `GET /api/debug/admin` - Should work only for admin users

## Expected Results After Fix

✅ Dashboard loads without errors
✅ Summary cards show revenue/orders data
✅ Revenue trend chart displays correctly
✅ Recent orders table populated
✅ M-PESA STK push still functional
✅ Lipa Later flow still works

## If Dashboard Still Doesn't Work

### Check Convex Functions
Verify dashboard functions are deployed in Convex:

1. Go to [Convex Dashboard](https://dashboard.convex.dev/)
2. Select your project (grand-dachshund-295)
3. Navigate to Functions
4. Confirm these exist:
   - `dashboard:summary`
   - `dashboard:recentOrders`
   - `dashboard:revenueTrend`

### Deploy Convex Functions
If functions are missing:

```cmd
cd convex
npx convex deploy
```

## Monitoring

After applying fixes, monitor these:

1. **Browser Console** - No 404 errors
2. **Network Tab** - Dashboard requests return 200
3. **Vercel Logs** - No API errors
4. **Clerk Dashboard** - Check session activity

## Rollback Plan

If fixes break M-PESA:
1. Revert to last working commit:
   ```cmd
   git log --oneline -10
   git revert <commit-hash>
   ```

2. Test M-PESA flow
3. Redeploy

---

**Next Steps:**
1. Apply Fix 4 (test endpoint)
2. Test authentication flow
3. Verify admin role in Clerk
4. Rebuild API if needed
5. Test M-PESA separately

**Priority:** HIGH
**Estimated Time:** 30 minutes
