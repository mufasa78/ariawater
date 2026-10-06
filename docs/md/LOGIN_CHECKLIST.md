# Login Verification Checklist

## ✅ Pre-Setup Checklist

- [x] Environment variables configured in `.env.local`
- [x] Convex deployed (`npx convex deploy`)
- [x] Dependencies installed (`pnpm install`)
- [x] Backend API routes created
- [x] Frontend login page created
- [x] Authentication middleware configured
- [x] Password hashing utilities ready

## 🔐 Admin User Setup

Choose ONE method:

### Method 1: Via Convex Dashboard (Recommended) ⭐

- [ ] Go to https://dashboard.convex.dev/
- [ ] Navigate to Data → users table
- [ ] Click "+ Add Document"
- [ ] Paste admin user JSON:
  ```json
  {
    "name": "System Admin",
    "email": "admin@ariwater.co.ke",
    "passwordHash": "$2b$10$QFMOaILhJqAiYQVappPalOg9vGSFai95oMC8yycxnrX6y3pLXgxhu",
    "role": "admin",
    "approved": true
  }
  ```
- [ ] Click Save

### Method 2: Via API Registration

- [ ] Start API server: `pnpm --filter @workspace/api-server dev`
- [ ] Register via curl or Postman
- [ ] Go to Convex dashboard
- [ ] Find user and set `approved: true`

## 🚀 Start Services

- [ ] **Terminal 1:** Start API server
  ```bash
  pnpm --filter @workspace/api-server dev
  ```
  Expected: `Server listening on port 8080`

- [ ] **Terminal 2:** Start frontend
  ```bash
  pnpm --filter @workspace/ari-water dev
  ```
  Expected: `Local: http://localhost:18090/`

## 🧪 Test Login

### Browser Test
- [ ] Open http://localhost:18090/login
- [ ] Enter credentials:
  - Email: `admin@ariwater.co.ke`
  - Password: `Admin@123!`
- [ ] Click "Sign in"
- [ ] ✅ Redirected to `/admin` dashboard
- [ ] ✅ User info appears in UI
- [ ] ✅ Can navigate protected routes
- [ ] Test logout
- [ ] ✅ Redirected to login page

### API Test (Optional)
- [ ] Test login endpoint with curl
- [ ] Test `/api/auth/me` endpoint
- [ ] Verify JWT cookie is set
- [ ] Test logout endpoint

### Automated Test (Optional)
- [ ] Run: `pnpm --filter scripts run test-login`
- [ ] ✅ All 4 tests pass

## 🔒 Security Verification

- [ ] Passwords are hashed (not plain text)
- [ ] JWT tokens expire after 7 days
- [ ] httpOnly cookies are set
- [ ] Invalid credentials are rejected
- [ ] Unapproved users cannot login
- [ ] Protected routes require authentication
- [ ] Admin routes require admin role

## 🎯 Feature Testing

### Login Flow
- [ ] Can access login page
- [ ] Form validation works
- [ ] Error messages display correctly
- [ ] Success redirects work
- [ ] Loading states show

### Authentication State
- [ ] User state persists on refresh
- [ ] Logout clears session
- [ ] Can re-login after logout
- [ ] Route guards work correctly

### Role-Based Access
- [ ] Admin can access admin routes
- [ ] Customers redirected to `/shop` after login
- [ ] Unauthorized role access is blocked

## 🐛 Troubleshooting Tests

If login fails, verify:

- [ ] API server is running on port 8080
- [ ] Frontend is running on port 18090
- [ ] Convex URL is correct in `.env.local`
- [ ] Admin user exists in Convex database
- [ ] Admin user has `approved: true`
- [ ] Password hash matches
- [ ] No CORS errors in browser console
- [ ] JWT_SECRET is set
- [ ] Cookies are enabled in browser

## 📊 Success Criteria

Login system is working when ALL of these are true:

- ✅ API server starts without errors
- ✅ Frontend loads without errors
- ✅ Can login with admin credentials
- ✅ JWT token is created and stored in cookie
- ✅ User is redirected to correct page based on role
- ✅ Protected routes are inaccessible without login
- ✅ User can logout successfully
- ✅ Invalid credentials are rejected with proper error
- ✅ Session persists across page refreshes
- ✅ Session expires after 7 days or logout

## 📝 Post-Verification Tasks

- [ ] Change default admin password
- [ ] Document custom user creation process
- [ ] Test with different user roles
- [ ] Set up production environment variables
- [ ] Generate production JWT_SECRET
- [ ] Configure production CORS settings
- [ ] Set up HTTPS/SSL for production
- [ ] Enable rate limiting on auth endpoints
- [ ] Set up monitoring for failed login attempts

## 🎉 Final Check

- [ ] ✅ Login works in browser
- [ ] ✅ Authentication persists
- [ ] ✅ Logout works correctly
- [ ] ✅ Route protection works
- [ ] ✅ No console errors
- [ ] ✅ Documentation is clear

---

**Status:** [ ] Not Started  /  [ ] In Progress  /  [ ] ✅ Complete

**Date:** _____________

**Tested By:** _____________

**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________
