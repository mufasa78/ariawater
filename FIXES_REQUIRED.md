# 🔧 Critical Fixes Required

**Date:** 2026-08-10  
**Priority:** HIGH

---

## ✅ Issue 1: Orders ARE Being Created (VERIFIED)

**Status:** Working correctly ✅  
**Evidence:** `npx convex run orders:debugOrdersAndTickets` shows 10 orders in database  
**Action:** No fix needed - orders are being saved successfully

---

## ⚠️ Issue 2: Payment Status Shows Incorrect "Paid" Status

**Problem:** Admin dashboard shows payment as "paid" when no payment has been made yet

**Root Cause:** Orders created with `paymentStatus: "pending"` by default, but UI might be misinterpreting

**Current Flow:**
1. Order created → `paymentStatus: "pending"`
2. M-Pesa payment initiated → status should update to "completed" 
3. Pay Later → stays "pending" until manually paid

**Fix Required:**
1. Verify payment status mapping in AdminOrders.tsx
2. Add clear visual distinction between:
   - ✅ Completed (green) - Paid
   - ⏳ Pending (yellow) - Awaiting payment
   - ❌ Failed (red) - Payment failed

**Files to Update:**
- `artifacts/ari-water/src/pages/AdminOrders.tsx` - Fix status display
- Ensure payment status badge shows correct state

---

## 📄 Issue 3: Receipt Should Be PDF, Not Text File

**Problem:** Current receipt system likely generates `.txt` files

**Required:** Professional branded PDF receipts with:
- Company logo and branding
- Invoice/receipt number
- Order details (items, quantities, prices)
- Customer information
- Payment information
- Delivery address
- Total amount
- Terms and conditions (if applicable)

**Implementation Options:**

### Option 1: Server-Side PDF Generation (Recommended)
**Pros:** More secure, consistent formatting, can include server-side data  
**Tech Stack:** `pdfkit` or `pdf-lib` in Node.js  

**Files to Create:**
- `artifacts/api-server/src/lib/pdf-generator.ts` - PDF generation logic
- `artifacts/api-server/src/routes/receipts.ts` - Receipt download endpoint
- Add endpoint: `GET /api/orders/:id/receipt` → Returns PDF

### Option 2: Client-Side PDF Generation
**Pros:** Reduces server load  
**Tech Stack:** `jsPDF` or `react-pdf`  

**Files to Create:**
- `artifacts/ari-water/src/lib/receipt-pdf.ts` - Client-side PDF generation
- Button in Shop.tsx success modal to download receipt

**Recommendation:** Use **Option 1 (Server-Side)** for security and consistency

---

## 💰 Issue 4: M-Pesa STK & Pay Later Must Work Perfectly

### M-Pesa STK Push

**Current Status:** Needs verification

**Required Flow:**
1. Customer selects M-Pesa
2. Order created in DB
3. STK push sent to phone
4. Customer enters PIN
5. Payment webhook received
6. Order payment status updated to "completed"
7. Receipt available for download

**Potential Issues to Check:**
- [ ] Lipana API credentials correct
- [ ] Webhook URL accessible
- [ ] Payment status polling working
- [ ] Timeout handling (currently 3 minutes)
- [ ] Error messages user-friendly

**Files to Verify:**
- `artifacts/ari-water/src/pages/Shop.tsx` - M-Pesa flow
- `convex/http.ts` - Webhook handler
- `convex/payments.ts` - Payment status updates
- `convex/paymentsActions.ts` - Signature verification

### Pay Later

**Current Status:** Needs verification

**Required Flow:**
1. Customer selects Pay Later
2. Order created with `paymentStatus: "pending"`
3. Ticket number generated
4. Success message shown
5. Customer can track order
6. Payment can be completed later from orders page

**Potential Issues:**
- [ ] Success message clear
- [ ] Ticket number displayed prominently
- [ ] Payment link available in orders page
- [ ] Admin can manually mark as paid

**Files to Verify:**
- `artifacts/ari-water/src/pages/Shop.tsx` - Pay Later flow
- Ensure distinct success flow for Pay Later vs M-Pesa

---

## 🔐 Issue 5: Admin Dashboard Authentication

**Problem:** User sees 401 errors

**Root Cause:** User not signed in with Clerk

**Fix Required:**
1. Create admin user in Clerk Dashboard
2. Set `publicMetadata.role = "admin"`
3. Sign in at `/login`

**Not a code issue** - configuration only

---

## 📋 Implementation Plan

### Phase 1: Payment Status Display (30 mins)
1. Review current payment status rendering
2. Fix badge colors and text
3. Add clear labels (Paid/Pending/Failed)
4. Test with existing orders

### Phase 2: PDF Receipt Generation (2 hours)
1. Install `pdfkit` and `@types/pdfkit`
2. Create PDF generator service
3. Add receipt download endpoint
4. Add download button to success modal
5. Test PDF generation with sample order

### Phase 3: M-Pesa & Pay Later Verification (1 hour)
1. Test M-Pesa STK push flow
2. Verify webhook processing
3. Test Pay Later flow
4. Check error handling
5. Verify success messages

### Phase 4: Admin Dashboard Setup (15 mins)
1. Create admin user in Clerk
2. Test login
3. Verify dashboard access

**Total Estimated Time:** 3-4 hours

---

## 🎯 Success Criteria

### Payment Status
- [ ] Pending orders show "⏳ Pending" in yellow
- [ ] Completed payments show "✅ Paid" in green
- [ ] Failed payments show "❌ Failed" in red
- [ ] Payment method displayed (M-Pesa/Pay Later)

### PDF Receipts
- [ ] PDF generated with company branding
- [ ] All order details included
- [ ] Download button in success modal
- [ ] PDF downloads correctly
- [ ] File named: `receipt-{ticketNumber}.pdf`

### M-Pesa STK
- [ ] STK push sent to phone
- [ ] Status polling works
- [ ] Success/failure detected correctly
- [ ] Order updated when payment completes
- [ ] Clear error messages on failure

### Pay Later
- [ ] Order created successfully
- [ ] Success message clear
- [ ] Ticket number prominent
- [ ] Can track order immediately
- [ ] Payment status shows "Pending"

### Admin Dashboard
- [ ] Admin can sign in
- [ ] Dashboard loads without 401s
- [ ] Can view all orders
- [ ] Can update order status
- [ ] Payment status clearly visible

---

## 🚀 Next Steps

1. **Fix payment status display** (quick win)
2. **Implement PDF receipts** (most value)
3. **Verify payment flows** (critical)
4. **Setup admin access** (unblocking)

Ready to implement!

---

**Last Updated:** 2026-08-10  
**Status:** Analysis Complete - Ready for Implementation
