@echo off
echo ================================
echo TypeScript Configuration Validator
echo ================================
echo.

echo [1/3] Testing convex/tsconfig.json...
cd convex
npx tsc --noEmit --skipLibCheck >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ convex: No errors
) else (
    echo ❌ convex: Has errors
    npx tsc --noEmit --skipLibCheck
)
cd ..
echo.

echo [2/3] Testing ari-water/tsconfig.json...
cd artifacts\ari-water  
npx tsc --noEmit --skipLibCheck >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ ari-water: No errors
) else (
    echo ❌ ari-water: Has errors
    npx tsc --noEmit --skipLibCheck
)
cd ..\..
echo.

echo [3/3] Testing api-server/tsconfig.json...
cd artifacts\api-server
npx tsc --noEmit --skipLibCheck >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ api-server: No errors
) else (
    echo ❌ api-server: Has errors
    npx tsc --noEmit --skipLibCheck
)
cd ..\..
echo.

echo ================================
echo Validation Complete
echo ================================
echo.
echo 💡 If VS Code still shows errors:
echo    1. Press Ctrl+Shift+P
echo    2. Type: "TypeScript: Restart TS Server"
echo    3. Press Enter
echo.
pause
