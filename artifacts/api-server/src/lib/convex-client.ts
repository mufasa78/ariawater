import { ConvexHttpClient } from "convex/browser";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore – generated after `npx convex deploy`; stub exists in convex/_generated/api.ts
import { api } from "../../../../convex/_generated/api";

if (!process.env.CONVEX_URL) {
  throw new Error("CONVEX_URL env var is required");
}

// Create a fresh client per import — tokens never cached
export const convex = new ConvexHttpClient(process.env.CONVEX_URL);
export { api };
