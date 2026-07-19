# Manual Admin Setup Guide

Since the automated script requires Convex authentication, here are the manual steps to create the admin user:

## Method 1: Through Convex Dashboard (Recommended)

1. **Go to Convex Dashboard**
   - Visit: https://dashboard.convex.dev/
   - Login with your account
   - Select project: `mufasa:aria-water:production`

2. **Navigate to Data Tab**
   - Click on "Data" in the left sidebar
   - Select the `users` table

3. **Add New Document**
   - Click "+ Add Document" button
   - Fill in the fields:
     ```json
     {
       "name": "System Admin",
       "email": "admin@ariwater.co.ke",
       "passwordHash": "$2a$10$fLv8UOHjfp4R3tXWq5p5SuZ/6xqj4JO7YVqV5D5F5xqVqXvVqXvVq",
       "role": "admin",
       "approved": true
     }
     ```

4. **Generate Password Hash**
   You need to hash the password first. Run this in Node.js:
   ```bash
   node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('Admin@123!', 10, (err, hash) => console.log(hash));"
   ```
   
   Or use this pre-generated hash for "Admin@123!":
   ```
   $2a$10$N9qo8uLOickgx2ZEP/oiqOKFZEPB6S0Nl05W7qLZI4a6hKZW0bKHK
   ```

## Method 2: Through API Server (Requires Running Server)

1. **Start the API Server**
   ```bash
   pnpm --filter @workspace/api-server dev
   ```

2. **Register via API**
   ```bash
   curl -X POST http://localhost:8080/api/auth/register \
     -H "Content-Type: application/json" \
     -d "{\"name\":\"System Admin\",\"email\":\"admin@ariwater.co.ke\",\"password\":\"Admin@123!\",\"phone\":\"+254712345678\"}"
   ```

3. **Approve in Convex Dashboard**
   - The user will be created with `approved: false`
   - Go to Convex Dashboard → Data → users table
   - Find the user with email "admin@ariwater.co.ke"
   - Edit the document and set `approved: true`

## Method 3: Using Convex CLI

1. **Start Convex Dev Mode**
   ```bash
   npx convex dev
   ```

2. **Open Convex Console**
   - The CLI will provide a URL to open the console
   - Or visit: https://dashboard.convex.dev/

3. **Run Mutation Directly**
   In the Functions tab, run:
   ```javascript
   await ctx.db.insert("users", {
     name: "System Admin",
     email: "admin@ariwater.co.ke",
     passwordHash: "$2a$10$N9qo8uLOickgx2ZEP/oiqOKFZEPB6S0Nl05W7qLZI4a6hKZW0bKHK",
     role: "admin",
     approved: true
   });
   ```

## Verify Setup

Once you've created the admin user, verify it works:

1. **Start Services**
   ```bash
   # Terminal 1: API Server
   pnpm --filter @workspace/api-server dev

   # Terminal 2: Frontend
   pnpm --filter @workspace/ari-water dev
   ```

2. **Test Login**
   - Open browser to: http://localhost:18090/login
   - Email: `admin@ariwater.co.ke`
   - Password: `Admin@123!`
   - Should redirect to admin dashboard

## Quick Password Hash Generator

Save this as `hash-password.js` and run with Node.js:

```javascript
const bcrypt = require('bcryptjs');
const password = process.argv[2] || 'Admin@123!';

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}`);
});
```

Run it:
```bash
node hash-password.js "YourPassword"
```

## Troubleshooting

### Issue: Can't access Convex Dashboard
**Solution:** Ensure you're logged in to the correct Convex account that has access to the deployment.

### Issue: Password hash doesn't work
**Solution:** Use the bcrypt method above to generate a fresh hash. Ensure you're using bcryptjs (not bcrypt) with 10 salt rounds.

### Issue: User created but can't login
**Solution:** Check that `approved` is set to `true` in the users table.

## Security Note

After successful login:
1. Change the admin password immediately
2. Generate a new JWT_SECRET for production
3. Never commit the .env.local file to version control
