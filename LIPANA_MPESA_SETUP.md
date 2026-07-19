# Lipana M-Pesa Integration Guide

## Overview

Aria Water now supports M-Pesa payments via Lipana's payment gateway. This integration allows customers to pay for water orders using M-Pesa STK Push (SIM Toolkit).

## ✅ Configuration Status

Your Lipana sandbox credentials are already configured in `.env.local`:

```env
# Lipana Dev (M-Pesa Sandbox)
LIPANA_PUBLISHABLE_KEY=lip_pk_test_fa7e40c262551d4723cabebb314ffcaf0b9784d9f72bdce6068bbc6b6bd220ff
LIPANA_SECRET_KEY=lip_sk_test_180d64eb5eb54d3e2262f6ee990b7108b4dd1d87ab3a0d9bb601eaba7d055db0
LIPANA_WEBHOOK_SECRET=b5fb48af0cfcd23212ef271e4c8669903063aa28cee0cb56990959bb9414de1c
LIPANA_WEBHOOK_URL=https://ariawater.vercel.app/webhooks/lipana

# Payment Configuration
PAYMENT_PROVIDER=lipana
```

## 🏗️ Integration Components

### 1. Lipana Client (`lib/lipana-client.ts`)

A TypeScript client for interacting with Lipana's API:

**Features:**
- ✅ STK Push payment initiation
- ✅ Payment status checking
- ✅ Webhook signature verification
- ✅ Phone number validation and formatting
- ✅ Kenyan phone number support (254XXXXXXXXX)

**Key Methods:**
```typescript
// Initialize M-Pesa payment
lipana.initiatePayment({
  amount: 1000,
  phone_number: "254712345678",
  account_reference: "ARI-ORDER-123",
  transaction_desc: "Aria Water Order",
  callback_url: "https://your-domain.com/webhooks/lipana"
});

// Check payment status
lipana.checkPaymentStatus(checkoutRequestId);

// Verify webhook signature
lipana.verifyWebhookSignature(payload, signature, webhookSecret);

// Format phone number
LipanaClient.formatPhoneNumber("0712345678"); // Returns: 254712345678

// Validate Kenyan phone
LipanaClient.isValidKenyanPhone("0712345678"); // Returns: true
```

### 2. Payment Routes (`routes/payments.ts`)

Updated to support both Lipana and Paystack:

**Endpoints:**
- `POST /api/payments/initialize` - Initialize payment
- `POST /api/payments/verify` - Verify payment status
- `POST /api/payments/webhook/lipana` - Lipana webhook handler

**Payment Provider Selection:**
Set via `PAYMENT_PROVIDER` environment variable:
- `lipana` - Use M-Pesa via Lipana
- `paystack` - Use Paystack (cards)

## 🔧 How It Works

### Payment Flow

1. **Customer Places Order**
   - Order created in Convex database
   - Order includes phone number for M-Pesa

2. **Payment Initialization**
   ```
   POST /api/payments/initialize
   Body: { orderId: "xxx" }
   ```
   - Validates order exists
   - Formats phone number to Lipana format (254XXXXXXXXX)
   - Sends STK Push request to Lipana
   - Customer receives M-Pesa prompt on their phone
   - Returns checkout_request_id as reference

3. **Customer Enters PIN**
   - Customer receives STK Push prompt
   - Enters M-Pesa PIN on phone
   - M-Pesa processes payment

4. **Payment Verification**
   ```
   POST /api/payments/verify
   Body: { reference: "checkout_request_id" }
   ```
   - Checks payment status via Lipana API
   - Updates order payment status
   - Returns success/failure status

5. **Webhook Callback (Optional)**
   ```
   POST /api/payments/webhook/lipana
   ```
   - Lipana sends payment result
   - Verifies webhook signature
   - Auto-updates order status

## 📱 Phone Number Format

Lipana requires Kenyan phone numbers in format: `254XXXXXXXXX`

The system automatically converts:
- `0712345678` → `254712345678`
- `+254712345678` → `254712345678`
- `712345678` → `254712345678`

**Valid Prefixes:**
- `2547XX` - Safaricom, Airtel
- `2541XX` - Telkom

## 🧪 Testing with Sandbox

### Sandbox Credentials
Already configured in `.env.local` for testing.

### Test Phone Numbers

Lipana sandbox accepts specific test numbers:

| Phone Number | Result | Description |
|--------------|--------|-------------|
| `254712345678` | Success | Payment succeeds immediately |
| `254712345679` | Failed | Payment fails (insufficient funds) |
| `254712345680` | Timeout | Payment times out |
| `254712345681` | Cancelled | User cancels payment |

### Test Payment Flow

```bash
# 1. Start API server
pnpm --filter @workspace/api-server dev

# 2. Start frontend
pnpm --filter @workspace/ari-water dev

# 3. Login and create order

# 4. Test payment with test number
curl -X POST http://localhost:8080/api/payments/initialize \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_JWT_TOKEN" \
  -d '{"orderId":"YOUR_ORDER_ID"}'

# 5. Verify payment
curl -X POST http://localhost:8080/api/payments/verify \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_JWT_TOKEN" \
  -d '{"reference":"CHECKOUT_REQUEST_ID"}'
```

## 🔒 Security Features

### Webhook Signature Verification

All webhooks are verified using HMAC SHA256:

```typescript
const crypto = require("crypto");
const signature = crypto
  .createHmac("sha256", webhookSecret)
  .update(payload)
  .digest("hex");
```

The webhook handler:
1. Receives webhook with `x-lipana-signature` header
2. Computes expected signature
3. Compares using timing-safe comparison
4. Rejects invalid signatures

### Phone Number Validation

- Validates Kenyan phone format
- Prevents invalid numbers
- Standardizes format before API calls

## 🚀 Production Deployment

### 1. Get Production Credentials

1. Go to: https://lipana.africa/
2. Sign up for production account
3. Complete KYC verification
4. Get production API keys

### 2. Update Environment Variables

```env
# Production
LIPANA_SECRET_KEY=lip_sk_live_XXXXXX
LIPANA_PUBLISHABLE_KEY=lip_pk_live_XXXXXX
LIPANA_WEBHOOK_SECRET=your_webhook_secret
LIPANA_WEBHOOK_URL=https://ariawater.co.ke/api/payments/webhook/lipana
NODE_ENV=production
PAYMENT_PROVIDER=lipana
```

### 3. Configure Webhook URL

In Lipana dashboard:
1. Navigate to Settings → Webhooks
2. Set webhook URL: `https://ariawater.co.ke/api/payments/webhook/lipana`
3. Copy webhook secret to `.env` file

### 4. Test Production

Before going live:
- Test with small amounts
- Verify webhook delivery
- Check payment confirmation flow
- Test refund process (if needed)

## 📊 Payment States

| State | Description | User Action |
|-------|-------------|-------------|
| `pending` | Payment initiated, waiting for user | Complete M-Pesa prompt |
| `completed` | Payment successful | None |
| `failed` | Payment failed or cancelled | Retry payment |

## 🛠️ Troubleshooting

### Issue: "Invalid Kenyan phone number format"

**Cause:** Phone number doesn't match Kenyan format  
**Solution:** Ensure phone is 254XXXXXXXXX format

```typescript
// Fix in order creation
LipanaClient.formatPhoneNumber(userInput);
```

### Issue: "LIPANA_SECRET_KEY environment variable is not set"

**Cause:** Missing environment variable  
**Solution:** Add to `.env.local`:
```env
LIPANA_SECRET_KEY=lip_sk_test_...
```

### Issue: Webhook not received

**Possible Causes:**
1. Invalid webhook URL
2. Firewall blocking Lipana IPs
3. HTTPS certificate issues

**Solutions:**
- Use ngrok for local testing: `ngrok http 8080`
- Update webhook URL in Lipana dashboard
- Check server logs for incoming requests

### Issue: Payment stuck in "pending"

**Cause:** User cancelled or timeout  
**Solution:** Implement payment timeout (5 minutes):

```typescript
// Check status after timeout
setTimeout(async () => {
  const status = await lipana.checkPaymentStatus(checkoutRequestId);
  if (status.data?.result_code !== "0") {
    // Update order to failed
  }
}, 5 * 60 * 1000); // 5 minutes
```

## 📈 Monitoring & Logs

### Log Payment Events

The API server logs all payment operations:

```
[INFO] Payment initiated: checkoutRequestId=xxx, amount=1000, phone=254712345678
[INFO] Payment verified: checkoutRequestId=xxx, status=success
[INFO] Webhook received: event=payment.success, checkoutRequestId=xxx
```

### Metrics to Track

- Payment success rate
- Average payment time
- Failed payment reasons
- Webhook delivery rate

## 🔄 Migration from Paystack

To switch between providers:

```env
# Use M-Pesa
PAYMENT_PROVIDER=lipana

# Use Cards  
PAYMENT_PROVIDER=paystack
```

Both can coexist - the system checks the provider variable at runtime.

## 📚 API Reference

### Lipana API Documentation
https://lipana.africa/docs

### Key Endpoints

**Sandbox:**
- Base URL: `https://sandbox.lipana.africa/v1`
- STK Push: `POST /payments/stk-push`
- Status: `GET /payments/status/:checkoutRequestId`

**Production:**
- Base URL: `https://api.lipana.africa/v1`

## 💡 Best Practices

1. **Always validate phone numbers** before API calls
2. **Handle timeouts gracefully** (5-minute default)
3. **Log all payment operations** for debugging
4. **Verify webhook signatures** on production
5. **Test with sandbox** before production
6. **Monitor payment success rates** via dashboard
7. **Implement retry logic** for failed payments
8. **Display clear error messages** to users

## 🎯 Next Steps

1. ✅ Credentials configured
2. ✅ Integration code complete
3. ✅ Webhook handler ready
4. [ ] Test with sandbox phone numbers
5. [ ] Integrate payment UI in frontend
6. [ ] Test full payment flow
7. [ ] Apply for production credentials
8. [ ] Deploy to production

---

**Status:** ✅ Sandbox Ready  
**Environment:** Development  
**Payment Provider:** Lipana M-Pesa  
**Last Updated:** 2026-07-19
