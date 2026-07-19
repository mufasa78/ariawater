---
name: Convex URL trailing slash
description: CONVEX_URL must not end with a trailing slash when used with ConvexHttpClient
---

## Rule

Strip the trailing slash from `CONVEX_URL` / `CONVEX_DEPLOYMENT_URL` before passing it to `new ConvexHttpClient(url)`.

**Why:** `ConvexHttpClient.queryInner` appends `/api/query` directly to `this.address`. If the URL already ends with `/`, the result is `//api/query`, which Convex returns as HTTP 404 with an empty body. The thrown error has an empty message, making it hard to diagnose.

**How to apply:** In `artifacts/api-server/src/lib/convex-client.ts`:
```typescript
export const convex = new ConvexHttpClient(convexUrl.replace(/\/$/, ""));
```

The env vars `CONVEX_URL` and `CONVEX_DEPLOYMENT_URL` in this project have trailing slashes. Any new code that constructs a ConvexHttpClient must strip them.
