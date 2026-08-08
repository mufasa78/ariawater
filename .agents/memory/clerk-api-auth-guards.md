---
name: Clerk API auth guards
description: Server-side Clerk authentication behavior for this web app's Express API
---

## Rule

For protected Express API routes in a Clerk web app, use `getAuth(req).userId` and return a JSON 401 when it is absent. Do not wrap API routes with Clerk's browser-oriented `requireAuth()` middleware.

**Why:** The browser-oriented wrapper can redirect unauthenticated API requests to `/`, which makes client data hooks receive the wrong response shape and hides the actual authentication state.

**How to apply:** Keep `clerkMiddleware()` mounted before the API router, then let the app's own middleware load the Clerk user and map metadata into the request. Use bearer-token helpers only for non-browser clients such as Expo.