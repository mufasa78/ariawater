import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import crypto from "crypto";

const http = httpRouter();

http.route({
  path: "/lipana/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const rawBody = await request.text();
      const signature = request.headers.get("x-lipana-signature");

      console.log("Received Lipana Webhook", {
        hasSignature: !!signature,
        bodyPreview: rawBody.slice(0, 200),
      });

      const webhookSecret = process.env.LIPANA_WEBHOOK_SECRET;
      if (!webhookSecret) {
        console.error("LIPANA_WEBHOOK_SECRET is not configured in Convex environment variables");
        return new Response(JSON.stringify({ error: "Configuration error" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (!signature) {
        console.error("Missing Lipana signature header");
        return new Response(JSON.stringify({ error: "Missing signature" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Verify signature
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      const sigBuffer = Buffer.from(signature);
      const expectedBuffer = Buffer.from(expectedSignature);

      const isSignatureValid =
        sigBuffer.length === expectedBuffer.length &&
        crypto.timingSafeEqual(sigBuffer, expectedBuffer);

      if (!isSignatureValid) {
        console.error("Invalid Lipana webhook signature", {
          received: signature,
          expected: expectedSignature,
        });
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Parse payload
      const payload = JSON.parse(rawBody);
      const event = payload.event; // e.g. "payment.success" or "payment.failed"
      const checkoutRequestId = payload.checkout_request_id;
      const mpesaReceiptNumber = payload.mpesa_receipt_number;
      const resultCode = payload.result_code;
      const resultDesc = payload.result_desc;

      console.log(`Processing Webhook Event: ${event} for checkout: ${checkoutRequestId}`);

      if (event === "payment.success") {
        await ctx.runMutation(internal.payments.markPaymentSuccessful, {
          providerTransactionId: checkoutRequestId,
          providerReference: mpesaReceiptNumber,
          completedAt: Date.now(),
        });
      } else if (event === "payment.failed") {
        await ctx.runMutation(internal.payments.markPaymentFailed, {
          providerTransactionId: checkoutRequestId,
          failureReason: resultDesc || `Result code: ${resultCode}`,
          completedAt: Date.now(),
        });
      } else {
        console.log(`Unhandled webhook event: ${event}`);
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Error processing Lipana webhook in HTTP Action", err);
      return new Response(JSON.stringify({ error: "Internal processing error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

export default http;
