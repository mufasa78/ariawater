@echo off
echo ================================================
echo Testing Aria Water Locally
echo ================================================
echo.

echo Step 1: Checking environment file...
if not exist ".env.local" (
    echo ERROR: .env.local file not found!
    echo Please create it with your Clerk and Convex credentials.
    pause
    exit /b 1
)
echo ✓ .env.local found
echo.

echo Step 2: Building API server...
call pnpm --filter @workspace/api-server run build
if %errorlevel% neq 0 (
    echo ERROR: API server build failed!
    pause
    exit /b 1
)
echo ✓ API server built successfully
echo.

echo Step 3: Building frontend...
call pnpm --filter @workspace/ari-water run build
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed!
    pause
    exit /b 1
)
echo ✓ Frontend built successfully
echo.

echo ================================================
echo All builds successful!
echo ================================================
echo.
echo To test locally:
echo 1. Open terminal #1 and run: pnpm --filter @workspace/api-server run dev
echo 2. Open terminal #2 and run: pnpm --filter @workspace/ari-water run dev
echo 3. Open browser: http://localhost:5173/shop
echo.
echo To deploy to Vercel:
echo 1. Add all environment variables from .env.local to Vercel
echo 2. Push code: git push
echo 3. Vercel will auto-deploy
echo.
pause
