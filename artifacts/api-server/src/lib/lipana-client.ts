/**
 * Lipana Payment Client for M-Pesa integration
 * Official API Documentation: https://lipana.dev
 */
import crypto from "crypto";

export interface LipanaPaymentRequest {
  phone: string; // Format: +254712345678 or 254712345678
  amount: number; // Amount in KES, minimum 10
}

export interface LipanaPaymentResponse {
  success: boolean;
  message: string;
  data?: {
    transactionId: string;
    status: string;
    checkoutRequestID: string;
    message: string;
  };
  error?: string;
}

export interface LipanaWebhookPayload {
  event: string; // payment.success, payment.failed
  data: {
    transactionId: string;
    amount: number;
    currency: string;
    status: string;
    phone: string;
    checkoutRequestID: string;
    timestamp: string;
  };
}

export interface LipanaPaymentStatus {
  success: boolean;
  data?: {
    status: string;
    amount: number;
    transactionId: string;
  };
  error?: string;
}

export class LipanaClient {
  private readonly secretKey: string;
  private readonly baseUrl: string;

  constructor(secretKey: string, isProduction: boolean = false) {
    this.secretKey = secretKey;
    this.baseUrl = isProduction
      ? "https://api.lipana.africa/v1"
      : "https://sandbox.lipana.africa/v1";
  }

  /**
   * Initialize M-Pesa STK Push payment
   * Official endpoint: POST /api/transactions/push-stk
   */
  async initiatePayment(
    request: LipanaPaymentRequest
  ): Promise<LipanaPaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/transactions/push-stk`, {
        method: "POST",
        headers: {
          "x-api-key": this.secretKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: request.phone,
          amount: request.amount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: (data as any).message || "Payment initiation failed",
          error: (data as any).error || "Unknown error",
        };
      }

      return {
        success: true,
        message: (data as any).message || "Payment initiated successfully",
        data: (data as any).data,
      };
    } catch (error) {
      return {
        success: false,
        message: "Network error",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(
    checkoutRequestId: string
  ): Promise<LipanaPaymentStatus> {
    try {
      const response = await fetch(
        `${this.baseUrl}/payments/status/${checkoutRequestId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        }
      );

      const data = await response.json() as any;

      if (!response.ok) {
        return {
          success: false,
          error: (data as any).message || "Failed to fetch payment status",
        };
      }

      return {
        success: true,
        data: (data as any).data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Verify webhook signature
   * Uses X-Lipana-Signature header
   */
  verifyWebhookSignature(
    payload: string,
    signature: string,
    webhookSecret: string
  ): boolean {
    // Lipana uses HMAC SHA256 for webhook verification
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(payload)
      .digest("hex");

    // timingSafeEqual throws if the buffers differ in length, so check first
    return (
      signature.length === expectedSignature.length &&
      crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      )
    );
  }

  /**
   * Format phone number to Lipana format (+254XXXXXXXXX)
   */
  static formatPhoneNumber(phone: string): string {
    // Remove any spaces, dashes, or plus signs
    let cleaned = phone.replace(/[\s\-+]/g, "");

    // If starts with 0, replace with 254
    if (cleaned.startsWith("0")) {
      cleaned = "254" + cleaned.slice(1);
    }

    // If doesn't start with 254, add it
    if (!cleaned.startsWith("254")) {
      cleaned = "254" + cleaned;
    }

    // Add + prefix for Lipana format
    return "+" + cleaned;
  }

  /**
   * Validate phone number format
   */
  static isValidKenyanPhone(phone: string): boolean {
    const formatted = LipanaClient.formatPhoneNumber(phone);
    // Kenyan numbers: +254 + 9 digits (7XX, 1XX, etc.)
    return /^\+254[17]\d{8}$/.test(formatted);
  }
}

// Export singleton instance
let lipanaClient: LipanaClient | null = null;

export function getLipanaClient(): LipanaClient {
  if (!lipanaClient) {
    const secretKey = process.env.LIPANA_SECRET_KEY;
    if (!secretKey) {
      throw new Error("LIPANA_SECRET_KEY environment variable is not set");
    }

    // Determine environment: explicit setting or NODE_ENV
    // LIPANA_ENVIRONMENT should be "sandbox" or "production"
    const envSetting = process.env.LIPANA_ENVIRONMENT;
    const isProduction = envSetting === "production" || 
                         (envSetting !== "sandbox" && process.env.NODE_ENV === "production");
    
    // Log environment choice for debugging (without secrets)
    console.log(`[Lipana] Using ${isProduction ? 'production' : 'sandbox'} environment`);
    
    lipanaClient = new LipanaClient(secretKey, isProduction);
  }

  return lipanaClient;
}
