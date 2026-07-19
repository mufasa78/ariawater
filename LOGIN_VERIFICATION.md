# Login Functionality Verification Guide

## Overview

This document provides steps to verify that the login functionality is working correctly in the Aria Water Management System.

## Authentication System Architecture

### Components:
1. **Frontend**: React login page (`artifacts/ari-water/src/pages/Login.tsx`)
2. **Backend**: Express API server with JWT authentication (`artifacts/api-server/src/routes/auth.ts`)
3. **Database**: Convex database for user storage
4. **Security**: bcrypt password hashing, httpOnly cookies, JWT tokens

### Key Features:
- ✅ JWT-based authentication with 7-day expiry
- ✅ httpOnly secure cookies
- ✅ Admin approval system for new customers
- ✅ Role-based access control (admin, marketing, sales, accounting, customer)
- ✅ Password hashing with bcrypt (10 salt rounds)

## Prerequisites

Before testing login, ensure:

1. **Environment variables are configured** (`.env.local`):
   ```env
   JWT_SECRET=91ce4ab397e9682f4a4c23ad6ffb5fe2d4218804eae376f3944891768350b532
   CONVEX_URL=https://grand-dachshund-295.convex.cloud/
   ADMIN_EMAIL=admin@ariwater.co.ke
   ADMIN_PASSWORD=Admin@123!
   ```

2. **Dependencies are installed**:
   ```bash
   pnpm install
   ```

3. **Convex is deployed**:
   ```bash
   npx convex deploy
   ```

## Setup Steps

### Step 1: Create Admin User

Run the setup script to ensure the admin user exists:

```bash
pnpm --filter scripts run setup-admin
```

This script will:
- Check if admin user exists
- Create admin user if needed
- Ensure the admin is approved for login
- Display admin credentials

**Expected Output:**
```
✅ Admin user created successfully!
   ID: xyz123
   Email: admin@ariwater.co.ke
   Password: Admin@123!
```

### Step 2: Start the API Server

```bash
pnpm --filter @workspace/api-server dev
```

The server should start on `http://localhost:3000`

### Step 3: Start the Frontend

In a new terminal:

```bash
pnpm --filter @workspace/ari-water dev
```

The frontend should start on `http://localhost:5173`

## Testing Login

### Automated Test

Run the automated test script:

```bash
pnpm --filter scripts run test-login
```

This will test:
1. ✅ Login with valid admin credentials
2. ✅ /me endpoint with authentication cookie
3. ✅ Login rejection with invalid credentials
4. ✅ Logout functionality

**Expected Output:**
```
✅ All login tests passed!
```

### Manual Test via UI

1. Open `http://localhost:5173/login` in your browser
2. Enter credentials:
   - Email: `admin@ariwater.co.ke`
   - Password: `Admin@123!`
3. Click "Sign in"
4. You should be redirected to `/admin` dashboard

### Manual Test via API

Use curl or Postman to test the API directly:

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ariwater.co.ke","password":"Admin@123!"}' \
  -c cookies.txt

# Get current user
curl http://localhost:3000/api/auth/me \
  -b cookies.txt

# Logout
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt
```

## Common Issues & Solutions

### Issue 1: "Account pending admin approval"

**Cause:** User account has `approved: false` in the database

**Solution:**
```bash
pnpm --filter scripts run setup-admin
```

This will set `approved: true` for the admin user.

### Issue 2: "Invalid email or password"

**Cause:** User doesn't exist or password is incorrect

**Solutions:**
1. Verify credentials in `.env.local`
2. Run setup-admin to create the user
3. Check Convex dashboard for user records

### Issue 3: "Authentication required" on /me endpoint

**Cause:** Cookie not being sent or JWT_SECRET mismatch

**Solutions:**
1. Verify JWT_SECRET is set in both frontend and backend environments
2. Check that cookies are enabled in browser
3. Verify CORS configuration allows credentials

### Issue 4: CORS errors

**Cause:** Frontend and backend on different origins

**Solution:** In production, set `ALLOWED_ORIGINS` environment variable:
```env
ALLOWED_ORIGINS=https://your-frontend-domain.com
```

### Issue 5: "CONVEX_URL must be set"

**Cause:** Missing Convex environment variables

**Solution:** Ensure `.env.local` has:
```env
CONVEX_URL=https://grand-dachshund-295.convex.cloud/
```

## Authentication Flow

```
1. User enters credentials → Login.tsx
2. React Query mutation → POST /api/auth/login
3. Backend validates email/password → bcrypt.compare()
4. Check user.approved === true
5. Generate JWT token → jwt.sign()
6. Set httpOnly cookie
7. Return user data (without password)
8. Frontend stores in React Query cache
9. AuthContext provides user state to app
10. Route guards check authentication
```

## Security Checklist

- ✅ Passwords hashed with bcrypt (10 rounds)
- ✅ JWT tokens expire after 7 days
- ✅ httpOnly cookies prevent XSS attacks
- ✅ Secure cookies in production (HTTPS only)
- ✅ Admin approval required for customers
- ✅ Role-based access control
- ✅ CORS restricted to allowed origins in production
- ✅ Password validation (min 6 characters)
- ✅ Email validation

## API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/register` | POST | No | Register new customer (unapproved) |
| `/api/auth/login` | POST | No | Login with email/password |
| `/api/auth/logout` | POST | No | Clear auth cookie |
| `/api/auth/me` | GET | Yes | Get current user |
| `/api/auth/admin/create-user` | POST | Admin | Create user with specific role |

## Database Schema

### Users Table
```typescript
{
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: "admin" | "marketing" | "sales" | "accounting" | "customer";
  approved: boolean;
}
```

## Additional Notes

- Admin users are auto-approved when created via the setup script
- Customer registrations require admin approval before login
- JWT tokens include: userId, role, name, email, approved status
- Tokens are stored in httpOnly cookies (not accessible via JavaScript)
- Frontend uses React Query for caching authenticated user data

## Production Deployment Checklist

- [ ] Change default admin password
- [ ] Set strong JWT_SECRET (min 32 random characters)
- [ ] Configure ALLOWED_ORIGINS with production domain
- [ ] Enable secure cookies (HTTPS)
- [ ] Set up rate limiting on auth endpoints
- [ ] Configure session timeout appropriately
- [ ] Set up monitoring for failed login attempts
- [ ] Enable audit logging for authentication events

## Support

If issues persist after following this guide:

1. Check application logs for errors
2. Verify Convex database connectivity
3. Test API endpoints directly with curl
4. Check browser console for frontend errors
5. Verify environment variables are loaded correctly
