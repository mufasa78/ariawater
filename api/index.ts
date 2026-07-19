import type { VercelRequest, VercelResponse } from "@vercel/node";
import app from "../artifacts/api-server/src/app";

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Express app handles the request
  app.handle(req, res);
}

