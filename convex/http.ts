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

      // Parse payload — Lipana webhook shape: { event, data: { transactionId, amount, currency, status, phone, checkoutRequestID, timestamp } }
      const payload = JSON.parse(rawBody) as Record<string, unknown>;
      const data = (payload.data ?? {}) as Record<string, unknown>;
      const event = payload.event as string | undefined;
      const transactionId =
        (data.transactionId as string | undefined) ??
        (data.checkoutRequestID as string | undefined) ??
        (payload.checkout_request_id as string | undefined);
      const resultDesc =
        (data.message as string | undefined) ??
        (data.resultDesc as string | undefined) ??
        (payload.result_desc as string | undefined);
      const resultCode = (data.resultCode as string | number | undefined) ?? (payload.result_code as string | number | undefined);

      if (!transactionId) {
        return new Response(JSON.stringify({ error: "Missing transactionId" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const successful =
        event === "payment.success" ||
        data.status === "success" ||
        String(resultCode) === "0";

      await ctx.runMutation(internal.payments.markByProviderTransactionIdInternal, {
        providerTransactionId: transactionId,
        successful,
        failureReason: successful ? undefined : resultDesc || `Payment failed (result code: ${resultCode ?? "unknown"})`,
      });

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
