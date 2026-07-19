@echo off
cd /d "%~dp0"
set CONVEX_URL=https://grand-dachshund-295.convex.cloud/
set ADMIN_EMAIL=admin@ariwater.co.ke
set ADMIN_PASSWORD=Admin@123!
pnpm exec tsx src/setup-admin.ts
