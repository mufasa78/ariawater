# Magic Link Authentication

## Overview

Aria Water now supports **passwordless authentication** via magic links for customer accounts, while admins continue to use traditional password-based authentication.

### Why Magic Links?

- 🚀 **Better UX** - No password to remember
- 🔒 **More Secure** - No password to steal or phish
- ⚡ **Faster** - One-click authentication
- ✅ **Auto-approval** - No admin approval needed

## Authentication Flow

### For Customers (Magic Link)

```
1. User enters email → /magic-login
2. System generates unique token (15min expiry)
3. User receives email with magic link
4. User clicks link → /auth/verify?token=xxx
5. System verifies token & logs user in
6. Token is consumed (one-time use)
```

### For Admins (Password)

```
1. Admin enters email + password → /login
2. System verifies credentials with bcrypt
3. Admin logged in with JWT cookie
```

## API Endpoints

### Magic Link Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/magic-auth/request` | POST | Request a magic link |
| `/api/magic-auth/verify` | POST | Verify and consume magic link |
| `/api/magic-auth/check/:token` | GET | Check token validity (no consume) |

### Traditional Authentication (Admin only)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Password-based login |
| `/api/auth/register` | POST | Register with password |
| `/api/auth/logout` | POST | Clear auth cookie |
| `/api/auth/me` | GET | Get current user |

## Frontend Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/magic-login` | `MagicLinkLogin` | Request magic link |
| `/auth/verify` | `MagicLinkVerify` | Verify magic link token |
| `/login` | `Login` | Password login (admin) |

## Usage Examples

### 1. Request Magic Link

**Request:**
```bash
curl -X POST http://localhost:3000/api/magic-auth/request \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "name": "John Doe",
    "phone": "+254700000000"
  }'
```

**Response (Development):**
```json
{
  "success": true,
  "message": "Magic link sent to your email",
  "magicLink": "http://localhost:5173/auth/verify?token=abc123...",
  "token": "abc123...",
  "expiresAt": 1234567890000
}
```

**Response (Production):**
```json
{
  "success": true,
  "message": "Magic link sent to your email"
}
```

### 2. Verify Magic Link

**Request:**
```bash
curl -X POST http://localhost:3000/api/magic-auth/verify \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"token": "abc123..."}'
```

**Response (Success):**
```json
{
  "success": true,
  "user": {
    "id": "xyz789",
    "name": "John Doe",
    "email": "customer@example.com",
    "phone": "+254700000000",
    "role": "customer"
  }
}
```

**Response (Expired):**
```http
HTTP/1.1 410 Gone
{
  "error": "Magic link has expired"
}
```

### 3. Check Token Validity

**Request:**
```bash
curl http://localhost:3000/api/magic-auth/check/abc123...
```

**Response:**
```json
{
  "valid": true,
  "email": "customer@example.com"
}
```

## Database Schema

### magicLinkTokens Table

```typescript
{
  email: string;           // User's email
  token: string;           // Random 32-char token
  expiresAt: number;       // Unix timestamp (15min from creation)
  used: boolean;           // One-time use flag
  _creationTime: number;   // Auto-generated
}
```

**Indexes:**
- `by_token` - Fast token lookup
- `by_email` - Check user's pending tokens
- `by_expiresAt` - Cleanup expired tokens

## Security Features

### Token Generation
- ✅ Cryptographically random 32-character tokens
- ✅ 15-minute expiration window
- ✅ One-time use (consumed after verification)

### Email Validation
- ✅ Regex validation on request
- ✅ Case-insensitive email matching

### Auto-Approval
- ✅ Magic link users are auto-approved
- ✅ No admin intervention needed
- ✅ Instant account activation

### JWT Tokens
- ✅ 7-day expiration
- ✅ httpOnly secure cookies
- ✅ Includes: userId, role, name, email, approved status

## Email Integration

### Development Mode

In development, magic links are returned in the API response for easy testing:

```json
{
  "magicLink": "http://localhost:5173/auth/verify?token=...",
  "token": "..."
}
```

### Production Setup

You need to integrate an email service to send magic links. Recommended options:

#### Option 1: SendGrid

```typescript
// Add to .env
SENDGRID_API_KEY=your_key_here
FROM_EMAIL=noreply@ariwater.co.ke

// In magic-auth.ts
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

async function sendMagicLinkEmail(email: string, magicLink: string) {
  await sgMail.send({
    to: email,
    from: process.env.FROM_EMAIL!,
    subject: 'Sign in to Aria Water',
    html: `
      <h2>Welcome to Aria Water!</h2>
      <p>Click the link below to sign in:</p>
      <a href="${magicLink}">Sign in to Aria Water</a>
      <p>This link expires in 15 minutes.</p>
    `,
  });
}
```

#### Option 2: AWS SES

```typescript
// Add to .env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
FROM_EMAIL=noreply@ariwater.co.ke

// In magic-auth.ts
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const sesClient = new SESClient({ region: process.env.AWS_REGION });

async function sendMagicLinkEmail(email: string, magicLink: string) {
  await sesClient.send(new SendEmailCommand({
    Source: process.env.FROM_EMAIL!,
    Destination: { ToAddresses: [email] },
    Message: {
      Subject: { Data: 'Sign in to Aria Water' },
      Body: {
        Html: {
          Data: `
            <h2>Welcome to Aria Water!</h2>
            <p>Click the link below to sign in:</p>
            <a href="${magicLink}">Sign in to Aria Water</a>
            <p>This link expires in 15 minutes.</p>
          `
        }
      }
    }
  }));
}
```

#### Option 3: Resend

```typescript
// Add to .env
RESEND_API_KEY=your_key
FROM_EMAIL=noreply@ariwater.co.ke

// In magic-auth.ts
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendMagicLinkEmail(email: string, magicLink: string) {
  await resend.emails.send({
    from: process.env.FROM_EMAIL!,
    to: email,
    subject: 'Sign in to Aria Water',
    html: `
      <h2>Welcome to Aria Water!</h2>
      <p>Click the link below to sign in:</p>
      <a href="${magicLink}">Sign in to Aria Water</a>
      <p>This link expires in 15 minutes.</p>
    `,
  });
}
```

## Frontend Implementation

### 1. Magic Link Login Page

```typescript
// artifacts/ari-water/src/pages/MagicLinkLogin.tsx
import { MagicLinkLogin } from '@/pages/MagicLinkLogin';

// Shows email input form
// Sends magic link request
// Displays success message
```

### 2. Verification Page

```typescript
// artifacts/ari-water/src/pages/MagicLinkVerify.tsx
import { MagicLinkVerify } from '@/pages/MagicLinkVerify';

// Extracts token from URL
// Verifies token with API
// Logs user in
// Redirects to dashboard
```

### 3. Router Updates

Add routes to your router:

```typescript
import { MagicLinkLogin } from '@/pages/MagicLinkLogin';
import { MagicLinkVerify } from '@/pages/MagicLinkVerify';

<Route path="/magic-login" component={MagicLinkLogin} />
<Route path="/auth/verify" component={MagicLinkVerify} />
```

## Maintenance Tasks

### Cleanup Expired Tokens

Run periodically (e.g., via cron job):

```typescript
// Call this endpoint or mutation periodically
await convex.mutation(api.magicLinks.cleanupExpiredTokens, {});
```

**Recommended:** Set up a scheduled Convex function:

```typescript
// convex/crons.ts
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "cleanup expired magic links",
  { hours: 1 }, // Run every hour
  internal.magicLinks.cleanupExpiredTokens
);

export default crons;
```

## Migration Guide

### For Existing Users

Existing users can use either method:
1. **Password login** - if they have a password set
2. **Magic link** - request a magic link with their email

### Approve Pending Users

If you have users waiting for approval, run:

```bash
pnpm --filter scripts exec tsx src/approve-all-users.ts
```

This will approve all pending customer accounts.

## Environment Variables

Add to `.env.local` and Vercel:

```env
# Required
JWT_SECRET=your_secret_here
CONVEX_URL=https://your-deployment.convex.cloud/
FRONTEND_URL=https://ariawater.vercel.app

# Optional (Email service)
SENDGRID_API_KEY=your_key
FROM_EMAIL=noreply@ariwater.co.ke

# Or AWS SES
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret

# Or Resend
RESEND_API_KEY=your_key
```

## Testing

### Local Testing

1. Start API server:
```bash
pnpm --filter @workspace/api-server dev
```

2. Start frontend:
```bash
pnpm --filter @workspace/ari-water dev
```

3. Visit http://localhost:5173/magic-login

4. Enter your email

5. Copy the magic link from the response (shown in dev mode)

6. Open the magic link in your browser

7. You should be logged in!

### Production Testing

1. Deploy to Vercel with environment variables set

2. Visit https://ariawater.vercel.app/magic-login

3. Enter your email

4. Check your email inbox for the magic link

5. Click the link to sign in

## Troubleshooting

### "Magic link has expired"
- Links expire after 15 minutes
- Request a new one

### "Magic link has already been used"
- Each link can only be used once
- Request a new one

### "Invalid magic link"
- Token doesn't exist in database
- May have been deleted
- Request a new one

### Email not received
- Check spam folder
- Verify email service configuration
- Check API logs for errors
- Verify `FROM_EMAIL` is authorized sender

### Token not generated
- Check Convex connection
- Verify `CONVEX_URL` is set
- Check API server logs

## Best Practices

1. **Always use HTTPS in production** - Magic links contain sensitive tokens
2. **Set up email service** - Don't rely on console logs
3. **Monitor failed attempts** - Track suspicious activity
4. **Rate limit requests** - Prevent abuse (e.g., max 3 per email per hour)
5. **Log magic link usage** - Audit trail for security
6. **Clean up expired tokens** - Run cleanup job regularly
7. **Use descriptive email subject** - Clear what the email is for
8. **Brand your emails** - Include logo and company info
9. **Test thoroughly** - Verify all error cases
10. **Monitor deliverability** - Track bounce rates

## Future Enhancements

- [ ] Rate limiting on magic link requests
- [ ] Email verification for password registrations
- [ ] SMS-based magic links
- [ ] Two-factor authentication for admin
- [ ] Social login (Google, Facebook)
- [ ] Remember device functionality
- [ ] Magic link analytics dashboard

## Support

For issues or questions:
1. Check this documentation
2. Review API logs
3. Check Convex dashboard
4. Test with curl commands above
5. Verify environment variables are set correctly
