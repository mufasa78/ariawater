import type { VercelRequest, VercelResponse } from "@vercel/node";

// Dynamic import to avoid TypeScript checking the Express app type
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { default: app } = await import("../artifacts/api-server/src/app.js");
  return app(req, res);
}

