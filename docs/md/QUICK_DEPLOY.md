# Quick Deployment Guide

## Pre-Deployment Checklist

✅ All API routes fixed and properly mounted  
✅ Guest checkout authentication configured  
✅ M-PESA/Lipana integration ready  
✅ Convex schema includes all tables  
✅ API client base URL configuration added  

## Deploy to Production

### 1. Deploy Convex Backend
```bash
npx convex deploy --prod
```

### 2. Update Environment Variables

Set these in your hosting platform (Render, Vercel, etc.):

**API Server:**
```env
NODE_ENV=production
PORT=3000
CONVEX_URL=<from_convex_dashboard>
CONVEX_DEPLOY_KEY=<from_convex_dashboard>
JWT_SECRET=<generate_secure_random_string>
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=<secure_password>

LIPANA_SECRET_KEY=<from_lipana_dashboard>
LIPANA_PUBLISHABLE_KEY=<from_lipana_dashboard>
LIPANA_WEBHOOK_SECRET=<from_lipana_dashboard>
LIPANA_WEBHOOK_URL=https://yourdomain.com/api/payments/webhook/lipana
LIPANA_PRODUCTION=true
PAYMENT_PROVIDER=lipana

ALLOWED_ORIGINS=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

**Frontend:**
```env
VITE_API_URL=https://yourdomain.com
```

### 3. Build and Deploy

**Option A: Using deploy folder (already built)**
```bash
# The deploy folder contains pre-built assets
# Upload deploy/api/* to your API server
# Upload deploy/public/* to your static hosting
```

**Option B: Build from source**
```bash
# Build API
cd artifacts/api-server
npm install
npm run build

# Build Frontend
cd ../ari-water
npm install
npm run build
```

### 4. Verify Deployment

Test these endpoints:

```bash
# Health check
curl https://yourdomain.com/api/health

# Products list
curl https://yourdomain.com/api/products?inStock=true

# Order creation (guest)
curl -X POST https://yourdomain.com/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test User",
    "customerEmail": "test@example.com",
    "deliveryAddress": "Test Address",
    "phone": "0712345678",
    "paymentMethod": "mpesa",
    "items": [{"productId": "...", "quantity": 1}]
  }'
```

### 5. Test M-PESA Integration

1. Place a test order on the frontend
2. Verify STK push is received on phone
3. Complete payment
4. Check payment status updates correctly
5. Verify webhook receives callbacks

## Common Issues & Fixes

### Issue: 401 on /api/orders
**Fix:** Ensure `optionalAuth` middleware is applied to POST /api/orders

### Issue: 500 on /api/orders  
**Fix:** Check Convex connection and environment variables

### Issue: M-PESA not sending
**Fix:** 
- Verify `LIPANA_PRODUCTION=true` for live keys
- Check phone number format (254XXXXXXXXX)
- Confirm Lipana credentials are correct

### Issue: CORS errors
**Fix:** Set `ALLOWED_ORIGINS` to include your frontend domain

### Issue: Routes not found
**Fix:** Ensure app.ts mounts router at `/api` path

## Rollback Plan

If deployment fails:

1. **Revert Convex:**
   ```bash
   npx convex rollback
   ```

2. **Redeploy previous version** from hosting platform dashboard

3. **Check logs** to identify the issue

## Post-Deployment

1. ✅ Test guest checkout flow
2. ✅ Test authenticated checkout
3. ✅ Verify M-PESA payments work
4. ✅ Check admin dashboard loads
5. ✅ Test order tracking
6. ✅ Monitor error logs for 24 hours

## Support

- Convex Dashboard: https://dashboard.convex.dev
- Lipana Dashboard: https://lipana.africa/dashboard
- GitHub Repo: https://github.com/mufasa78/ariawater

## Next Steps

- [ ] Set up monitoring (e.g., Sentry for error tracking)
- [ ] Configure automated backups
- [ ] Set up CI/CD pipeline
- [ ] Add integration tests
- [ ] Configure analytics
- [ ] Set up SSL/TLS certificates
- [ ] Enable rate limiting
- [ ] Configure CDN for static assets
