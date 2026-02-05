import crypto from "crypto";

const CLOVER_API_BASE_SANDBOX = "https://apisandbox.dev.clover.com";
const CLOVER_API_BASE_PROD = "https://api.clover.com";

const CLOVER_API_BASE = process.env.CLOVER_ENVIRONMENT === "production" 
  ? CLOVER_API_BASE_PROD 
  : CLOVER_API_BASE_SANDBOX;

const CLOVER_HOSTED_CHECKOUT_TOKEN = process.env.CLOVER_HOSTED_CHECKOUT_TOKEN;
const CLOVER_MERCHANT_ID = process.env.CLOVER_MERCHANT_ID;
const CLOVER_WEBHOOK_SECRET = process.env.CLOVER_WEBHOOK_SECRET;

interface LineItem {
  name: string;
  price: number;
  unitQty: number;
  note?: string;
}

interface CustomerInfo {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

interface CheckoutSessionRequest {
  customer: CustomerInfo;
  lineItems: LineItem[];
  taxAmount?: number;
  orderId?: string;
}

interface CheckoutSessionResponse {
  href: string;
  checkoutSessionId: string;
  createdTime: number;
  expirationTime: number;
}

interface WebhookPayload {
  createdTime: number;
  message: string;
  status: string;
  type: string;
  id: string;
  merchantId: string;
  data: string;
}

export class CloverHostedCheckout {
  private privateToken: string;
  private merchantId: string;
  private webhookSecret: string;
  private baseUrl: string;

  constructor() {
    if (!CLOVER_HOSTED_CHECKOUT_TOKEN) {
      console.warn("Warning: CLOVER_HOSTED_CHECKOUT_TOKEN not configured.");
    }
    if (!CLOVER_MERCHANT_ID) {
      console.warn("Warning: CLOVER_MERCHANT_ID not configured.");
    }
    this.privateToken = CLOVER_HOSTED_CHECKOUT_TOKEN || "";
    this.merchantId = CLOVER_MERCHANT_ID || "";
    this.webhookSecret = CLOVER_WEBHOOK_SECRET || "";
    this.baseUrl = CLOVER_API_BASE;
  }

  isConfigured(): boolean {
    return !!(this.privateToken && this.merchantId);
  }

  async createCheckoutSession(request: CheckoutSessionRequest): Promise<CheckoutSessionResponse> {
    if (!this.isConfigured()) {
      throw new Error("Clover Hosted Checkout is not configured. Missing token or merchant ID.");
    }

    const baseUrl = process.env.NODE_ENV === "production" 
      ? "https://vapecavetx.com" 
      : (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost:5000");

    const payload = {
      customer: {
        email: request.customer.email,
        firstName: request.customer.firstName,
        lastName: request.customer.lastName,
        phoneNumber: request.customer.phoneNumber || "",
      },
      shoppingCart: {
        lineItems: request.lineItems.map(item => ({
          name: item.name,
          price: item.price,
          unitQty: item.unitQty,
          note: item.note || "",
        })),
      },
      redirectUrls: {
        success: `${baseUrl}/delivery/order-success?session={checkoutSessionId}`,
        failure: `${baseUrl}/delivery/checkout?error=payment_failed`,
        cancel: `${baseUrl}/delivery/checkout?error=cancelled`,
      },
    };

    if (request.orderId) {
      (payload as any).externalReferenceId = request.orderId;
    }

    console.log("[Clover Hosted Checkout] Creating session:", JSON.stringify(payload, null, 2));

    try {
      const response = await fetch(
        `${this.baseUrl}/invoicingcheckoutservice/v1/checkouts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${this.privateToken}`,
            "X-Clover-Merchant-Id": this.merchantId,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("[Clover Hosted Checkout] Error:", data);
        throw new Error(data.message || data.error?.message || `Checkout creation failed: ${response.status}`);
      }

      console.log("[Clover Hosted Checkout] Session created:", data);
      return data as CheckoutSessionResponse;
    } catch (error) {
      console.error("[Clover Hosted Checkout] Error creating session:", error);
      throw error;
    }
  }

  verifyWebhookSignature(cloverSignatureHeader: string, rawBody: string): boolean {
    if (!this.webhookSecret) {
      console.warn("[Clover Webhook] No webhook secret configured, skipping verification");
      return true;
    }

    try {
      const parts = cloverSignatureHeader.split(",");
      const timestamp = parts[0].split("=")[1];
      const v1Signature = parts[1].split("=")[1];

      const signedPayload = `${timestamp}.${rawBody}`;
      const hmac = crypto.createHmac("sha256", this.webhookSecret);
      const computedSignature = hmac.update(signedPayload).digest("hex");

      const isValid = crypto.timingSafeEqual(
        Buffer.from(computedSignature),
        Buffer.from(v1Signature)
      );

      return isValid;
    } catch (error) {
      console.error("[Clover Webhook] Signature verification error:", error);
      return false;
    }
  }

  parseWebhookPayload(rawBody: string): WebhookPayload {
    return JSON.parse(rawBody) as WebhookPayload;
  }
}

export const cloverHostedCheckout = new CloverHostedCheckout();
