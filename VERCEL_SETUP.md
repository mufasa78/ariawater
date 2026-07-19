# Vercel Deployment Setup

## Required Environment Variables

The following environment variables **MUST** be configured in your Vercel project settings:

### Required Variables

1. **JWT_SECRET** (Required)
   - Secret key for JWT token signing
   - Example: `91ce4ab397e9682f4a4c23ad6ffb5fe2d4218804eae376f3944891768350b532`
   - Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

2. **CONVEX_URL** or **CONVEX_DEPLOYMENT_URL** (Required)
   - Your Convex deployment URL
   - Example: `https://grand-dachshund-295.convex.cloud/`
   - Get from: Convex dashboard

3. **CONVEX_DEPLOY_KEY** (Optional, for CI/CD)
   - Only needed if deploying Convex from Vercel build
   - Format: `prod:project-name|base64-key`

### Optional Payment Variables

4. **PAYMENT_PROVIDER** (Optional, defaults to 'paystack')
   - Options: `lipana` or `paystack`

5. **LIPANA_PUBLISHABLE_KEY** (If using Lipana)
6. **LIPANA_SECRET_KEY** (If using Lipana)
7. **LIPANA_WEBHOOK_SECRET** (If using Lipana)
8. **LIPANA_WEBHOOK_URL** (If using Lipana)
   - Example: `https://your-domain.vercel.app/api/webhooks/lipana`

9. **PAYSTACK_SECRET_KEY** (If using Paystack)

### CORS Configuration

10. **ALLOWED_ORIGINS** (Optional, production only)
    - Comma-separated list of allowed origins
    - Example: `https://yourdomain.com,https://www.yourdomain.com`
    - Leave empty in development

## How to Set Environment Variables in Vercel

### Via Vercel Dashboard:

1. Go to your project: https://vercel.com/your-team/ariawater
2. Click **Settings** tab
3. Click **Environment Variables** in sidebar
4. Add each variable:
   - Key: Variable name (e.g., `JWT_SECRET`)
   - Value: Variable value
   - Environment: Select `Production`, `Preview`, and `Development` as needed
5. Click **Save**

### Via Vercel CLI:

```bash
# Add a single variable
vercel env add JWT_SECRET production

# Pull environment variables to local
vercel env pull .env.local
```

## Deployment Checklist

- [ ] Set `JWT_SECRET` in Vercel
- [ ] Set `CONVEX_URL` or `CONVEX_DEPLOYMENT_URL` in Vercel
- [ ] Set payment provider variables (Lipana or Paystack)
- [ ] Set `ALLOWED_ORIGINS` for production CORS
- [ ] Trigger a new deployment: `git push` or redeploy in Vercel dashboard
- [ ] Test API endpoints:
  - `GET /api/healthz` - Should return `{"status":"ok"}`
  - `POST /api/auth/register` - Test user registration
  - `POST /api/auth/login` - Test user login

## Troubleshooting

### Error: "JWT_SECRET must be set"
- Add `JWT_SECRET` to Vercel environment variables
- Redeploy after adding

### Error: "CONVEX_URL must be set"
- Add `CONVEX_URL` or `CONVEX_DEPLOYMENT_URL` to Vercel environment variables
- Get the URL from your Convex dashboard

### API returns 500 errors
- Check Vercel function logs: Project → Deployments → Click deployment → Functions tab
- Verify all required environment variables are set
- Check for deployment errors in build logs

### CORS errors in production
- Add your production domain to `ALLOWED_ORIGINS` environment variable
- Format: `https://yourdomain.com` (no trailing slash)
