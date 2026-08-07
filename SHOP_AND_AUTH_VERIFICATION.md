# Shop Page & Authentication Verification

## ✅ Current Status

### Authentication Setup
- ✅ Clerk fully integrated (frontend + backend)
- ✅ ClerkProvider wraps entire app
- ✅ ClerkAuthWrapper provides compatibility layer
- ✅ useAuth() hook works throughout app
- ✅ Admin route protection implemented
- ✅ JWT tokens automatically injected into API requests

### Shop Page Setup
- ✅ Uses Clerk's `useUser()` hook
- ✅ Guest checkout supported (no login required)
- ✅ Logged-in users get pre-filled checkout form
- ✅ M-PESA payment integration working
- ✅ Cart functionality operational
- ✅ Products fetched from Convex via API

---

## 🔍 How It Works

### Authentication Flow

```
┌─────────────────────────────────────┐
│  User visits site                   │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  ClerkProvider loads                │
│  - Checks for existing session      │
│  - Gets user data if logged in      │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  ClerkAuthWrapper                   │
│  - Maps Clerk user to app User      │
│  - Extracts role from publicMetadata│
│  - Configures API token injection   │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  useAuth() available everywhere     │
│  - user: User | null                │
│  - isLoading: boolean               │
│  - isSignedIn: boolean              │
└─────────────────────────────────────┘
```

### Shop Page Flow

```
┌─────────────────────────────────────┐
│  User visits /shop                  │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  useUser() from Clerk               │
│  - Gets current user (if logged in) │
│  - Returns null if guest            │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  Pre-fill checkout form?            │
│  - YES: Use Clerk user data         │
│  - NO: Show guest checkout fields   │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  Order placement                    │
│  - API request with Clerk JWT       │
│  - Backend validates token          │
│  - Order linked to user ID          │
└─────────────────────────────────────┘
```

---

## 🧪 Testing Checklist

### 1. Guest Checkout (No Login)

**Test Steps:**
1. Open incognito window
2. Go to: https://www.aritwin.co.ke/shop
3. Add products to cart
4. Click "Proceed to Checkout"
5. Fill in:
   - Name
   - Email
   - Phone number
   - Delivery address
6. Click "Place Order"
7. Enter M-PESA PIN when prompted

**Expected Results:**
- ✅ Products load without login
- ✅ Can add to cart
- ✅ Checkout form shows guest fields (name, email)
- ✅ M-PESA STK push sent
- ✅ Order created successfully
- ✅ Order has no userId (guest order)

---

### 2. Logged-In User Checkout

**Test Steps:**
1. Go to: https://www.aritwin.co.ke/login
2. Sign in with Clerk
3. Go to: https://www.aritwin.co.ke/shop
4. Add products to cart
5. Click "Proceed to Checkout"
6. Verify form is pre-filled:
   - Name (from Clerk)
   - Email (from Clerk)
   - Phone (from Clerk if available)
7. Fill in delivery address
8. Click "Place Order"
9. Enter M-PESA PIN

**Expected Results:**
- ✅ Checkout form pre-filled with user data
- ✅ No need to enter name/email again
- ✅ Order linked to Clerk user ID
- ✅ Can track order in account

---

### 3. Admin Access

**Test Steps:**
1. Log in with admin account
2. Go to: https://www.aritwin.co.ke/admin
3. Try to access:
   - /admin/orders
   - /admin/products
   - /admin/marketing
   - /admin/accounting

**Expected Results:**
- ✅ Admin dashboard loads
- ✅ Can view all orders
- ✅ Can manage products
- ✅ Role checked from `publicMetadata.role === "admin"`

**If Admin Access Fails:**
Set admin role in Clerk Dashboard:
1. Go to: https://dashboard.clerk.com/
2. Find user
3. Add to Public Metadata:
   ```json
   {
     "role": "admin",
     "approved": true
   }
   ```

---

### 4. Non-Admin User Protection

**Test Steps:**
1. Log in with regular customer account
2. Try to access: https://www.aritwin.co.ke/admin

**Expected Results:**
- ✅ Redirects to /login
- ✅ Cannot access admin routes
- ✅ 403 error if trying direct API calls

---

### 5. M-PESA Payment Flow

**Test Steps:**
1. Complete checkout (guest or logged-in)
2. Wait for M-PESA prompt on phone
3. Enter PIN
4. Wait for confirmation

**Expected Results:**
- ✅ STK push sent to phone
- ✅ Modal shows "Check Your Phone"
- ✅ Payment polling every 5 seconds
- ✅ Success modal on payment confirmation
- ✅ Receipt download available
- ✅ Order status updated to "paid"

---

### 6. API Token Injection

**Test Steps:**
1. Log in with Clerk
2. Open browser DevTools (F12)
3. Go to Network tab
4. Navigate to /shop
5. Check API requests (e.g., /api/products)
6. Look at request headers

**Expected Results:**
- ✅ `Authorization: Bearer <jwt_token>` header present
- ✅ Token is valid Clerk JWT
- ✅ Backend accepts token
- ✅ No 401 errors for authenticated requests

---

## 🐛 Common Issues & Solutions

### Issue 1: "useAuth must be used within an AuthProvider"

**Cause:** Component using `useAuth()` is outside `ClerkAuthWrapper`

**Solution:** Ensure `ClerkAuthWrapper` wraps all components in App.tsx:
```tsx
<ClerkProvider>
  <ClerkAuthWrapper>
    {/* All app components here */}
  </ClerkAuthWrapper>
</ClerkProvider>
```

---

### Issue 2: Shop page says "No products available"

**Causes:**
- API not responding
- Convex database empty
- CORS errors

**Solutions:**
1. Check browser console for errors
2. Verify API: https://www.aritwin.co.ke/api/products?inStock=true
3. Check Convex dashboard for products
4. Ensure `ALLOWED_ORIGINS` includes www domain

---

### Issue 3: M-PESA prompt not received

**Causes:**
- Invalid phone number format
- Lipana webhook not configured
- API server error

**Solutions:**
1. Use correct format: `0712345678` or `254712345678`
2. Check phone number starts with `07` or `01`
3. Verify Lipana environment variables in Vercel
4. Check API logs in Vercel for errors

---

### Issue 4: Admin can't access dashboard

**Cause:** Role not set in Clerk

**Solution:**
1. Go to Clerk Dashboard
2. Find admin user
3. Set `publicMetadata.role = "admin"`
4. Refresh page

---

### Issue 5: Guest checkout not working

**Causes:**
- Required fields not filled
- Phone number validation fails
- API endpoint not responding

**Solutions:**
1. Fill all required fields: name, email, phone, address
2. Use valid Kenyan phone format
3. Check API endpoint: `/api/orders`
4. Check browser console for errors

---

## 📝 Code Snippets

### Check if user is logged in
```tsx
import { useUser } from '@clerk/clerk-react';

function MyComponent() {
  const { user, isLoaded } = useUser();
  
  if (!isLoaded) return <div>Loading...</div>;
  
  if (user) {
    return <div>Welcome, {user.fullName}!</div>;
  }
  
  return <div>Please log in</div>;
}
```

### Check user role
```tsx
import { useAuth } from '@/lib/clerk-auth-wrapper';

function MyComponent() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;
  
  if (user?.role === 'admin') {
    return <div>Admin Dashboard</div>;
  }
  
  return <div>Access Denied</div>;
}
```

### Pre-fill form with user data
```tsx
import { useUser } from '@clerk/clerk-react';
import { useState } from 'react';

function CheckoutForm() {
  const { user } = useUser();
  
  const [name, setName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(
    user?.primaryEmailAddress?.emailAddress || ''
  );
  
  // Rest of form...
}
```

---

## 🎯 Success Criteria

All features working when:
- ✅ Guests can browse and checkout without login
- ✅ Logged-in users get personalized experience
- ✅ Admin can access dashboard
- ✅ M-PESA payments process successfully
- ✅ Orders linked to correct user IDs
- ✅ No authentication errors in console
- ✅ API requests include Clerk tokens
- ✅ Role-based access control working

---

## 📚 Related Documentation

- `CLERK_BACKEND_INTEGRATION.md` - Backend setup
- `CLERK_INTEGRATION.md` - Frontend setup
- `VERCEL_FIX_GUIDE.md` - Deployment guide
- `URGENT_DEPLOYMENT_STEPS.md` - Quick fix guide

---

**Last Updated:** $(Get-Date -Format "yyyy-MM-dd HH:mm")
**Status:** ✅ All systems configured and ready
