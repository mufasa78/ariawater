# Quick Start - Verify Login Works

This guide will help you quickly verify that the login functionality is working.

## Step 1: Install Dependencies

```bash
pnpm install
```

## Step 2: Create Admin User

```bash
pnpm --filter scripts run setup-admin
```

**Expected output:**
```
✅ Admin user created successfully!
   Email: admin@ariwater.co.ke
   Password: Admin@123!
```

## Step 3: Start API Server

In a new terminal:

```bash
pnpm --filter @workspace/api-server dev
```

**Expected output:**
```
Server listening on port 8080
```

## Step 4: Start Frontend

In another terminal:

```bash
pnpm --filter @workspace/ari-water dev
```

**Expected output:**
```
Local: http://localhost:18090/
```

## Step 5: Test Login

### Option A: Automated Test

```bash
pnpm --filter scripts run test-login
```

✅ All tests should pass!

### Option B: Manual Test

1. Open browser to: `http://localhost:18090/login`
2. Enter:
   - Email: `admin@ariwater.co.ke`
   - Password: `Admin@123!`
3. Click "Sign in"
4. You should be redirected to the admin dashboard

## Troubleshooting

### Issue: "Port already in use"

**Solution:** Kill the process using the port:

```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

### Issue: "CONVEX_URL must be set"

**Solution:** Ensure `.env.local` exists in the root with:
```
CONVEX_URL=https://grand-dachshund-295.convex.cloud/
```

### Issue: "Account pending admin approval"

**Solution:** Run the setup script again:
```bash
pnpm --filter scripts run setup-admin
```

## Next Steps

- Change the admin password after first login
- Create additional users via the admin panel
- Review the full [LOGIN_VERIFICATION.md](./LOGIN_VERIFICATION.md) for detailed information

## Configuration Files

All configuration is in `.env.local`:
- `PORT=8080` - API server port
- `JWT_SECRET` - Token signing key
- `CONVEX_URL` - Database connection
- `ADMIN_EMAIL` - Default admin email
- `ADMIN_PASSWORD` - Default admin password

The frontend proxy is configured in `artifacts/ari-water/vite.config.ts` to forward `/api/*` requests to `http://127.0.0.1:8080`.
