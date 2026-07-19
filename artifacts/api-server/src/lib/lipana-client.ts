/**
 * Lipana Payment Client for M-Pesa integration
 * API Documentation: https://lipana.africa/docs
 */

export interface LipanaPaymentRequest {
  amount: number; // Amount in KES
  phone_number: string; // Format: 254712345678
  account_reference: string; // Your order reference
  transaction_desc?: string; // Optional description
  callback_url?: string; // Optional callback URL
}

export interface LipanaPaymentResponse {
  success: boolean;
  message: string;
  data?: {
    checkout_request_id: string;
    merchant_request_id: string;
    response_code: string;
    response_description: string;
    customer_message: string;
  };
  error?: string;
}

export interface LipanaPaymentStatus {
  success: boolean;
  data?: {
    checkout_request_id: string;
    result_code: string;
    result_desc: string;
    amount?: number;
    mpesa_receipt_number?: string;
    transaction_date?: string;
    phone_number?: string;
  };
  error?: string;
}

export interface LipanaWebhookPayload {
  event: string; // payment.success, payment.failed, payment.pending
  checkout_request_id: string;
  merchant_request_id: string;
  amount: number;
  phone_number: string;
  mpesa_receipt_number?: string;
  transaction_date?: string;
  result_code: string;
  result_desc: string;
  account_reference: string;
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
   */
  async initiatePayment(
    request: LipanaPaymentRequest
  ): Promise<LipanaPaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/stk-push`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || "Payment initiation failed",
          error: data.error || "Unknown error",
        };
      }

      return {
        success: true,
        message: "Payment initiated successfully",
        data: data.data,
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

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || "Failed to fetch payment status",
        };
      }

      return {
        success: true,
        data: data.data,
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
   */
  verifyWebhookSignature(
    payload: string,
    signature: string,
    webhookSecret: string
  ): boolean {
    // Lipana uses HMAC SHA256 for webhook verification
    const crypto = require("crypto");
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(payload)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Format phone number to Lipana format (254XXXXXXXXX)
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

    return cleaned;
  }

  /**
   * Validate phone number format
   */
  static isValidKenyanPhone(phone: string): boolean {
    const formatted = LipanaClient.formatPhoneNumber(phone);
    // Kenyan numbers: 254 + 9 digits (7XX, 1XX, etc.)
    return /^254[17]\d{8}$/.test(formatted);
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

    const isProduction = process.env.NODE_ENV === "production";
    lipanaClient = new LipanaClient(secretKey, isProduction);
  }

  return lipanaClient;
}
