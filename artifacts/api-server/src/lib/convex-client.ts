import { ConvexHttpClient } from "convex/browser";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore – generated after `npx convex deploy`; stub exists in convex/_generated/api.ts
import { api } from "../../../../convex/_generated/api";

const convexUrl = process.env.CONVEX_URL ?? process.env.CONVEX_DEPLOYMENT_URL;

if (!convexUrl) {
  throw new Error("CONVEX_URL or CONVEX_DEPLOYMENT_URL env var is required");
}

// Strip trailing slash — ConvexHttpClient appends /api/query, so a trailing
// slash would produce //api/query (404).
export const convex = new ConvexHttpClient(convexUrl.replace(/\/$/, ""));
export { api };
