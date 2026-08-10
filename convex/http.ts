import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/lipana/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const rawBody = await request.text();
      const signature = request.headers.get("x-lipana-signature");

      // Verify signature using internal action
      const isValid = await ctx.runAction(internal.paymentsActions.verifyLipanaSignature, {
        rawBody,
        signature: signature || "",
        webhookSecret: process.env.LIPANA_WEBHOOK_SECRET || "",
      });

      if (!isValid) {
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Parse payload
      const payload = JSON.parse(rawBody);
      const event = payload.event;
      const checkoutRequestId = payload.checkout_request_id;
      const mpesaReceiptNumber = payload.mpesa_receipt_number;
      const resultCode = payload.result_code;
      const resultDesc = payload.result_desc;

      if (event === "payment.success") {
        await ctx.runMutation(internal.payments.markByProviderTransactionIdInternal, {
          providerTransactionId: checkoutRequestId,
          successful: true,
        });
      } else if (event === "payment.failed") {
        await ctx.runMutation(internal.payments.markByProviderTransactionIdInternal, {
          providerTransactionId: checkoutRequestId,
          successful: false,
          failureReason: resultDesc || `Result code: ${resultCode}`,
        });
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: "Internal processing error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

export default http;
