# 🚀 Quick Start: Deploy to Render in 10 Minutes

This is the fastest way to get Aria Water running on Render.

## ⚡ Prerequisites (2 minutes)

1. ✅ GitHub account with code pushed
2. ✅ Render account (sign up at https://render.com)
3. ✅ Convex deployed: `npx convex deploy`

## 📝 Step-by-Step

### 1. Deploy Convex (if not done)

```bash
cd d:\Work\Websites\Aria Water\App\Aria-Water-Management\aria-water
npx convex deploy
```

Save the deployment URL (e.g., `https://grand-dachshund-295.convex.cloud/`)

### 2. Create API Service

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub: `mufasa78/ariawater`
4. Fill in:
   - **Name**: `aria-water-api`
   - **Build Command**: 
     ```
     pnpm install && pnpm run build
     ```
   - **Start Command**:
     ```
     cd artifacts/api-server && node dist/index.mjs
     ```
5. Click **"Advanced"** → Add environment variables:
   ```
   NODE_ENV=production
   PORT=10000
   JWT_SECRET=91ce4ab397e9682f4a4c23ad6ffb5fe2d4218804eae376f3944891768350b532
   CONVEX_URL=https://grand-dachshund-295.convex.cloud/
   ALLOWED_ORIGINS=https://aria-water-frontend.onrender.com
   FRONTEND_URL=https://aria-water-frontend.onrender.com
   PAYMENT_PROVIDER=lipana
   LIPANA_PUBLISHABLE_KEY=lip_pk_test_fa7e40c262551d4723cabebb314ffcaf0b9784d9f72bdce6068bbc6b6bd220ff
   LIPANA_SECRET_KEY=lip_sk_test_180d64eb5eb54d3e2262f6ee990b7108b4dd1d87ab3a0d9bb601eaba7d055db0
   LIPANA_WEBHOOK_SECRET=b5fb48af0cfcd23212ef271e4c8669903063aa28cee0cb56990959bb9414de1c
   ```
6. Click **"Create Web Service"**
7. Wait 5-10 minutes for build
8. **Copy your API URL** (e.g., `https://aria-water-api.onrender.com`)

### 3. Create Frontend Service

1. Click **"New +"** → **"Static Site"**
2. Connect same GitHub repo
3. Fill in:
   - **Name**: `aria-water-frontend`
   - **Build Command**:
     ```
     pnpm install && pnpm run build
     ```
   - **Publish Directory**: `artifacts/ari-water/dist/public`
4. Add environment variable:
   ```
   VITE_API_URL=https://aria-water-api.onrender.com
   ```
   (Use your actual API URL from step 2)
5. Click **"Create Static Site"**
6. Wait 5-10 minutes for build

### 4. Update API CORS Settings

1. Go back to API service
2. Settings → Environment
3. Update these variables with your frontend URL:
   ```
   ALLOWED_ORIGINS=https://aria-water-frontend.onrender.com
   FRONTEND_URL=https://aria-water-frontend.onrender.com
   LIPANA_WEBHOOK_URL=https://aria-water-api.onrender.com/api/webhooks/lipana
   ```
4. Click **"Save Changes"**
5. Service will auto-redeploy

### 5. Test It!

1. Visit your frontend URL: `https://aria-water-frontend.onrender.com`
2. Click **"Sign in with magic link"** or go to `/magic-login`
3. Enter your email
4. Check the response for magic link (development mode)
5. Click the magic link to log in
6. Browse `/shop` to see products
7. Test checkout flow

## ✅ Success Checklist

- [ ] API service deployed and running
- [ ] Frontend service deployed and running
- [ ] Can access frontend URL
- [ ] Magic link login works
- [ ] Admin password login works
- [ ] Shop page loads with products
- [ ] Can add items to cart
- [ ] Checkout flow works
- [ ] Payment integration works

## 🐛 Troubleshooting

### Build Fails

**Check:**
- Logs tab in service dashboard
- All dependencies in package.json
- pnpm version compatibility

**Fix:**
```bash
# Test build locally first
pnpm install
pnpm run build
```

### API Returns 500

**Check:**
- All environment variables set correctly
- CONVEX_URL is accessible
- JWT_SECRET is set

**Fix:**
- View logs in API service
- Test Convex connection: `curl https://your-convex-url.convex.cloud/`

### CORS Errors

**Fix:**
1. Verify `ALLOWED_ORIGINS` matches your frontend URL exactly
2. No trailing slashes
3. Include `https://`
4. Redeploy API after changes

### Slow First Load

**Context:** Free tier spins down after 15 min inactivity

**Options:**
1. Accept 30-60s cold start
2. Upgrade to Starter ($7/month) for always-on
3. Use UptimeRobot to ping every 14 minutes

## 💰 Cost

| Service | Plan | Cost |
|---------|------|------|
| API | Free | $0/month |
| Frontend | Free | $0/month |
| **Total** | | **$0/month** |

**Upgrade for production:**
- API Starter: $7/month (always-on, better perf)
- Total: **$7/month**

## 📚 Next Steps

1. ✅ **Set up custom domain** - See `RENDER_DEPLOYMENT.md`
2. ✅ **Configure email service** - See `MAGIC_LINK_AUTH.md`
3. ✅ **Change admin password** - Use `/api/auth/admin/create-user`
4. ✅ **Generate new JWT_SECRET** - For production security
5. ✅ **Set up monitoring** - Render dashboard → Metrics
6. ✅ **Create database backup** - Convex dashboard → Snapshots

## 🆘 Need Help?

- **Render Docs**: https://render.com/docs
- **Deployment Guide**: See `RENDER_DEPLOYMENT.md`
- **Magic Links**: See `MAGIC_LINK_AUTH.md`
- **Vercel Setup**: See `VERCEL_SETUP.md`

---

**Total Time: ~10-15 minutes** ⏱️

**You're live!** 🎉
