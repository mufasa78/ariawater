# Render Deployment Guide for Aria Water

This guide will help you deploy the Aria Water Management System to Render.

## Overview

The application consists of two services:
1. **API Server** - Node.js Web Service (Express + Convex)
2. **Frontend** - Static Site (React + Vite)

## Prerequisites

- [x] GitHub repository with latest code
- [x] Render account (free tier available)
- [x] Convex account with deployed backend
- [x] Lipana account for M-Pesa payments (optional)

## Step 1: Deploy Convex Backend

Before deploying to Render, ensure Convex is deployed:

```bash
cd d:\Work\Websites\Aria Water\App\Aria-Water-Management\aria-water
npx convex deploy
```

**Important:** Save your Convex deployment URL (e.g., `https://grand-dachshund-295.convex.cloud/`)

## Step 2: Create Render Account

1. Go to https://render.com
2. Sign up with GitHub (recommended)
3. Authorize Render to access your GitHub repositories

## Step 3: Deploy Using Blueprint (Recommended)

### Option A: Automatic Blueprint Deployment

1. Go to https://dashboard.render.com/blueprints
2. Click **"New Blueprint Instance"**
3. Connect your GitHub repository: `mufasa78/ariawater`
4. Render will detect `render.yaml` automatically
5. Click **"Apply"**

### Option B: Manual Service Creation

If blueprint doesn't work, create services manually:

#### 3.1 Deploy API Server

1. Go to https://dashboard.render.com/
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub repository: `mufasa78/ariawater`
4. Configure:
   - **Name**: `aria-water-api`
   - **Region**: Oregon (or nearest to you)
   - **Branch**: `main`
   - **Root Directory**: Leave empty
   - **Runtime**: Node
   - **Build Command**:
     ```bash
     pnpm install --frozen-lockfile && pnpm run typecheck:libs && pnpm --filter @workspace/api-server run build
     ```
   - **Start Command**:
     ```bash
     cd artifacts/api-server && node dist/index.mjs
     ```
   - **Plan**: Free (or Starter for better performance)

5. Click **"Advanced"** and add environment variables (see below)

6. Click **"Create Web Service"**

#### 3.2 Deploy Frontend

1. Click **"New +"** → **"Static Site"**
2. Connect same GitHub repository
3. Configure:
   - **Name**: `aria-water-frontend`
   - **Branch**: `main`
   - **Build Command**:
     ```bash
     export NODE_OPTIONS="--max-old-space-size=2048" && pnpm install --frozen-lockfile && pnpm run typecheck:libs && pnpm --filter @workspace/ari-water run build
     ```
   - **Publish Directory**: `artifacts/ari-water/dist/public`
   - **Plan**: Free

4. Add environment variables (see below)

   | Key | Value |
   |-----|-------|
   | `NODE_OPTIONS` | `--max-old-space-size=2048` |
   | `VITE_API_URL` | `https://aria-water-api.onrender.com` |

5. Click **"Create Static Site"**

## Step 4: Configure Environment Variables

### API Server Environment Variables

Go to API service → Environment → Add Environment Variable:

| Key | Value | Required |
|-----|-------|----------|
| `NODE_ENV` | `production` | ✅ Yes |
| `PORT` | `10000` | ✅ Yes |
| `JWT_SECRET` | `91ce4ab397e9682f4a4c23ad6ffb5fe2d4218804eae376f3944891768350b532` | ✅ Yes |
| `CONVEX_URL` | `https://grand-dachshund-295.convex.cloud/` | ✅ Yes |
| `CONVEX_DEPLOYMENT_URL` | `https://grand-dachshund-295.convex.cloud/` | ✅ Yes |
| `ALLOWED_ORIGINS` | `https://aria-water-frontend.onrender.com` | ✅ Yes |
| `FRONTEND_URL` | `https://aria-water-frontend.onrender.com` | ✅ Yes |
| `PAYMENT_PROVIDER` | `lipana` | ⚠️  Optional |
| `LIPANA_PUBLISHABLE_KEY` | `lip_pk_test_...` | ⚠️  If using Lipana |
| `LIPANA_SECRET_KEY` | `lip_sk_test_...` | ⚠️  If using Lipana |
| `LIPANA_WEBHOOK_SECRET` | `b5fb48af0cfcd...` | ⚠️  If using Lipana |
| `LIPANA_WEBHOOK_URL` | `https://aria-water-api.onrender.com/api/webhooks/lipana` | ⚠️  If using Lipana |

**Note:** Replace `aria-water-api` and `aria-water-frontend` with your actual Render service URLs.

### Frontend Environment Variables

Go to Frontend service → Environment → Add Environment Variable:

| Key | Value | Required |
|-----|-------|----------|
| `VITE_API_URL` | `https://aria-water-api.onrender.com` | ✅ Yes |

## Step 5: Configure Custom Domains (Optional)

### API Domain

1. Go to API service → Settings → Custom Domains
2. Click **"Add Custom Domain"**
3. Enter: `api.ariwater.co.ke`
4. Follow DNS configuration instructions
5. Add CNAME record to your domain:
   ```
   api.ariwater.co.ke → aria-water-api.onrender.com
   ```

### Frontend Domain

1. Go to Frontend service → Settings → Custom Domains
2. Click **"Add Custom Domain"**
3. Enter: `ariwater.co.ke` or `www.ariwater.co.ke`
4. Add DNS records:
   ```
   ariwater.co.ke → aria-water-frontend.onrender.com
   www.ariwater.co.ke → aria-water-frontend.onrender.com
   ```

5. Update API `ALLOWED_ORIGINS` and `FRONTEND_URL` to use custom domains

## Step 6: Update Frontend API Configuration

After deploying, update the frontend to use the correct API URL:

1. Go to Frontend Environment Variables
2. Update `VITE_API_URL` to your API URL:
   - Render URL: `https://aria-water-api.onrender.com`
   - Custom domain: `https://api.ariwater.co.ke`

3. Redeploy frontend: Settings → Manual Deploy → Deploy latest commit

## Step 7: Test the Deployment

### 1. Test API Health

```bash
curl https://aria-water-api.onrender.com/api/healthz
```

**Expected:**
```json
{"status":"ok"}
```

### 2. Test Magic Link Authentication

```bash
curl -X POST https://aria-water-api.onrender.com/api/magic-auth/request \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'
```

### 3. Test Frontend

Visit: `https://aria-water-frontend.onrender.com`

Try:
- Magic link login: `/magic-login`
- Admin login: `/login`
- Shop: `/shop`
- Orders: `/orders`

## Step 8: Configure Webhooks

### Lipana Webhook

1. Log in to Lipana dashboard
2. Go to Settings → Webhooks
3. Add webhook URL: `https://aria-water-api.onrender.com/api/webhooks/lipana`
4. Copy webhook secret and add to API environment variables

## Troubleshooting

### Issue: Build Fails with "pnpm not found"

**Solution:** Render uses pnpm by default when `pnpm-lock.yaml` is detected. If it fails:
1. Go to service Settings
2. Add environment variable: `PNPM_VERSION=10.28.0`
3. Redeploy

### Issue: API returns 500 errors

**Check:**
1. All environment variables are set correctly
2. `CONVEX_URL` is accessible
3. Check service logs: Service → Logs tab

### Issue: CORS errors

**Solution:**
1. Verify `ALLOWED_ORIGINS` includes your frontend URL
2. Format: `https://aria-water-frontend.onrender.com` (no trailing slash)
3. Redeploy API after changing

### Issue: Frontend shows blank page

**Check:**
1. Build logs for errors
2. Browser console for errors
3. Verify `VITE_API_URL` is set correctly
4. Check Network tab for failed API calls

### Issue: Frontend build fails with "JavaScript heap out of memory"

**Cause:** Vite build exceeds available memory (512MB on free tier)

**Solution:**
1. Add environment variable: `NODE_OPTIONS=--max-old-space-size=2048`
2. Update build command to include:
   ```bash
   export NODE_OPTIONS="--max-old-space-size=2048"
   ```
3. Redeploy
4. If still fails, upgrade to Starter plan (more RAM)

### Issue: Slow cold starts (Free tier)

**Context:** Render free tier spins down after 15 minutes of inactivity

**Solutions:**
1. Upgrade to Starter plan ($7/month) for always-on
2. Use a service like UptimeRobot to ping every 14 minutes
3. Accept 30-60 second cold start delay

## Monitoring & Logs

### View Logs

1. Go to service in Render dashboard
2. Click **"Logs"** tab
3. Real-time logs will appear
4. Filter by severity: Info, Warning, Error

### Set Up Alerts

1. Go to service → Settings → Notifications
2. Add email for deployment notifications
3. Configure Slack webhook for alerts

### Monitor Performance

1. Go to service → Metrics
2. View:
   - Response times
   - Memory usage
   - CPU usage
   - Bandwidth

## Backup & Rollback

### Manual Backup

Render keeps all deployments. To rollback:

1. Go to service → Deploys
2. Find working deployment
3. Click **"..."** → **"Redeploy"**

### Database Backups

**Convex:** Automatic backups included
- Go to Convex dashboard
- Data → Snapshots
- Create manual snapshot before major changes

## Cost Estimate

| Service | Plan | Cost/Month |
|---------|------|------------|
| API Server | Free | $0 |
| Frontend | Free | $0 |
| **Total (Free)** | | **$0** |

**Upgrade Options:**
- API Server Starter: $7/month (always-on, better performance)
- Frontend: Always free
- **Total (Starter):** **$7/month**

## Production Checklist

Before going live:

- [ ] Deploy Convex backend with `npx convex deploy`
- [ ] Set all required environment variables
- [ ] Test API health endpoint
- [ ] Test magic link authentication
- [ ] Test password authentication (admin)
- [ ] Test shop and product browsing
- [ ] Test order creation
- [ ] Test M-Pesa payment flow
- [ ] Configure custom domains (optional)
- [ ] Set up Lipana webhooks
- [ ] Change default admin password
- [ ] Generate new JWT_SECRET for production
- [ ] Enable HTTPS (automatic on Render)
- [ ] Test CORS with production frontend
- [ ] Set up monitoring alerts
- [ ] Create Convex database snapshot
- [ ] Test magic link email delivery (add email service)

## Email Service Integration

For production, integrate email service for magic links:

### Option 1: SendGrid

```typescript
// Add to environment variables
SENDGRID_API_KEY=your_key
FROM_EMAIL=noreply@ariwater.co.ke
```

### Option 2: AWS SES

```typescript
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
FROM_EMAIL=noreply@ariwater.co.ke
```

### Option 3: Resend

```typescript
RESEND_API_KEY=your_key
FROM_EMAIL=noreply@ariwater.co.ke
```

See `MAGIC_LINK_AUTH.md` for implementation details.

## CI/CD Setup

Render auto-deploys on git push by default:

1. Push to `main` branch
2. Render detects changes
3. Automatic build & deploy
4. Health check runs
5. Traffic switches to new version

**Disable auto-deploy:**
1. Service → Settings → Build & Deploy
2. Uncheck "Auto-Deploy"
3. Use manual deploys from dashboard

## Support & Resources

- **Render Docs**: https://render.com/docs
- **Render Status**: https://status.render.com
- **Community**: https://community.render.com
- **Support**: support@render.com (paid plans)

## Next Steps

1. Deploy to Render using steps above
2. Test all functionality
3. Configure custom domain
4. Set up email service for magic links
5. Monitor logs and performance
6. Upgrade to paid plan if needed

---

**Deployment Status Checklist:**

✅ Code pushed to GitHub  
✅ Convex deployed  
⬜ API deployed to Render  
⬜ Frontend deployed to Render  
⬜ Environment variables configured  
⬜ Custom domains configured (optional)  
⬜ Webhooks configured  
⬜ Email service configured  
⬜ Production testing complete  

**You're ready to deploy!** 🚀
