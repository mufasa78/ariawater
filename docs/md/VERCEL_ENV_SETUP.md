# Vercel Environment Variables Setup

## 🚨 Critical: Configure These in Vercel Dashboard

Go to: https://vercel.com/your-project/settings/environment-variables

### Required Environment Variables

```env
# Database
CONVEX_URL=https://grand-dachshund-295.convex.cloud/
CONVEX_DEPLOYMENT_URL=https://grand-dachshund-295.convex.cloud/
CONVEX_DEPLOY_KEY=prod:grand-dachshund-295|eyJ2MiI6ImYyZDA5OTBhNTM3OTQzZGI5ZThjZGUxYzk5NGU3M2M4In0=

# Authentication (GENERATE NEW FOR PRODUCTION!)
JWT_SECRET=91ce4ab397e9682f4a4c23ad6ffb5fe2d4218804eae376f3944891768350b532

# Admin Credentials
ADMIN_EMAIL=admin@ariwater.co.ke
ADMIN_PASSWORD=Admin@123!

# Lipana M-Pesa
LIPANA_SECRET_KEY=lip_sk_live_...
LIPANA_PUBLISHABLE_KEY=lip_pk_live_...
LIPANA_WEBHOOK_SECRET=b5fb48af0cfcd23212ef271e4c8669903063aa28cee0cb56990959bb9414de1c
LIPANA_WEBHOOK_URL=https://your-vercel-domain.vercel.app/api/payments/webhook/lipana

# Payment Configuration
PAYMENT_PROVIDER=lipana

# API Configuration (Vercel serverless)
PORT=3000
NODE_ENV=production
```

## Quick Setup Steps

1. **Go to Vercel Dashboard**
   - Open your project
   - Click "Settings" → "Environment Variables"

2. **Add Each Variable**
   - Click "Add New"
   - Enter Name and Value
   - Select "Production", "Preview", and "Development"
   - Click "Save"

3. **Update Webhook URL**
   - After deployment, update `LIPANA_WEBHOOK_URL` with your Vercel URL
   - Format: `https://your-app.vercel.app/api/payments/webhook/lipana`

4. **Redeploy**
   - Go to "Deployments"
   - Click "..." → "Redeploy"
   - Select "Use existing Build Cache"

## Security Notes

- ⚠️ **IMPORTANT**: Generate a new `JWT_SECRET` for production
- ⚠️ Change `ADMIN_PASSWORD` after first login
- ⚠️ Get Lipana production keys when ready to go live

## Generate New JWT_SECRET

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and use it as your production `JWT_SECRET`.
