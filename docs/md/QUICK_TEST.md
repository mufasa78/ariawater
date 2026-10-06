# ⚡ Quick Test - 5 Minutes to Verify Everything

## 🎯 Fast Verification Tests

Run these 5 tests to verify the entire system is working:

---

## Test 1: API Health (10 seconds)

```bash
curl https://www.aritwin.co.ke/api/debug/public
```

**Expected:** `{"status":"ok","message":"Public endpoint working"}`

✅ **PASS** = API is alive  
❌ **FAIL** = Vercel deployment issue

---

## Test 2: Products List (10 seconds)

```bash
curl https://www.aritwin.co.ke/api/products
```

**Expected:** JSON array with products, each having:
```json
{
  "id": "k...",
  "name": "Water 500ml",
  "priceKes": 50,
  "stockQuantity": 100,
  ...
}
```

✅ **PASS** = Convex connection working  
❌ **FAIL** = Convex deployment issue

**Action:** Copy a `productId` from response for next test

---

## Test 3: Guest Order Creation - Pay Later (30 seconds)

```bash
curl -X POST https://www.aritwin.co.ke/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Test Customer",
    "customerEmail": "test@example.com",
    "phone": "0712345678",
    "deliveryAddress": "Test St, Nairobi",
    "paymentMethod": "pay_later",
    "items": [{"productId": "PASTE_PRODUCT_ID_HERE", "quantity": 1}]
  }'
```

**Expected:** Status `201 Created` with:
```json
{
  "id": "k...",
  "ticketNumber": "AW-240810-1234",
  "status": "received",
  "paymentStatus": "pending",
  "paymentMethod": "pay_later",
  ...
}
```

✅ **PASS** = Order creation working  
❌ **FAIL** = Check error message

**Common Issues:**
- "Product not found" → Use valid productId from Test 2
- "Insufficient stock" → Product out of stock, try different product
- 400/500 error → Check response for details

---

## Test 4: Payment Status Endpoint (20 seconds)

Use the `orderId` from Test 3:

```bash
curl https://www.aritwin.co.ke/api/payments/PASTE_ORDER_ID_HERE/status
```

**Expected:** 
```json
{
  "success": false,
  "status": "pending",
  "message": "Payment status: pending"
}
```

✅ **PASS** = Status endpoint working (the missing endpoint that broke checkout)  
❌ **FAIL** = Critical issue - checkout will fail

---

## Test 5: Admin Dashboard (30 seconds)

**Note:** Requires admin JWT token. Login to admin panel first, then:

```bash
curl https://www.aritwin.co.ke/api/dashboard/summary \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_HERE"
```

**Expected:**
```json
{
  "todayRevenue": 0,
  "todayOrders": 1,
  "weekRevenue": 0,
  "weekOrders": 1,
  "totalRevenue": 0,
  "totalOrders": 1,
  "ordersByStatus": {
    "received": 1,
    "processing": 0,
    "dispatched": 0,
    "delivered": 0
  },
  "lowStockProducts": 0
}
```

✅ **PASS** = Dashboard working  
❌ **FAIL** = Dashboard query issue

---

## 🎉 Success Criteria

If all 5 tests pass:
- ✅ API server deployed and functional
- ✅ Convex backend connected
- ✅ Guest order creation working
- ✅ Payment status endpoint fixed
- ✅ Admin dashboard operational

**System is LIVE and PRODUCTION READY!** 🚀

---

## 🔥 Critical Flows to Test Manually

### M-Pesa Payment (2 minutes)
1. Go to https://www.aritwin.co.ke/shop
2. Add product to cart
3. Checkout → Select "M-Pesa"
4. Enter **real Kenyan phone number** (07... or 254...)
5. Click "Complete Order"
6. **Check your phone** - should receive M-Pesa STK push
7. Enter PIN
8. Wait 10-15 seconds
9. Should see "Payment Successful" or "Payment Failed"

**What This Tests:**
- ✅ Lipana STK push integration
- ✅ Payment status polling (new endpoint)
- ✅ Webhook callback processing
- ✅ Frontend payment flow

---

### Guest Checkout (1 minute)
1. Go to https://www.aritwin.co.ke/shop
2. Add product to cart
3. Checkout → Enter guest details
4. Select "Pay Later"
5. Submit order
6. Should see ticket number: `AW-YYMMDD-XXXX`

**What This Tests:**
- ✅ Guest order creation
- ✅ Phone-based customer linking
- ✅ Ticket generation
- ✅ Pay Later enum fix

---

### Admin Panel (1 minute)
1. Login to admin at https://www.aritwin.co.ke/admin
2. Check dashboard loads (no 404 errors)
3. Go to Orders
4. Search for customer name
5. Update order status

**What This Tests:**
- ✅ Clerk authentication
- ✅ Dashboard queries (bounded, no full scans)
- ✅ Search functionality
- ✅ Status updates

---

## 🚨 If Any Test Fails

### API Health Fails
- Check Vercel deployment logs
- Verify environment variables set
- Check `api/index.js` is present

### Products List Fails
- Check Convex deployment status
- Verify `CONVEX_DEPLOYMENT_URL` env var
- Check Convex dashboard for errors

### Order Creation Fails
- Check error message in response
- Verify product exists and has stock
- Check Convex orders.create mutation logs

### Payment Status Fails
- Critical - this is what broke before
- Check `artifacts/api-server/src/routes/payments.ts` deployed
- Verify route exists: `GET /:reference/status`

### Dashboard Fails
- Check JWT token is valid
- Verify user has admin role
- Check Convex dashboard queries deployed

---

## 📊 Quick Stats to Monitor

After tests, check:
- **Convex Dashboard:** https://grand-dachshund-295.convex.cloud
  - Function calls today
  - Database size
  - No error spikes

- **Vercel Dashboard:** 
  - Deployment status
  - Function execution logs
  - Edge network status

---

## ✅ Verification Complete

All 5 tests passed? **Congratulations!** 🎊

Your system is:
- ✅ Deployed successfully
- ✅ All fixes applied
- ✅ Payment flows working
- ✅ Performance optimized
- ✅ Ready for customers

**Time to launch!** 🚀

---

**Quick Test Card**  
**Last Updated:** 2026-08-10  
**Commit:** `5632a01`  
**Duration:** 5 minutes  
**Coverage:** All critical flows
