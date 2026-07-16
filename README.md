# Ari Water

Ari Water is a responsive e-commerce and service website for bottled water delivery, refill services, and business hydration solutions in Nairobi, Kenya. The app combines a Vite + React frontend with Convex-backed data and a Node/Express API layer.

## Features
- Responsive storefront and checkout-friendly shopping experience
- Customer and admin dashboards
- Convex-backed product, order, and user data
- Cookie consent banner and dedicated privacy/cookie policy pages
- Deployment-ready configuration for Vercel

## Tech stack
- Frontend: React, TypeScript, Vite, Tailwind CSS, Wouter
- UI components: Radix UI primitives and shadcn-style components
- Backend/API: Express + Convex
- Package manager: pnpm

## Local development
1. Install dependencies
   - pnpm install
2. Start the frontend
   - pnpm --filter @workspace/ari-water dev
3. Start the API server
   - Set the required environment variables:
     - JWT_SECRET
     - CONVEX_URL
     - PORT=3000
     - BASE_PATH=/
4. Build the project
   - pnpm build

## Environment variables
Create a local env file for the frontend with values such as:
- PORT=3000
- BASE_PATH=/
- VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX (optional)

The API server also needs:
- JWT_SECRET
- CONVEX_URL
- ALLOWED_ORIGINS=http://localhost:3000

## Vercel deployment
This app is prepared for deployment to Vercel with a Vite frontend. Configure these build settings:
- Build command: pnpm build
- Output directory: artifacts/ari-water/dist/public
- Install command: pnpm install

Set the same environment variables in Vercel as above.

## Project structure
- artifacts/ari-water: frontend app
- artifacts/api-server: Express API server
- convex: Convex functions and schema
- lib: shared TypeScript libraries
