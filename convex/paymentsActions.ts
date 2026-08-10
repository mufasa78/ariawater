"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import crypto from "crypto";

// Internal action to verify Lipana webhook signatures
// Uses Node.js crypto module which requires "use node" directive
export const verifyLipanaSignature = internalAction({
  args: {
    rawBody: v.string(),
    signature: v.string(),
    webhookSecret: v.string(),
  },
  handler: async (_, { rawBody, signature, webhookSecret }) => {
    try {
      // Compute expected signature
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      // Constant-time comparison
      const sigBuffer = Buffer.from(signature);
      const expectedBuffer = Buffer.from(expectedSignature);

      const isValid =
        sigBuffer.length === expectedBuffer.length &&
        crypto.timingSafeEqual(sigBuffer, expectedBuffer);

      return isValid;
    } catch (error) {
      console.error("Error verifying Lipana signature:", error);
      return false;
    }
  },
});
