# 🧪 Testing Guide - Production Order System

## ✅ What's Been Fixed

### Critical Fixes Deployed:
1. ✅ Convex functions deployed (all backend operations working)
2. ✅ API server built and ready (`serverless.mjs`)
3. ✅ Duplicate JS files removed (deployment blocker fixed)
4. ✅ Phone-based customer authentication enabled
5. ✅ Guest checkout fully functional
6. ✅ Webhook payment handling configured
7. ✅ Vercel deployment triggered (pushed to GitHub)

---

## 🎯 Priority Testing Order

### Test 1: Guest Order Creation (HIGHEST PRIORITY)
**This is the simplest flow - Pay Later**

```bash
curl -X POST https://www.aritwin.co.ke/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "phone": "0712345678",
    "deliveryAddress": "123 Main St, Nairobi",
    "paymentMethod": "pay_later",
    "items": [
      {
        "productId": "YOUR_PRODUCT_ID_HERE",
        "quantity": 2
      }
    ]
  }'
```

**Expected Response:**
```json
{
  "id": "k1...",
  "customerId": "k2...",
  "customerName": "John Doe",
  "ticketNumber": "AW-240810-XXXX",
  "status": "received",
  "paymentStatus": "pending",
  "paymentMethod": "pay_later",
  "totalKes": 100,
  ...
}
```

**Success Criteria:**
- ✅ Status 201 Created
- ✅ Ticket number generated
- ✅ Order appears in admin dashboard
- ✅ Customer record created/linked by phone

---

### Test 2: Phone-Based Customer Linking
**Test that returning customers are automatically linked**

**First Order:**
```bash
curl -X POST https://www.aritwin.co.ke/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Jane Smith",
    "customerEmail": "jane@example.com",
    "phone": "0722334455",
    "deliveryAddress": "456 Oak Ave, Nairobi",
    "paymentMethod": "pay_later",
    "items": [{"productId": "YOUR_PRODUCT_ID", "quantity": 1}]
  }'
```

Save the `customerId` from response.

**Second Order (Same Phone):**
```bash
curl -X POST https://www.aritwin.co.ke/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Different Name",
    "customerEmail": "different@example.com",
    "phone": "0722334455",
    "deliveryAddress": "Different Address",
    "paymentMethod": "pay_later",
    "items": [{"productId": "YOUR_PRODUCT_ID", "quantity": 1}]
  }'
```

**Success Criteria:**
- ✅ Second order has SAME `customerId` as first order
- ✅ Both orders linked to same customer record
- ✅ Phone number variations work (0722..., 254722..., +254722...)

---

### Test 3: M-Pesa Payment Flow
**Test the complete M-Pesa STK push**

```bash
curl -X POST https://www.aritwin.co.ke/api/payments/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORDER_ID_FROM_TEST_1"
  }'
```

**Expected Response:**
```json
{
  "authorizationUrl": "mpesa://stk-push/TRANSACTION_ID",
  "reference": "PAYMENT_ID",
  "amountKes": 100,
  "message": "STK push sent successfully"
}
```

**Success Criteria:**
- ✅ M-Pesa prompt appears on customer's phone
- ✅ Payment ID returned for tracking
- ✅ Payment record created in database

**Check Payment Status:**
```bash
curl -X POST https://www.aritwin.co.ke/api/payments/verify \
  -H "Content-Type: application/json" \
  -d '{
    "reference": "PAYMENT_ID_FROM_INITIALIZE"
  }'
```

---

### Test 4: Admin Dashboard Endpoints
**Verify all dashboard data loads correctly**

**Get Dashboard Summary:**
```bash
curl https://www.aritwin.co.ke/api/dashboard/summary \
  -H "Authorization: Bearer YOUR_ADMIN_JWT"
```

**Expected Response:**
```json
{
  "totalOrders": 25,
  "pendingOrders": 5,
  "totalRevenue": 125000,
  "activeCustomers": 15
}
```

**Get Recent Orders:**
```bash
curl https://www.aritwin.co.ke/api/dashboard/recent-orders \
  -H "Authorization: Bearer YOUR_ADMIN_JWT"
```

**Get Revenue Trend:**
```bash
curl https://www.aritwin.co.ke/api/dashboard/revenue-trend \
  -H "Authorization: Bearer YOUR_ADMIN_JWT"
```

**Success Criteria:**
- ✅ No 404 errors
- ✅ Data loads within 2 seconds
- ✅ Charts display correctly

---

### Test 5: Authenticated User Orders
**Test with Clerk authentication**

```bash
curl -X POST https://www.aritwin.co.ke/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer CLERK_JWT_TOKEN" \
  -d '{
    "deliveryAddress": "789 Pine St, Nairobi",
    "phone": "0733445566",
    "paymentMethod": "pay_later",
    "items": [{"productId": "YOUR_PRODUCT_ID", "quantity": 3}]
  }'
```

**Success Criteria:**
- ✅ customerName/customerEmail taken from JWT
- ✅ Order linked to authenticated user
- ✅ User can see order in their order history

---

## 🔍 How to Get Product IDs

### From Convex Dashboard:
1. Go to https://grand-dachshund-295.convex.cloud
2. Navigate to "Data" → "products" table
3. Copy an `_id` value (starts with "k")
4. Use this as `productId` in test requests

### From API:
```bash
curl https://www.aritwin.co.ke/api/products
```
Copy any product's `id` from the response.

---

## 🐛 Common Issues & Solutions

### Issue 1: "Product not found or inactive"
**Cause:** Product ID doesn't exist or product is deactivated
**Solution:** Use `GET /api/products` to find valid product IDs

### Issue 2: "Insufficient stock"
**Cause:** Product stock is 0 or less than requested quantity
**Solution:** Check product's `stockQuantity` field, or reduce quantity

### Issue 3: "Invalid Kenyan phone number"
**Cause:** Phone number format not recognized
**Solution:** Use format: `0712345678` or `254712345678` or `+254712345678`

### Issue 4: "Authentication required"
**Cause:** Endpoint requires Clerk JWT but none provided
**Solution:** Add `Authorization: Bearer <JWT>` header, or use endpoints that support guest checkout

### Issue 5: "Invalid webhook signature"
**Cause:** Lipana webhook signature doesn't match
**Solution:** Check `LIPANA_WEBHOOK_SECRET` environment variable matches Lipana dashboard

---

## 📊 Expected Database State After Tests

### Users Table:
```
| _id  | name         | email              | phone        | role     |
|------|--------------|-------------------|--------------|----------|
| k1   | John Doe     | john@example.com  | 0712345678   | customer |
| k2   | Jane Smith   | jane@example.com  | 0722334455   | customer |
```

### Orders Table:
```
| _id  | customerId | ticketNumber     | status    | paymentStatus |
|------|------------|------------------|-----------|---------------|
| k10  | k1         | AW-240810-1234   | received  | pending       |
| k11  | k2         | AW-240810-5678   | received  | pending       |
| k12  | k2         | AW-240810-9012   | received  | pending       |
```

### Payments Table:
```
| _id  | orderId | provider | status    | amount |
|------|---------|----------|-----------|--------|
| k20  | k10     | lipana   | initiated | 100    |
```

---

## ✅ Success Checklist

After running all tests, verify:

- [ ] Guest orders create successfully (Pay Later)
- [ ] Phone number customer linking works
- [ ] M-Pesa STK push sends to phone
- [ ] Payment status updates via webhook
- [ ] Admin dashboard loads all endpoints
- [ ] Authenticated user orders work
- [ ] No 404 errors on any endpoint
- [ ] No 500 errors on valid requests
- [ ] Orders appear in Convex database
- [ ] Ticket numbers generated correctly

---

## 🚀 Production Readiness

### Pre-Launch Checklist:
- [ ] All tests passing
- [ ] Environment variables configured in Vercel
- [ ] Webhook URL registered with Lipana
- [ ] SSL certificate active (HTTPS)
- [ ] Admin accounts created
- [ ] Sample products loaded
- [ ] Stock quantities set

### Environment Variables to Set in Vercel:
```
CONVEX_DEPLOYMENT_URL=https://grand-dachshund-295.convex.cloud/
LIPANA_PUBLISHABLE_KEY=lip_pk_live_...
LIPANA_SECRET_KEY=lip_sk_live_...
LIPANA_WEBHOOK_SECRET=...
CLERK_SECRET_KEY=sk_live_...
ALLOWED_ORIGINS=https://aritwin.co.ke,https://www.aritwin.co.ke
```

---

## 📞 Support & Debugging

### Check Vercel Logs:
```bash
vercel logs --follow
```

### Check Convex Logs:
https://grand-dachshund-295.convex.cloud → Logs tab

### Check API Health:
```bash
curl https://www.aritwin.co.ke/api/debug/public
```

Should return: `{"status":"ok","message":"Public endpoint working"}`

---

## 🎉 Quick Win Tests

**If you only have 5 minutes, run these:**

1. **Order Creation:**
   ```bash
   curl -X POST https://www.aritwin.co.ke/api/orders \
     -H "Content-Type: application/json" \
     -d '{"customerName":"Test","customerEmail":"test@test.com","phone":"0712345678","deliveryAddress":"Test Address","paymentMethod":"pay_later","items":[{"productId":"VALID_PRODUCT_ID","quantity":1}]}'
   ```
   Expected: 201 status + ticket number

2. **Dashboard Check:**
   ```bash
   curl https://www.aritwin.co.ke/api/dashboard/summary \
     -H "Authorization: Bearer ADMIN_JWT"
   ```
   Expected: JSON with totalOrders, etc.

3. **Products List:**
   ```bash
   curl https://www.aritwin.co.ke/api/products
   ```
   Expected: Array of products with IDs

If all 3 work → System is operational! ✅

---

**Last Updated:** 2026-08-10  
**Deployment Status:** LIVE 🚀  
**Commit:** `1005a41`
