# Quick Deploy Guide - Aria Water to Vercel

## 🚀 Deploy in 3 Steps

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Ready for production deployment"
git push origin main
```

### Step 2: Import to Vercel
1. Go to https://vercel.com
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Vercel auto-detects settings from `vercel.json`

### Step 3: Add Environment Variables
In Vercel Dashboard → Settings → Environment Variables, add these:

```
JWT_SECRET=91ce4ab397e9682f4a4c23ad6ffb5fe2d4218804eae376f3944891768350b532
CONVEX_URL=https://grand-dachshund-295.convex.cloud/
CONVEX_DEPLOYMENT_URL=https://grand-dachshund-295.convex.cloud/
ALLOWED_ORIGINS=https://ariawater.vercel.app
FRONTEND_URL=https://ariawater.vercel.app
PAYMENT_PROVIDER=lipana
LIPANA_PUBLISHABLE_KEY=lip_pk_test_fa7e40c262551d4723cabebb314ffcaf0b9784d9f72bdce6068bbc6b6bd220ff
LIPANA_SECRET_KEY=lip_sk_test_180d64eb5eb54d3e2262f6ee990b7108b4dd1d87ab3a0d9bb601eaba7d055db0
LIPANA_WEBHOOK_SECRET=b5fb48af0cfcd23212ef271e4c8669903063aa28cee0cb56990959bb9414de1c
LIPANA_WEBHOOK_URL=https://ariawater.vercel.app/api/webhooks/lipana
```

**Note:** Replace `ariawater.vercel.app` with your actual Vercel domain after first deployment.

---

## ✅ What's Already Configured

### Frontend ✅
- React + TypeScript + Vite
- All pages created and routed
- About page with full content
- Magic link authentication UI
- Shopping cart & checkout
- Admin dashboard
- Responsive design

### API ✅
- Express server configured for Vercel serverless
- All routes with `.js` extensions for ESM
- Authentication (password + magic link)
- Payment processing (Lipana/M-Pesa)
- Order management
- Product CRUD
- Admin operations

### Database ✅
- Convex configured and deployed
- All schemas defined
- Magic link tokens table
- Users, products, orders tables

### SEO ✅
- Sitemap.xml created
- Robots.txt configured
- Meta tags in pages
- Open Graph ready

---

## 🧪 Test After Deployment

1. **Homepage:** https://your-app.vercel.app/
2. **Shop:** https://your-app.vercel.app/shop
3. **About:** https://your-app.vercel.app/about
4. **Magic Login:** https://your-app.vercel.app/magic-login
5. **Admin:** https://your-app.vercel.app/login (admin password)
6. **Sitemap:** https://your-app.vercel.app/sitemap.xml
7. **API Health:** https://your-app.vercel.app/api/products

---

## 🔧 Update Domain After First Deploy

1. After Vercel assigns your domain (e.g., `aria-water-abc123.vercel.app`)
2. Update these environment variables:
   - `ALLOWED_ORIGINS`
   - `FRONTEND_URL`
   - `LIPANA_WEBHOOK_URL`
3. Redeploy

---

## 🎯 Features Ready

✅ Magic link authentication (passwordless for customers)  
✅ Password authentication (for admin)  
✅ Shopping cart with M-Pesa payment  
✅ Order tracking  
✅ Admin dashboard (products, orders, refunds)  
✅ About page with company info  
✅ SEO optimization (sitemap, robots.txt)  
✅ Mobile responsive  
✅ Cookie consent (GDPR compliant)  

---

## 📞 Need Help?

Check the full guide: `DEPLOYMENT_STATUS.md`

---

**Ready to deploy!** 🚀
