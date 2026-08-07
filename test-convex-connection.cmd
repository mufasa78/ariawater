@echo off
echo ================================================
echo Testing Convex Database Connection
echo ================================================
echo.

echo Checking if .env.local exists...
if not exist ".env.local" (
    echo ERROR: .env.local not found!
    pause
    exit /b 1
)
echo ✓ .env.local found
echo.

echo Starting API server to test Convex connection...
echo (This will start the server and you can test the API)
echo.
echo Press Ctrl+C to stop the server when done testing
echo.
echo Test URLs after server starts:
echo   http://localhost:3000/api/healthz
echo   http://localhost:3000/api/products
echo   http://localhost:3000/api/products?inStock=true
echo.
pause

call pnpm --filter @workspace/api-server run dev
