# Pay Later Test Guide

## What "Pay Later" Should Do

1. User adds items to cart
2. Clicks checkout
3. Fills in delivery details
4. Selects "Pay Later" payment method  
5. Clicks "Place Order"
6. **Order is created** with:
   - Status: "received"
   - Payment Status: "pending"
   - Ticket Number: `AW-YYMMDD-XXXX`
7. Success message shown with ticket number
8. User can pay later from orders page

## Code Flow

### Frontend (Shop.tsx)
```typescript
// When paymentMethod === 'pay_later'
createOrder.mutate({
  data: {
    customerName,
    customerEmail,
    deliveryAddress,
    phone,
    notes,
    paymentMethod: 'pay_later',  // ← Key: This is set
    items: [...]
  }
}, {
  onSuccess: (order) => {
    if (paymentMethod === 'mpesa') {
      // M-Pesa flow...
    } else {
      // Pay later - just show success
      setMpesaStatus('success');
      setMpesaMessage(
        `Order placed successfully! Your ticket number is ${order.ticketNumber}`
      );
    }
  }
});
```

### Backend (orders.ts)
```typescript
// POST /api/orders
router.post("/", optionalAuth, async (req, res) => {
  // No authentication required for guest checkout
  // Calls Convex orders.create mutation
  const order = await convex.mutation(api.orders.create, {
    customerName,
    customerEmail,
    deliveryAddress,
    phone,
    notes,
    paymentMethod: 'pay_later',  // ← Passed to Convex
    items: [...]
  });
  
  res.status(201).json(order);  // ← Returns order with ticketNumber
});
```

### Database (Convex orders.create)
```typescript
export const create = mutation({
  handler: async (ctx, { paymentMethod, ... }) => {
    // Generate ticket number
    const ticketNumber = `AW-${datePrefix}-${randomSuffix}`;
    
    // Create order
    const orderId = await ctx.db.insert("orders", {
      paymentMethod,          // ← Stored
      paymentStatus: "pending",
      ticketNumber,          // ← Generated
      status: "received",
      ...
    });
    
    // Create ticket for tracking
    await ctx.db.insert("tickets", {
      orderId,
      ticketNumber,
      ...
    });
    
    return ctx.db.get(orderId);  // ← Returns order with ticketNumber
  }
});
```

## Testing Steps

### Step 1: Open Shop (As Guest)
```
1. Go to: https://www.aritwin.co.ke/shop
2. Do NOT login (test as guest)
```

### Step 2: Add Products to Cart
```
1. Click "Add to Cart" on any product
2. Verify cart badge updates
3. Click cart icon to view cart
```

### Step 3: Go to Checkout
```
1. Click "Proceed to Checkout" button
2. Should see checkout form
```

### Step 4: Fill Delivery Details
```
Customer Name: Test User
Email: test@example.com
Phone: 0712345678  (or 254712345678)
Delivery Address: Nairobi, Kenya
Notes: (optional)
```

### Step 5: Select Payment Method
```
1. Select "Pay Later" radio button
   (NOT M-Pesa)
2. Verify "Pay Later" is selected
```

### Step 6: Place Order
```
1. Click "Place Order" button
2. Button should show "Processing..." briefly
3. Wait for response (~2-3 seconds)
```

### Step 7: Verify Success
```
✅ Expected behavior:
- Success message appears: "Order placed successfully!"
- Shows ticket number: "AW-XXXXXX-XXXX"
- Modal or toast notification visible
- Cart is cleared
- Can track order with ticket number

❌ If failing:
- Check browser console for errors
- Check Network tab for API call
- Look for 404, 401, or 500 errors
```

## What Could Go Wrong

### Issue 1: 404 Error on /api/orders
**Symptoms:**
```
POST https://www.aritwin.co.ke/api/orders 404
```

**Cause:** API routing not working (Vercel issue)

**Fix:** Wait for latest Vercel deployment (commit dd3429b)

**Test:**
```bash
curl https://www.aritwin.co.ke/api/health
# Should return 200 OK
```

### Issue 2: 400 Bad Request
**Symptoms:**
```json
{
  "error": "customerName and customerEmail are required for guest checkout"
}
```

**Cause:** Form fields not filled or not being sent

**Fix:** Ensure all required fields are filled

### Issue 3: 400 Stock Error
**Symptoms:**
```json
{
  "error": "Insufficient stock for Aria Water 500ml"
}
```

**Cause:** Product out of stock

**Fix:** Use admin panel to increase stock or choose different product

### Issue 4: 500 Server Error
**Symptoms:**
```
POST https://www.aritwin.co.ke/api/orders 500
```

**Causes:**
- Convex connection issue
- Database error
- Missing environment variable

**Check:**
```bash
# Verify Convex URL is set
CONVEX_URL=https://grand-dachshund-295.convex.cloud/
```

### Issue 5: Order Created But No Ticket Number
**Symptoms:**
- Order appears in database
- But ticket number is undefined/null

**Cause:** Convex mutation not returning full order

**Fix:** Check Convex logs for errors

## API Call Details

### Request
```http
POST /api/orders HTTP/1.1
Host: www.aritwin.co.ke
Content-Type: application/json

{
  "customerName": "Test User",
  "customerEmail": "test@example.com",
  "deliveryAddress": "Nairobi, Kenya",
  "phone": "0712345678",
  "notes": "",
  "paymentMethod": "pay_later",
  "items": [
    {
      "productId": "abc123...",
      "quantity": 2
    }
  ]
}
```

### Response (Success)
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": "xyz789...",
  "customerName": "Test User",
  "customerEmail": "test@example.com",
  "deliveryAddress": "Nairobi, Kenya",
  "phone": "0712345678",
  "ticketNumber": "AW-260810-5678",  ← IMPORTANT!
  "status": "received",
  "paymentStatus": "pending",
  "paymentMethod": "pay_later",
  "totalKes": 1000,
  "createdAt": "2026-08-10T14:30:00.000Z",
  ...
}
```

## Browser Console Test

Open browser console and test the API directly:

```javascript
// Test order creation (use actual product IDs from your database)
fetch('/api/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    customerName: 'Console Test',
    customerEmail: 'console@test.com',
    deliveryAddress: 'Test Address',
    phone: '0712345678',
    notes: 'Testing from console',
    paymentMethod: 'pay_later',
    items: [
      {
        productId: 'YOUR_PRODUCT_ID',  // Get from /api/products
        quantity: 1
      }
    ]
  })
})
.then(r => r.json())
.then(data => {
  console.log('Order created:', data);
  console.log('Ticket Number:', data.ticketNumber);
})
.catch(err => console.error('Error:', err));
```

## Expected Timeline

1. **API Routing Fix Deployed** (commit dd3429b)
   - ETA: 2-3 minutes from push
   
2. **Test Health Endpoint**
   - `/api/health` returns 200 OK
   
3. **Test Pay Later Flow**
   - Should work immediately after routing is fixed

## Success Criteria

✅ Pay Later is working when:
- Can place order without M-Pesa
- Order appears in database
- Ticket number is generated (AW-...)
- Success message shows ticket number
- Cart is cleared after order
- No console errors
- No 404 errors

## Troubleshooting Commands

```bash
# Check Vercel deployment status
# Go to: https://vercel.com/dashboard

# Test API health
curl https://www.aritwin.co.ke/api/health

# Test with verbose output
curl -v https://www.aritwin.co.ke/api/orders \
  -H "Content-Type: application/json" \
  -d '{"customerName":"Test",...}'

# Check Convex status
# Go to: https://dashboard.convex.dev/
```

## Why Pay Later Might Not Be Working Right Now

**Most Likely Cause:** The API routing 404 issue

- All `/api/*` endpoints were returning 404
- This includes `/api/orders` (used by Pay Later)
- M-Pesa also affected (uses same API)

**Fix Applied:**
- Corrected Vercel routing configuration
- Added explicit `/api/:path*` rewrite rule
- Single `api/index.js` entry point

**Status:** Fix deployed, waiting for Vercel (~2-3 min)

## After Testing

If Pay Later works:
- ✅ Mark as verified
- Test M-Pesa STK push next
- Update dashboard to confirm orders appear

If Pay Later still fails:
- Check exact error message
- Share browser console output
- Check Network tab response
- Verify Vercel deployment completed

---

**Last Updated:** 2026-08-10 14:35  
**Status:** Waiting for Vercel deployment  
**Next Test:** In 2-3 minutes after deployment completes
