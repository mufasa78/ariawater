# Lipana M-Pesa Quick Reference

## ✅ Setup Status

Your Lipana M-Pesa integration is **ready to use**:

- ✅ Sandbox credentials configured
- ✅ Lipana client library created
- ✅ Payment routes updated
- ✅ Webhook handler implemented
- ✅ Phone number validation
- ✅ Test script available

## 🚀 Quick Start

### 1. Set Payment Provider

Already configured in `.env.local`:
```env
PAYMENT_PROVIDER=lipana
```

### 2. Start Services

```bash
# Terminal 1: API Server
pnpm --filter @workspace/api-server dev

# Terminal 2: Frontend
pnpm --filter @workspace/ari-water dev
```

### 3. Test Payment Flow

1. Login to application
2. Create an order
3. Click "Pay with M-Pesa"
4. Use test phone: `254712345678`
5. Complete payment

## 📞 Test Phone Numbers (Sandbox)

| Phone | Result | Use For |
|-------|--------|---------|
| `254712345678` | ✅ Success | Testing successful payments |
| `254712345679` | ❌ Failed | Testing insufficient funds |
| `254712345680` | ⏱️ Timeout | Testing timeout handling |
| `254712345681` | 🚫 Cancelled | Testing user cancellation |

## 🔌 API Endpoints

### Initialize Payment
```http
POST /api/payments/initialize
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "orderId": "order_id_here"
}
```

**Response:**
```json
{
  "authorizationUrl": "mpesa://stk-push/CHECKOUT_ID",
  "reference": "CHECKOUT_REQUEST_ID",
  "message": "STK push sent to your phone"
}
```

### Verify Payment
```http
POST /api/payments/verify
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "reference": "CHECKOUT_REQUEST_ID"
}
```

**Response:**
```json
{
  "success": true,
  "status": "success",
  "orderId": "order_id",
  "mpesaReceiptNumber": "PX12345678",
  "message": "Payment completed successfully"
}
```

### Webhook (Lipana → Your Server)
```http
POST /api/payments/webhook/lipana
X-Lipana-Signature: hmac_signature
Content-Type: application/json

{
  "event": "payment.success",
  "checkout_request_id": "ws_CO_123",
  "amount": 1000,
  "phone_number": "254712345678",
  "mpesa_receipt_number": "PX12345678",
  "result_code": "0",
  "account_reference": "ARI-ORDER-123"
}
```

## 💻 Code Examples

### Frontend: Initialize Payment

```typescript
import { useInitializePayment } from '@workspace/api-client-react';

function PaymentButton({ orderId }: { orderId: string }) {
  const initPayment = useInitializePayment();

  const handlePayment = async () => {
    try {
      const result = await initPayment.mutateAsync({
        data: { orderId }
      });

      console.log('Payment initiated:', result.reference);
      console.log('Message:', result.message);
      
      // Poll for payment status
      checkPaymentStatus(result.reference);
    } catch (error) {
      console.error('Payment failed:', error);
    }
  };

  return (
    <button onClick={handlePayment}>
      Pay with M-Pesa
    </button>
  );
}
```

### Frontend: Verify Payment

```typescript
import { useVerifyPayment } from '@workspace/api-client-react';

function verifyPayment(reference: string) {
  const verify = useVerifyPayment();

  const check = async () => {
    const result = await verify.mutateAsync({
      data: { reference }
    });

    if (result.success) {
      alert(`Payment successful! Receipt: ${result.mpesaReceiptNumber}`);
    } else {
      alert('Payment failed. Please try again.');
    }
  };

  check();
}
```

### Backend: Custom Integration

```typescript
import { getLipanaClient, LipanaClient } from '../lib/lipana-client';

async function processPayment(phone: string, amount: number, orderId: string) {
  const lipana = getLipanaClient();

  // Validate phone
  if (!LipanaClient.isValidKenyanPhone(phone)) {
    throw new Error('Invalid Kenyan phone number');
  }

  // Format phone
  const formatted = LipanaClient.formatPhoneNumber(phone);

  // Initialize payment
  const result = await lipana.initiatePayment({
    amount,
    phone_number: formatted,
    account_reference: `ARI-${orderId}`,
    transaction_desc: 'Aria Water Order',
  });

  if (!result.success) {
    throw new Error(result.message);
  }

  return result.data.checkout_request_id;
}
```

## 🧪 Testing

### Run Integration Test
```bash
pnpm --filter scripts run test-lipana
```

This tests:
- ✅ Environment variables
- ✅ Phone number formatting
- ✅ Lipana API connectivity
- ✅ Payment initiation
- ✅ Status checking

### Manual API Test

```bash
# Get JWT token from login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ariwater.co.ke","password":"Admin@123!"}' \
  -c cookies.txt

# Initialize payment
curl -X POST http://localhost:8080/api/payments/initialize \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"orderId":"YOUR_ORDER_ID"}'

# Verify payment
curl -X POST http://localhost:8080/api/payments/verify \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"reference":"CHECKOUT_REQUEST_ID"}'
```

## 🔧 Configuration

### Environment Variables

```env
# Required
LIPANA_SECRET_KEY=lip_sk_test_...           # API secret key
LIPANA_PUBLISHABLE_KEY=lip_pk_test_...      # Public key (for frontend)
LIPANA_WEBHOOK_SECRET=...                   # Webhook verification
LIPANA_WEBHOOK_URL=https://your-domain.com/api/payments/webhook/lipana

# Optional
PAYMENT_PROVIDER=lipana                      # Use Lipana (vs paystack)
NODE_ENV=development                         # Sandbox mode
```

### Switch Payment Provider

```env
# Use M-Pesa
PAYMENT_PROVIDER=lipana

# Use Paystack
PAYMENT_PROVIDER=paystack
```

## 🔍 Debugging

### Check Logs

API server logs all payment operations:

```
[INFO] Lipana: Initializing payment for order=xxx, amount=1000, phone=254712345678
[INFO] Lipana: Payment initiated, checkout_id=ws_CO_123
[INFO] Lipana: Verifying payment, checkout_id=ws_CO_123
[INFO] Lipana: Payment completed, receipt=PX12345678
```

### Common Issues

**Issue: Invalid phone number**
```typescript
// Fix: Use formatter
const formatted = LipanaClient.formatPhoneNumber(userInput);
```

**Issue: Payment timeout**
```typescript
// Check status after 5 minutes
setTimeout(() => {
  verifyPayment(checkoutId);
}, 5 * 60 * 1000);
```

**Issue: Webhook not received**
```bash
# Use ngrok for local testing
ngrok http 8080
# Update LIPANA_WEBHOOK_URL in .env.local
```

## 📊 Payment Flow Diagram

```
User                Frontend            API Server          Lipana          M-Pesa
  |                    |                    |                 |               |
  |-- Place Order ---->|                    |                 |               |
  |                    |-- Initialize ----->|                 |               |
  |                    |                    |-- STK Push ---->|               |
  |                    |                    |                 |-- Prompt ---->|
  |                    |                    |                 |               |
  |<----------------------- STK Push Prompt -------------------------------   |
  |-- Enter PIN ---------------------------------------------------------->   |
  |                    |                    |                 |<-- Process ---|
  |                    |                    |<-- Callback ----|               |
  |                    |<-- Poll Status ----|                 |               |
  |<-- Confirmation ---|                    |                 |               |
```

## 🎯 Key Features

- ✅ **STK Push**: Automatic phone prompt
- ✅ **Real-time Status**: Check payment state
- ✅ **Webhooks**: Automatic updates
- ✅ **Phone Validation**: Format checking
- ✅ **Security**: Signature verification
- ✅ **Sandbox Testing**: Safe testing environment

## 🔒 Security Checklist

- ✅ Secret keys in environment variables
- ✅ Webhook signature verification
- ✅ Phone number validation
- ✅ HTTPS in production
- ✅ JWT authentication on endpoints
- ✅ Order ownership verification

## 📱 Production Deployment

1. **Get Production Keys**
   - Sign up at https://lipana.africa/
   - Complete KYC
   - Get production credentials

2. **Update Environment**
   ```env
   LIPANA_SECRET_KEY=lip_sk_live_...
   NODE_ENV=production
   ```

3. **Configure Webhook**
   - Set in Lipana dashboard
   - Use HTTPS URL
   - Test webhook delivery

4. **Go Live**
   - Test with small amounts
   - Monitor success rate
   - Enable alerts

## 📚 Resources

- **Documentation**: [LIPANA_MPESA_SETUP.md](./LIPANA_MPESA_SETUP.md)
- **Lipana Docs**: https://lipana.africa/docs
- **Support**: support@lipana.africa
- **Dashboard**: https://dashboard.lipana.africa

---

**Status:** ✅ Ready for Testing  
**Environment:** Sandbox  
**Provider:** Lipana M-Pesa  
**Last Updated:** 2026-07-19
