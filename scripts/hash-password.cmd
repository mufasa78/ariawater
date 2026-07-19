@echo off
cd /d "%~dp0"
pnpm exec tsx src/hash-password.ts %*
