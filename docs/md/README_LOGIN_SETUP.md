# Login Setup - Complete Guide

## ✅ System Status

Your login system is **fully configured** and ready to use. All code is in place:

- ✅ Backend authentication API (`/api/auth/*`)
- ✅ Frontend login page and auth context
- ✅ JWT token system with httpOnly cookies
- ✅ Password hashing with bcrypt
- ✅ Role-based access control
- ✅ Admin approval system

## 🚀 Quick Setup (3 Steps)

### Step 1: Create Admin User in Convex

Go to: https://dashboard.convex.dev/

1. Login and select your project: `mufasa:aria-water:production`
2. Click "Data" → select "users" table
3. Click "+ Add Document"
4. Paste this JSON:

```json
{
  "name": "System Admin",
  "email": "admin@ariwater.co.ke",
  "passwordHash": "$2b$10$QFMOaILhJqAiYQVappPalOg9vGSFai95oMC8yycxnrX6y3pLXgxhu",
  "role": "admin",
  "approved": true
}
```

5. Click "Save"

### Step 2: Start API Server

```bash
pnpm --filter @workspace/api-server dev
```

Expected output:
```
Server listening on port 8080
```

### Step 3: Start Frontend

Open a new terminal:

```bash
pnpm --filter @workspace/ari-water dev
```

Expected output:
```
Local: http://localhost:18090/
```

## ✨ Test Login

1. Open: http://localhost:18090/login
2. Login with:
   - **Email:** `admin@ariwater.co.ke`
   - **Password:** `Admin@123!`
3. You'll be redirected to the admin dashboard

## 📋 What's Been Done

### 1. Environment Configuration
✅ Updated `.env.local` with:
- `PORT=8080` - API server port
- `JWT_SECRET` - Token signing key
- `CONVEX_URL` - Database connection
- `ADMIN_EMAIL` & `ADMIN_PASSWORD` - Admin credentials

### 2. Windows Compatibility
✅ Fixed API server script for Windows CMD:
- Changed `export` to `set` command
- Updated dev script in `artifacts/api-server/package.json`

### 3. Helper Scripts Created
✅ Password hash generator:
```bash
pnpm --filter scripts run hash-password "YourPassword"
```

✅ Login test script (requires running API server):
```bash
pnpm --filter scripts run test-login
```

### 4. Documentation Created
- ✅ `LOGIN_VERIFICATION.md` - Comprehensive verification guide
- ✅ `LOGIN_STATUS.md` - System status report
- ✅ `QUICK_START.md` - Quick setup instructions
- ✅ `MANUAL_ADMIN_SETUP.md` - Manual setup methods
- ✅ `README_LOGIN_SETUP.md` - This file

## 🔧 Alternative Setup Methods

### Method A: Via API (If server is running)

```bash
# Register new user
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"System Admin\",\"email\":\"admin@ariwater.co.ke\",\"password\":\"Admin@123!\"}"

# Then approve in Convex dashboard: set approved=true
```

### Method B: Generate Custom Password Hash

```bash
pnpm --filter scripts run hash-password "YourCustomPassword"
```

Then use the generated hash in Convex dashboard.

## 🧪 Testing

### Automated Test
```bash
# Make sure API server is running first!
pnpm --filter scripts run test-login
```

Expected output:
```
✅ All login tests passed!
```

### Manual Browser Test
1. Go to http://localhost:18090/login
2. Login with admin credentials
3. Check you're redirected to `/admin`
4. Verify user info appears in the UI

### API Test (cURL)
```bash
# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ariwater.co.ke","password":"Admin@123!"}' \
  -c cookies.txt

# Get current user
curl http://localhost:8080/api/auth/me -b cookies.txt

# Should return: {"id":"...","name":"System Admin","email":"admin@ariwater.co.ke"...}
```

## 📱 Default Login Credentials

**Email:** `admin@ariwater.co.ke`  
**Password:** `Admin@123!`

⚠️ **Change this password after first login!**

## 🔒 Security Features

- ✅ Passwords hashed with bcrypt (10 salt rounds)
- ✅ JWT tokens with 7-day expiration
- ✅ httpOnly cookies (XSS protected)
- ✅ Secure cookies in production (HTTPS only)
- ✅ Admin approval required for customer accounts
- ✅ Role-based access control (5 roles)
- ✅ CORS protection configured

## 🎯 User Roles

| Role | Description | Access |
|------|-------------|--------|
| `admin` | System administrator | Full access to all features |
| `marketing` | Marketing team | Marketing dashboard & campaigns |
| `sales` | Sales team | Sales dashboard & orders |
| `accounting` | Finance team | Financial reports & accounting |
| `customer` | End customers | Shop & order history |

## 🐛 Troubleshooting

### "Port 8080 is already in use"
```bash
# Windows: Find and kill process
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

### "Cannot connect to API"
- Verify API server is running on port 8080
- Check `.env.local` has `PORT=8080`
- Ensure no firewall blocking localhost

### "Account pending admin approval"
- Go to Convex dashboard
- Find user in `users` table
- Set `approved: true`

### "Invalid email or password"
- Verify password hash is correct
- Ensure user exists in Convex database
- Check you're using the right credentials

## 📚 API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/register` | POST | No | Register new customer |
| `/api/auth/login` | POST | No | Login with email/password |
| `/api/auth/logout` | POST | No | Clear authentication cookie |
| `/api/auth/me` | GET | Yes | Get current authenticated user |
| `/api/auth/admin/create-user` | POST | Admin | Create user with specific role |

## 🎉 Success Indicators

You'll know login is working when:

✅ API server starts without errors  
✅ Frontend loads at http://localhost:18090  
✅ Login page appears styled and functional  
✅ Can login with admin credentials  
✅ Redirected to admin dashboard after login  
✅ User info appears in the UI  
✅ Can logout successfully  
✅ Protected routes require authentication  

## 📞 Next Steps

1. ✅ Login to admin account
2. ✅ Change default admin password
3. ✅ Create additional users via admin panel
4. ✅ Test different user roles
5. ✅ Configure production environment
6. ✅ Set up HTTPS/SSL for production
7. ✅ Generate new JWT_SECRET for production

## 🔗 Useful Links

- **Convex Dashboard:** https://dashboard.convex.dev/
- **Local Frontend:** http://localhost:18090
- **Local API:** http://localhost:8080
- **Login Page:** http://localhost:18090/login

---

**Status:** ✅ Ready to use  
**Last Updated:** 2026-07-19  
**Environment:** Development

Need help? Check the other documentation files in this directory!
