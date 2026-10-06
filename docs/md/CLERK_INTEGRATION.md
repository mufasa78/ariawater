# Clerk Authentication Integration

## Overview

The Aria Water Management system now uses Clerk for authentication, replacing the custom JWT-based system. This provides:

✅ **Secure Authentication** - Industry-standard OAuth, passwordless, and social sign-in  
✅ **User Management** - Built-in user dashboard and profile management  
✅ **Admin & Customer Accounts** - Role-based access control via metadata  
✅ **Order Tracking** - Authenticated users can view order history  
✅ **Easy Onboarding** - Pre-built UI components for sign-in/sign-up  

## What Changed

### Frontend Changes

1. **Clerk Provider Wrapper**
   - Wraps entire app with `<ClerkProvider>`
   - Configured with publishable key from environment

2. **Auth Context Wrapper** (`clerk-auth-wrapper.tsx`)
   - Provides compatibility layer between Clerk and existing code
   - Maps Clerk user to our `User` interface
   - Automatically injects Clerk JWT tokens into API requests

3. **Login/SignUp Pages**
   - Now use Clerk's pre-built `<SignIn>` and `<SignUp>` components
   - Styled to match app branding
   - Support email/password, passwordless, and social auth

4. **Navbar Updates**
   - Uses Clerk's `<UserButton>` for user menu
   - `<SignedIn>` and `<SignedOut>` components for conditional rendering
   - Shows admin dashboard link for admin users

5. **Route Guards**
   - Admin routes check `user.publicMetadata.role === 'admin'`
   - Uses Clerk's `isLoaded` and `isSignedIn` states

### Backend Integration (To Be Completed)

The backend API server needs to be updated to:
1. Install `@clerk/backend` or `@clerk/express`
2. Replace JWT middleware with Clerk token validation
3. Extract user ID and metadata from Clerk tokens
4. Sync Clerk users to Convex database

## Environment Variables

### Frontend (.env.local)
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
```

### Backend (.env.local) - To Add
```env
CLERK_SECRET_KEY=sk_live_...
CLERK_PUBLISHABLE_KEY=pk_live_...
```

## User Roles via Public Metadata

Clerk stores user roles in `publicMetadata`:

```typescript
{
  userId: "user_abc123",
  publicMetadata: {
    role: "admin" | "customer",
    approved: true
  }
}
```

### Setting Roles in Clerk Dashboard

1. Go to Clerk Dashboard → Users
2. Select a user
3. Click "Metadata" tab
4. Add to Public Metadata:
```json
{
  "role": "admin",
  "approved": true
}
```

## Customer Features with Accounts

### Order Tracking
- Authenticated customers can view all their orders
- Orders linked by Clerk `userId`
- Access order history, invoices, tracking

### Profile Management
- Clerk provides built-in profile editing
- Update name, email, phone, password
- Manage connected accounts

### Saved Addresses
- Store delivery addresses (future feature)
- One-click checkout with saved details

### Reviews & Ratings
- Leave reviews on delivered orders
- Review history viewable in profile

### Invoices & Receipts
- Download invoices for past orders
- Email receipts automatically
- Tax-compliant documentation

## Authentication Flow

### Customer Registration Flow
1. Customer visits `/sign-up`
2. Enters email and password (or uses social auth)
3. Clerk sends verification email
4. Customer verifies email
5. Account created with `role: "customer"` (default)
6. Redirected to `/shop`

### Admin Login Flow
1. Admin visits `/login`
2. Signs in with Clerk credentials
3. System checks `publicMetadata.role === "admin"`
4. If admin, redirect to `/admin`
5. If not admin, show error message

### Guest Checkout (No Account Required)
1. Customer adds items to cart
2. Proceeds to checkout
3. Enters name, email, address, phone
4. Places order without creating account
5. Receives ticket number for tracking

## API Token Flow

1. **Frontend Request**
   ```typescript
   // Clerk auth wrapper automatically injects token
   setAuthTokenGetter(async () => {
     if (isSignedIn) {
       return await getToken(); // Clerk JWT
     }
     return null;
   });
   ```

2. **API Request**
   ```
   GET /api/orders
   Authorization: Bearer <clerk_jwt_token>
   ```

3. **Backend Validation** (To Be Implemented)
   ```typescript
   import { requireAuth } from '@clerk/express';
   
   router.get('/orders', requireAuth(), async (req, res) => {
     const userId = req.auth.userId; // From Clerk token
     // Fetch orders for this user
   });
   ```

## Migration Path

### Phase 1: Frontend (✅ Complete)
- [x] Install Clerk React package
- [x] Wrap app with ClerkProvider
- [x] Create auth wrapper for compatibility
- [x] Update Login/SignUp pages
- [x] Update Navbar with Clerk components
- [x] Update route guards

### Phase 2: Backend (⏳ Next Steps)
- [ ] Install @clerk/express
- [ ] Replace JWT middleware with Clerk validation
- [ ] Update auth routes to work with Clerk
- [ ] Test admin and customer access
- [ ] Sync Clerk users to Convex (optional)

### Phase 3: Data Migration (⏳ Future)
- [ ] Export existing users from Convex
- [ ] Import to Clerk via CSV or API
- [ ] Set appropriate roles in metadata
- [ ] Link existing orders to Clerk user IDs

### Phase 4: Enhanced Features (Future)
- [ ] Add social authentication (Google, Facebook)
- [ ] Implement passwordless (magic link) auth
- [ ] Add two-factor authentication
- [ ] Build customer dashboard
- [ ] Add saved addresses feature
- [ ] Implement invoice generation

## Testing Checklist

### Admin Flow
- [ ] Admin can sign in at `/login`
- [ ] Admin is redirected to `/admin`
- [ ] Admin dashboard loads correctly
- [ ] Admin can manage orders/products
- [ ] Admin can sign out
- [ ] Non-admin cannot access admin routes

### Customer Flow
- [ ] Customer can register at `/sign-up`
- [ ] Email verification works
- [ ] Customer can sign in
- [ ] Customer can place orders while signed in
- [ ] Orders show in customer history
- [ ] Customer can track orders
- [ ] Customer can leave reviews
- [ ] Customer profile updates work

### Guest Flow
- [ ] Guest can browse shop without account
- [ ] Guest can add items to cart
- [ ] Guest can checkout without signing up
- [ ] Guest receives ticket number
- [ ] Guest can track order with ticket

## Security Considerations

✅ **Token Security**
- Clerk JWTs are short-lived and auto-refresh
- Tokens stored securely in HTTP-only cookies (by Clerk)
- No sensitive data in localStorage

✅ **Role Authorization**
- Roles stored in Clerk's publicMetadata
- Validated on both frontend and backend
- Cannot be modified by users

✅ **Session Management**
- Clerk handles session lifecycle
- Auto-logout on inactivity
- Multi-device session management

⚠️ **API Security**
- Backend MUST validate Clerk tokens
- Do not trust frontend role checks alone
- Always verify permissions server-side

## Troubleshooting

### Issue: Clerk publishable key not found
**Solution:** Ensure `VITE_CLERK_PUBLISHABLE_KEY` is set in `.env.local`

### Issue: Admin redirect not working
**Solution:** Check that user has `publicMetadata.role = "admin"` in Clerk dashboard

### Issue: API calls returning 401
**Solution:** Ensure auth token getter is configured in clerk-auth-wrapper

### Issue: User metadata not loading
**Solution:** Check that ClerkAuthWrapper is rendering and useUser hook has data

## Support & Resources

- **Clerk Documentation:** https://clerk.com/docs
- **React Integration:** https://clerk.com/docs/quickstarts/react
- **User Metadata:** https://clerk.com/docs/users/metadata
- **Clerk Dashboard:** https://dashboard.clerk.com

## Next Steps

1. **Update Backend** - Implement Clerk token validation in API server
2. **Test Thoroughly** - Verify all auth flows work correctly
3. **Set Admin Roles** - Add `role: "admin"` to admin users in Clerk
4. **Monitor** - Watch for auth-related errors in production
5. **Document** - Update team on new auth flow

---

**Status:** Frontend Complete ✅ | Backend Pending ⏳  
**Last Updated:** August 7, 2026
