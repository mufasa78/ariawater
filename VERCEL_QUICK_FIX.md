# 🚨 URGENT: Fix Login on Vercel

## What I Just Fixed

✅ Created `/api/index.ts` - Serverless function handler  
✅ Added `vercel.json` - API routing configuration  
✅ Pushed to GitHub - Will trigger Vercel redeploy

## ⚡ What You Need to Do NOW

### Step 1: Add Environment Variables to Vercel (5 minutes)

1. **Go to:** https://vercel.com/your-project/settings/environment-variables

2. **Add these variables** (one by one):

```env
CONVEX_URL=https://grand-dachshund-295.convex.cloud/
JWT_SECRET=91ce4ab397e9682f4a4c23ad6ffb5fe2d4218804eae376f3944891768350b532
ADMIN_EMAIL=admin@ariwater.co.ke
ADMIN_PASSWORD=Admin@123!
LIPANA_SECRET_KEY=lip_sk_test_180d64eb5eb54d3e2262f6ee990b7108b4dd1d87ab3a0d9bb601eaba7d055db0
LIPANA_PUBLISHABLE_KEY=lip_pk_test_fa7e40c262551d4723cabebb314ffcaf0b9784d9f72bdce6068bbc6b6bd220ff
LIPANA_WEBHOOK_SECRET=b5fb48af0cfcd23212ef271e4c8669903063aa28cee0cb56990959bb9414de1c
PAYMENT_PROVIDER=lipana
NODE_ENV=production
```

3. **For each variable:**
   - Click "Add New"
   - Paste Name
   - Paste Value
   - Check "Production", "Preview", "Development"
   - Click "Save"

### Step 2: Wait for Redeploy

The code push will trigger an automatic redeploy. Check the "Deployments" tab.

### Step 3: Update Webhook URL (After Deploy)

Once deployed, get your Vercel URL (e.g., `ariawater.vercel.app`) and update:

```env
LIPANA_WEBHOOK_URL=https://YOUR-URL.vercel.app/api/payments/webhook/lipana
```

### Step 4: Test Login

1. Go to your Vercel URL
2. Navigate to `/login`
3. Try logging in with:
   - Email: `admin@ariwater.co.ke`
   - Password: `Admin@123!`

## Troubleshooting

### If login still fails:

1. **Check Vercel Logs:**
   - Go to Deployments → Click your deployment
   - Click "Functions" tab
   - Look for `/api/index` logs

2. **Check Environment Variables:**
   - Settings → Environment Variables
   - Make sure all are added
   - Make sure they apply to "Production"

3. **Force Redeploy:**
   - Deployments → Latest → "..." menu → "Redeploy"
   - Don't use cache

### If you see CORS errors:

The API should allow your Vercel domain. Check the browser console for details.

## API Endpoints

All API routes work at:
- `https://your-app.vercel.app/api/auth/login`
- `https://your-app.vercel.app/api/auth/me`
- `https://your-app.vercel.app/api/auth/logout`
- `https://your-app.vercel.app/api/payments/*`

## How It Works

1. Frontend requests go to `/api/*`
2. Vercel routes them to `/api/index.ts` serverless function
3. The function runs your Express app
4. Response sent back to frontend

---

**Status:** ✅ Code deployed, waiting for environment variables setup
