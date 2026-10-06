# 🎯 Deployment Recommendation

## TL;DR - Best Solution

**Use a hybrid approach:**
- ✅ **Vercel** for Frontend (already working, free, no issues)
- ✅ **Render** for API Server (free tier works fine)

This gives you the best of both platforms at **$0/month**.

## Why This Approach?

### The Problem

Render's free tier has **512MB RAM** which is insufficient for building the React frontend with Vite. The build keeps crashing with:
```
FATAL ERROR: JavaScript heap out of memory
```

### The Solution

| Service | Platform | Why | Cost |
|---------|----------|-----|------|
| **API** | Render | Works great, easy setup | $0 (free) |
| **Frontend** | Vercel | More RAM for builds, already deployed | $0 (free) |

## 🚀 Quick Setup (5 minutes)

### Step 1: Keep Vercel Frontend (Already Done ✅)

Your frontend is already deployed at:
- `https://ariawater.vercel.app`

Nothing to do here!

### Step 2: Deploy API to Render

1. Go to https://dashboard.render.com
2. New → Web Service
3. Connect GitHub: `mufasa78/ariawater`
4. Configure:
   - **Name**: `aria-water-api`
   - **Build Command**:
     ```bash
     pnpm install --frozen-lockfile && pnpm run typecheck:libs && pnpm --filter @workspace/api-server run build
     ```
   - **Start Command**:
     ```bash
     cd artifacts/api-server && node dist/index.mjs
     ```
5. Add environment variables:
   ```env
   NODE_ENV=production
   PORT=10000
   JWT_SECRET=91ce4ab397e9682f4a4c23ad6ffb5fe2d4218804eae376f3944891768350b532
   CONVEX_URL=https://grand-dachshund-295.convex.cloud/
   ALLOWED_ORIGINS=https://ariawater.vercel.app
   FRONTEND_URL=https://ariawater.vercel.app
   PAYMENT_PROVIDER=lipana
   LIPANA_PUBLISHABLE_KEY=lip_pk_live_...
   LIPANA_SECRET_KEY=lip_sk_live_...
   LIPANA_WEBHOOK_SECRET=b5fb48af0cfcd23212ef271e4c8669903063aa28cee0cb56990959bb9414de1c
   LIPANA_WEBHOOK_URL=https://aria-water-api.onrender.com/api/webhooks/lipana
   ```
6. Click "Create Web Service"
7. Wait for deploy (~5 min)
8. **Copy your API URL**: e.g., `https://aria-water-api.onrender.com`

### Step 3: Update Vercel Frontend

1. Go to https://vercel.com/your-dashboard
2. Find your project → Settings → Environment Variables
3. Update/Add:
   ```env
   VITE_API_URL=https://aria-water-api.onrender.com
   ```
4. Deployments → Latest → Redeploy

### Step 4: Test

Visit: `https://ariawater.vercel.app`

- ✅ Frontend loads (Vercel)
- ✅ API calls work (Render)
- ✅ Magic link login works
- ✅ Shop works
- ✅ Checkout works

## 📊 Comparison

| Feature | Vercel Only | Render Only | Hybrid (Recommended) |
|---------|-------------|-------------|----------------------|
| **Frontend** | ✅ Works | ❌ OOM errors | ✅ Vercel |
| **API** | ✅ Works | ✅ Works | ✅ Render |
| **Build Time** | ~2 min | ❌ Fails | ~2 min frontend + ~5 min API |
| **Cost** | $0 | $0 (if it worked) | **$0** |
| **Cold Start** | Fast | 30-60s | Fast frontend + 30-60s API |
| **Custom Domain** | Easy | Easy | Both easy |
| **Reliability** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

## 🎯 Alternative Options

### Option 1: Hybrid (Recommended) - $0/month
- Frontend: Vercel
- API: Render
- **Best choice for free tier**

### Option 2: All Vercel - $0/month
- Frontend: Vercel
- API: Vercel Serverless Functions
- Already working!
- Simplest deployment
- **Best for ease of use**

### Option 3: All Render - $7/month
- Frontend: Render (Starter plan for more RAM)
- API: Render (Free tier)
- More expensive
- Unified platform

### Option 4: Railway - $5/month
- Both services on Railway
- Similar to Render but more RAM on free tier
- Good alternative

## 💡 Our Recommendation

**Go with Option 2: All Vercel**

You already have it working! Here's why:

### Pros:
- ✅ Already deployed and working
- ✅ Zero configuration needed
- ✅ Fast build times
- ✅ No cold starts
- ✅ Free forever
- ✅ Excellent DX (developer experience)
- ✅ Automatic HTTPS
- ✅ Built-in CDN
- ✅ Easy custom domains

### What You Have:
```
Current Vercel Deployment:
├── Frontend: ✅ Working
├── API: ✅ Working (serverless functions)
├── Database: ✅ Convex
├── Payments: ✅ Lipana M-Pesa
└── Auth: ✅ Magic links + Passwords

Status: 🟢 FULLY FUNCTIONAL
```

### To Use Vercel (Already Done):

Your app is live at: **https://ariawater.vercel.app**

Just ensure these environment variables are set in Vercel:
```env
JWT_SECRET=your_secret
CONVEX_URL=https://grand-dachshund-295.convex.cloud/
CONVEX_DEPLOYMENT_URL=https://grand-dachshund-295.convex.cloud/
ALLOWED_ORIGINS=https://ariawater.vercel.app
FRONTEND_URL=https://ariawater.vercel.app
PAYMENT_PROVIDER=lipana
LIPANA_PUBLISHABLE_KEY=your_key
LIPANA_SECRET_KEY=your_secret
LIPANA_WEBHOOK_SECRET=your_secret
LIPANA_WEBHOOK_URL=https://ariawater.vercel.app/api/webhooks/lipana
```

## 🚀 Action Plan

### Immediate (5 minutes):
1. ✅ Use Vercel (already working)
2. ✅ Verify environment variables in Vercel
3. ✅ Test all features
4. ✅ You're done!

### Optional (If you want Render):
1. Deploy API to Render (API works fine)
2. Keep frontend on Vercel
3. Update API URL in Vercel frontend

### Don't Bother:
- ❌ Trying to fix Render frontend build
- ❌ Upgrading Render to paid plan just for frontend
- ❌ Fighting with memory limits

## 📋 Final Checklist

Using Vercel (Recommended):
- [ ] Environment variables configured
- [ ] Convex deployed
- [ ] Test magic link login
- [ ] Test shop
- [ ] Test checkout
- [ ] Test M-Pesa payment
- [ ] Set up custom domain (optional)
- [ ] Configure email service for magic links (optional)

## 🎉 Conclusion

**Your app is already deployed and working on Vercel.**

Don't overthink it. Vercel handles everything:
- ✅ Frontend build (no memory issues)
- ✅ API serverless functions (scales automatically)
- ✅ HTTPS & CDN (included)
- ✅ $0/month (free tier is generous)

**Just use what's already working!** 🚀

---

Need help? Check:
- `VERCEL_SETUP.md` - Vercel configuration
- `MAGIC_LINK_AUTH.md` - Authentication guide
- `QUICKSTART_RENDER.md` - If you want to try Render API
