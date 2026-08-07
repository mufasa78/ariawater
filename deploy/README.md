# Aria Water - cPanel Deployment Guide

## Deployment Structure

```
deploy/
├── public/          # Frontend static files (upload to public_html)
│   ├── index.html
│   ├── assets/
│   ├── .htaccess
│   └── ...
└── api/             # API server (upload to subdirectory or separate Node.js app)
    ├── serverless.mjs
    ├── package.json
    ├── .env.production
    └── ...
```

## cPanel Deployment Steps

### 1. Deploy Frontend (Static Files)

1. Upload all files from `deploy/public/` to your cPanel public directory:
   - Typically: `/home/username/public_html/`
   - Or your domain's document root

2. The `.htaccess` file is already included for:
   - SPA routing (React Router)
   - Proper MIME types
   - Asset caching
   - Gzip compression

### 2. Deploy API Server (Node.js Application)

**Option A: Using cPanel Application Manager**

1. In cPanel, go to "Setup Node.js App"
2. Create a new application:
   - **Application Name**: `ari-water-api`
   - **Application Mode**: `Production`
   - **Application Root**: `/ari-water-api` (or your preferred subdirectory)
   - **Application URL**: `arih2o.co.kr/api` (or leave blank if not serving from URL)
   - **Application Startup File**: `serverless.mjs`
   - **Node.js Version**: `18` or higher

3. Upload files from `deploy/api/` to the application root directory

4. Add environment variables in the Application Manager:
   - `NODE_ENV`: `production`
   - `PORT`: `3000`
   - `CONVEX_DEPLOY_KEY`: `your_convex_deploy_key`
   - `JWT_SECRET`: `your_jwt_secret_key_here`
   - `CONVEX_DEPLOYMENT_URL`: `your_convex_deployment_url`
   - `CONVEX_URL`: `your_convex_url`
   - `ADMIN_PASSWORD`: `your_admin_password`
   - `ADMIN_EMAIL`: `admin@yourdomain.com`
   - `LIPANA_PUBLISHABLE_KEY`: `your_lipana_publishable_key`
   - `LIPANA_SECRET_KEY`: `your_lipana_secret_key`
   - `LIPANA_WEBHOOK_SECRET`: `your_lipana_webhook_secret`
   - `LIPANA_WEBHOOK_URL`: `https://yourdomain.com/api/payments/webhook/lipana`
   - `PAYMENT_PROVIDER`: `lipana`
   - `ALLOWED_ORIGINS`: `https://yourdomain.com`
   - `FRONTEND_URL`: `https://yourdomain.com`

5. Click "Restart" to start the application

**Option B: Using Subdirectory with Proxy**

If you want the API accessible via `/api` path:

1. Upload API files to a subdirectory like `/home/username/ari-water-api`
2. Set up the Node.js application as above
3. Add this to your public `.htaccess` to proxy API requests:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^api/(.*)$ http://localhost:3000/$1 [P,L]
</IfModule>
```

### 3. Update Frontend API URL

The frontend is configured to use relative paths. If your API is on a different port or domain, you may need to:

1. Update `VITE_API_URL` in your environment variables
2. Or configure a reverse proxy in cPanel

### 4. Webhook Configuration

For Lipana webhooks to work:
- Ensure `LIPANA_WEBHOOK_URL` is set to: `https://arih2o.co.kr/api/webhooks/lipana`
- The webhook endpoint must be publicly accessible
- Configure this URL in your Lipana dashboard

## Important Notes

- **Security**: Keep your `.env.production` file secure and never commit it to git
- **SSL**: Ensure your domain has SSL enabled for secure connections
- **CORS**: The `ALLOWED_ORIGINS` is set to your domain for security
- **Backups**: Always backup before deploying to production
- **Testing**: Test thoroughly in a staging environment first

## Troubleshooting

- **404 errors**: Check `.htaccess` is uploaded and permissions are correct (644)
- **API not responding**: Check Node.js application is running in cPanel
- **Environment variables**: Verify all variables are set correctly in Application Manager
- **Webhook failures**: Ensure the webhook URL is publicly accessible and SSL is valid
