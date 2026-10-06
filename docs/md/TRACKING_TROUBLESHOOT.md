# 🔍 Order Tracking Troubleshooting Guide

## Issue: Tracking Returns "Ticket Not Found"

The tracking system is properly configured. If you're seeing 404 errors, follow these steps:

---

## ✅ System Status

**Components:**
- ✅ Tickets Convex table exists with proper indexes
- ✅ `tickets.getTrackInfo` query implemented
- ✅ `GET /api/tickets/:ticketNumber/track` endpoint exists
- ✅ Frontend `Track.tsx` properly calls API
- ✅ Orders create tickets automatically

---

## 🔍 Troubleshooting Steps

### Step 1: Verify Ticket Was Created

When an order is created, a ticket should be automatically generated. Check Convex dashboard:

1. Go to https://grand-dachshund-295.convex.cloud
2. Navigate to **Data** → **tickets** table
3. Look for your ticket number (e.g., `AW-240810-1234`)

**Expected Fields:**
```json
{
  "_id": "k...",
  "orderId": "k...",
  "ticketNumber": "AW-240810-1234",
  "status": "open",
  "messages": [
    {
      "sender": "system",
      "text": "Ticket created for order tracking.",
      "timestamp": 1723334400000
    }
  ],
  "createdAt": 1723334400000,
  "updatedAt": 1723334400000
}
```

---

### Step 2: Verify Order Has Ticket Number

Check the `orders` table:

1. Go to **Data** → **orders** table
2. Find your order
3. Check if `ticketNumber` field exists and matches

**Expected:**
```json
{
  "_id": "k...",
  "ticketNumber": "AW-240810-1234",  // ← Should match ticket
  "status": "received",
  ...
}
```

---

### Step 3: Test API Endpoint Directly

Use curl to test the tracking endpoint:

```bash
curl https://www.aritwin.co.ke/api/tickets/AW-240810-1234/track
```

**Expected Success Response:**
```json
{
  "ticket": {
    "_id": "k...",
    "ticketNumber": "AW-240810-1234",
    "status": "open",
    "messages": [...]
  },
  "order": {
    "id": "k...",
    "status": "received",
    "totalKes": 100,
    "items": [...]
  }
}
```

**Expected Error (404):**
```json
{
  "error": "Ticket not found"
}
```

---

### Step 4: Check Convex Query Directly

Test the Convex function in the dashboard:

1. Go to **Functions** → **tickets** → **getTrackInfo**
2. Run with args: `{ "ticketNumber": "AW-240810-1234" }`
3. Check if it returns data or null

**If Returns Null:**
- Ticket doesn't exist in database
- Check `ticketNumber` spelling/format
- Verify ticket was created during order placement

---

## 🐛 Common Issues

### Issue 1: Ticket Not Created
**Symptom:** Order exists but no ticket in database  
**Cause:** Order creation mutation didn't complete ticket insert  
**Fix:** 
1. Check Convex logs for errors during order creation
2. Verify `orders.create` mutation includes ticket insert code
3. Check transaction didn't roll back

**Code to Verify (in `convex/orders.ts`):**
```typescript
await ctx.db.insert("tickets", {
  orderId,
  ticketNumber,
  status: "open",
  messages: [...],
  createdAt: now,
  updatedAt: now,
});
```

---

### Issue 2: Wrong Ticket Number Format
**Symptom:** User enters ticket but 404  
**Cause:** Case sensitivity or extra spaces  
**Fix:** 
- Ticket numbers are case-sensitive: `AW-240810-1234` ≠ `aw-240810-1234`
- Trim whitespace from input
- Format is always: `AW-YYMMDD-XXXX`

---

### Issue 3: Index Not Built
**Symptom:** All tracking queries return null  
**Cause:** `by_ticketNumber` index not deployed  
**Fix:**
1. Check schema has: `.index("by_ticketNumber", ["ticketNumber"])`
2. Redeploy Convex: `npx convex deploy`
3. Wait for index backfill to complete

---

### Issue 4: Old Orders Missing Tickets
**Symptom:** New orders work, old orders don't  
**Cause:** Ticket creation added after some orders were placed  
**Solution:** Run migration to create tickets for existing orders

**Migration Query to Run in Convex Dashboard:**
```typescript
// In Functions → Run any function:
// Create tickets for orders that don't have them

const ordersWithoutTickets = await ctx.db
  .query("orders")
  .collect();

for (const order of ordersWithoutTickets) {
  // Check if ticket already exists
  const existingTicket = await ctx.db
    .query("tickets")
    .withIndex("by_order", (q) => q.eq("orderId", order._id))
    .first();
  
  if (!existingTicket && order.ticketNumber) {
    // Create missing ticket
    await ctx.db.insert("tickets", {
      orderId: order._id,
      ticketNumber: order.ticketNumber,
      status: "open",
      messages: [{
        sender: "system",
        text: `Ticket created for order tracking. Order status: ${order.status}`,
        timestamp: Date.now()
      }],
      createdAt: order._creationTime,
      updatedAt: Date.now(),
    });
  }
}
```

---

## 🔧 Admin Features for Tracking

### Viewing All Tickets (Admin Dashboard)

Admins can see all tickets in the system. This should be accessible at `/admin/tickets` (if route exists).

**Features Needed:**
- List all tickets with filters (status: open/resolved/closed)
- Search by ticket number or customer
- View ticket details and messages
- Add support messages to tickets
- Update ticket status

---

### Updating Order Status

When admin updates order status, ticket should be updated:

**Current Flow:**
1. Admin updates order status: `orders.updateStatus`
2. ✅ Order status changes
3. ❌ **Missing:** Ticket not automatically updated

**Fix Needed:** Add ticket message when order status changes

**Updated Code for `convex/orders.ts`:**
```typescript
export const updateStatus = mutation({
  args: {
    id: v.id("orders"),
    status: v.union(
      v.literal("received"),
      v.literal("processing"),
      v.literal("dispatched"),
      v.literal("delivered"),
    ),
  },
  handler: async (ctx, { id, status }) => {
    const order = await ctx.db.get(id);
    if (!order) throw new ConvexError("Order not found");
    
    // Update order
    await ctx.db.patch(id, { status, updatedAt: Date.now() });
    
    // Update ticket with status change message
    const ticket = await ctx.db
      .query("tickets")
      .withIndex("by_order", (q) => q.eq("orderId", id))
      .first();
    
    if (ticket) {
      const now = Date.now();
      const statusMessages = {
        received: "Your order has been received and is being prepared.",
        processing: "Your order is now being processed.",
        dispatched: "Your order has been dispatched for delivery.",
        delivered: "Your order has been delivered. Thank you for your business!"
      };
      
      await ctx.db.patch(ticket._id, {
        messages: [
          ...ticket.messages,
          {
            sender: "system",
            text: statusMessages[status] || `Order status updated to ${status}`,
            timestamp: now
          }
        ],
        updatedAt: now,
        ...(status === "delivered" ? { status: "resolved" } : {})
      });
    }
    
    return ctx.db.get(id);
  },
});
```

---

## ✅ Expected Behavior

### When Order Created (Pay Later):
1. Order inserted into `orders` table with `ticketNumber: "AW-240810-1234"`
2. Ticket inserted into `tickets` table with same `ticketNumber`
3. Order items inserted into `orderItems` table
4. Customer receives order confirmation with ticket number

### When Customer Tracks Order:
1. Customer enters ticket number in Track page
2. Frontend calls `GET /api/tickets/AW-240810-1234/track`
3. API queries `tickets.getTrackInfo` from Convex
4. Returns: ticket details + order details + items
5. Frontend displays: order status, items, delivery info, support messages

### When Admin Updates Status:
1. Admin selects new status in AdminOrders
2. Frontend calls `PATCH /api/orders/:id/status`
3. Convex updates order status
4. **[NEEDS FIX]** Convex adds message to ticket
5. Customer sees update when tracking order

---

## 🚀 Quick Fix Deployment

If the issue is that tickets aren't getting status updates:

1. **Update `convex/orders.ts`** - Add ticket message on status change (code above)
2. **Deploy:** `npx convex deploy`
3. **Test:** 
   - Create new order
   - Track order (should work)
   - Admin updates status
   - Refresh tracking page (should show new message)

---

## 📊 Verification Checklist

After fixes, verify:

- [ ] New orders create tickets automatically
- [ ] Ticket numbers match between `orders` and `tickets` tables
- [ ] Tracking page loads order details by ticket number
- [ ] Admin can see all orders and their ticket numbers
- [ ] Admin can update order status
- [ ] Status updates appear in tracking timeline
- [ ] Old orders have tickets (run migration if needed)

---

## 🎯 Production Readiness

**Current Status:**
- ✅ Ticket creation on order placement
- ✅ Tracking endpoint functional
- ✅ Frontend tracking page working
- ❌ **Missing:** Ticket updates when order status changes
- ❌ **Missing:** Admin ticket management page

**Priority Fixes:**
1. **HIGH:** Add ticket message on order status update
2. **MEDIUM:** Create admin tickets management page
3. **LOW:** Add customer support chat to tickets

---

**Last Updated:** 2026-08-10  
**Status:** Tracking functional, needs status sync enhancement
