import crypto from "node:crypto";

function readBody(req) {
  if (req.body && typeof req.body === "object") return JSON.stringify(req.body);
  if (typeof req.body === "string") return req.body;
  return "";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secret = process.env.LIPANA_WEBHOOK_SECRET;
  const signature = req.headers["x-lipana-signature"];
  if (!secret || typeof signature !== "string") {
    return res.status(401).json({ error: "Invalid webhook signature" });
  }

  const payload = readBody(req);
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  const received = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  if (received.length !== expectedBuffer.length || !crypto.timingSafeEqual(received, expectedBuffer)) {
    return res.status(401).json({ error: "Invalid webhook signature" });
  }

  const { default: app } = await import("../../../artifacts/api-server/dist/serverless.mjs");
  return app(req, res);
}
