# API Endpoints Verification

## Fixes Applied

### 1. **Route Mounting Issue**
**Problem:** Routes were being mounted twice - once in `routes/index.ts` and again in `index.ts`, causing conflicts.

**Solution:**
- Removed duplicate route mounting from `index.ts`
- All routes now mount through the main router in `routes/index.ts`
- Added tickets route to main router

### 2. **API Client Base URL**
**Problem:** Frontend wasn't configuring the API base URL, causing relative API calls to fail.

**Solution:**
- Added `setBaseUrl` call in `App.tsx` to configure API client
- Uses `VITE_API_URL` environment variable for production
- Falls back to Vite proxy (`/api`) for development

### 3. **Guest Checkout Authentication**
**Problem:** Orders and payments endpoints required authentication, blocking guest checkout.

**Solution:**
- Created `optionalAuth` middleware
- Applied to POST `/api/orders`, `/api/payments/initialize`, `/api/payments/verify`
- Endpoints now support both authenticated and guest users

## API Endpoints

### Health
- `GET /api/health` - Server health check

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user (requires auth)

### Products
- `GET /api/products` - List products (query: `inStock`, `category`)
- `POST /api/products` - Create product (admin only)
- `GET /api/products/:id` - Get product details
- `PATCH /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)

### Orders
- `GET /api/orders` - List orders (customer sees own, admin sees all)
- `POST /api/orders` - Create order (supports guest checkout via optionalAuth)
- `GET /api/orders/:id` - Get order details (requires auth)
- `PATCH /api/orders/:id/status` - Update order status (admin only)
- `POST /api/orders/:id/review` - Create review (requires auth)

### Payments
- `POST /api/payments/initialize` - Initialize M-PESA payment (supports guest via optionalAuth)
- `POST /api/payments/verify` - Verify payment status (supports guest via optionalAuth)
- `POST /api/payments/webhook/lipana` - Lipana webhook for M-PESA callbacks

### Tickets
- `GET /api/tickets/track/:ticketNumber` - Track order by ticket number (public)
- `POST /api/tickets/:ticketNumber/message` - Add message to ticket (public)
- `GET /api/tickets` - List all tickets (admin only)
- `PATCH /api/tickets/:ticketNumber/status` - Update ticket status (admin only)

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics (admin only)

### Uploads
- `POST /api/uploads` - Upload file (returns URL)

## Convex Functions

All Convex functions are properly defined and match the API requirements:

### Users
- `users.get`
- `users.create`
- `users.findByEmail`
- `users.updateApproval`

### Products
- `products.list`
- `products.get`
- `products.create`
- `products.update`
- `products.delete`

### Orders
- `orders.listByCustomer`
- `orders.listAll`
- `orders.get`
- `orders.create` (supports guest orders with customerName/customerEmail)
- `orders.updateStatus`
- `orders.updatePayment`
- `orders.getByPaystackRef`

### Tickets
- `tickets.getByNumber`
- `tickets.addMessage`
- `tickets.list`
- `tickets.updateStatus`

### Reviews
- `reviews.create`
- `reviews.listByProduct`

## Environment Variables

### Backend (.env.local / .env.production)
```env
NODE_ENV=production
PORT=3000
CONVEX_DEPLOY_KEY=your_convex_deploy_key
JWT_SECRET=your_jwt_secret
CONVEX_URL=your_convex_url
ADMIN_PASSWORD=your_admin_password
ADMIN_EMAIL=admin@yourdomain.com

# Lipana M-PESA
LIPANA_PUBLISHABLE_KEY=your_lipana_publishable_key
LIPANA_SECRET_KEY=your_lipana_secret_key
LIPANA_WEBHOOK_SECRET=your_lipana_webhook_secret
LIPANA_WEBHOOK_URL=https://yourdomain.com/api/payments/webhook/lipana
LIPANA_PRODUCTION=true
PAYMENT_PROVIDER=lipana

# CORS
ALLOWED_ORIGINS=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

### Frontend (.env.local)
```env
VITE_API_URL=https://yourdomain.com
```

## Testing Checklist

### Guest Checkout Flow
- [ ] Navigate to /shop without logging in
- [ ] Add products to cart
- [ ] Proceed to checkout
- [ ] Fill in name, email, address, phone
- [ ] Place order - should succeed without 401 error
- [ ] M-PESA STK push should be sent
- [ ] Payment status should poll and update

### Authenticated Checkout Flow
- [ ] Login as customer
- [ ] Add products to cart
- [ ] Details should auto-fill
- [ ] Place order - should succeed
- [ ] M-PESA STK push should be sent
- [ ] Order should appear in user's order history

### Admin Dashboard
- [ ] Login as admin
- [ ] Dashboard stats should load
- [ ] Orders list should show all orders
- [ ] Can update order status
- [ ] Products CRUD operations work
- [ ] Ticket management works

### M-PESA Payment
- [ ] STK push reaches customer phone
- [ ] Enter M-PESA PIN on phone
- [ ] Payment confirmation shows in modal
- [ ] Order payment status updates to "completed"
- [ ] Webhook updates work (check server logs)

### Order Tracking
- [ ] Get ticket number from order confirmation
- [ ] Navigate to /track
- [ ] Enter ticket number
- [ ] Order status displays correctly
- [ ] Can send messages via ticket

## Troubleshooting

### 401 Errors on /api/auth/me
**Cause:** No authentication token present (expected for logged-out users)
**Solution:** This is normal - app should handle gracefully

### 500 Errors on /api/orders
**Cause:** Likely Convex connection issue or missing environment variables
**Check:**
1. `CONVEX_URL` is set correctly
2. `CONVEX_DEPLOY_KEY` is valid
3. Convex dashboard shows schema is deployed
4. Check API server logs for detailed error

### M-PESA STK Not Received
**Check:**
1. `LIPANA_SECRET_KEY` is correct
2. `LIPANA_PRODUCTION=true` for live keys
3. Phone number format is correct (254XXXXXXXXX)
4. Lipana account has sufficient test/live balance

### CORS Errors
**Check:**
1. `ALLOWED_ORIGINS` includes your frontend domain
2. For development, use Vite proxy (already configured)
3. For production, ensure both domains use HTTPS

## Deployment Steps

1. **Deploy Convex Schema**
   ```bash
   cd convex
   npx convex deploy
   ```

2. **Build API Server**
   ```bash
   cd artifacts/api-server
   npm run build
   ```

3. **Build Frontend**
   ```bash
   cd artifacts/ari-water
   npm run build
   ```

4. **Set Environment Variables** on your hosting platform

5. **Deploy** both API and frontend to your hosting service

6. **Test** all endpoints using the checklist above

## API Response Examples

### Successful Order Creation
```json
{
  "id": "k17abc123...",
  "customerId": null,
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "status": "received",
  "totalKes": 250,
  "ticketNumber": "AW-260807-4521",
  "paymentStatus": "pending",
  "createdAt": "2026-08-07T08:30:00.000Z"
}
```

### Successful Payment Initialization
```json
{
  "authorizationUrl": "mpesa://stk-push/ws_CO_123456789",
  "reference": "ws_CO_123456789",
  "message": "Enter your M-PESA PIN to complete payment"
}
```

### Payment Verification - Success
```json
{
  "success": true,
  "status": "success",
  "orderId": "k17abc123...",
  "mpesaReceiptNumber": "QA12BC3DEF",
  "message": "The service request is processed successfully"
}
```
