// Clover eCommerce Payment Service
// Handles payment tokenization and charge processing

const CLOVER_ECOMM_BASE_SANDBOX = "https://scl-sandbox.dev.clover.com";
const CLOVER_ECOMM_BASE_PROD = "https://scl.clover.com";

// Use sandbox for development, production for live
const CLOVER_ECOMM_BASE = process.env.CLOVER_ENVIRONMENT === "production" 
  ? CLOVER_ECOMM_BASE_PROD 
  : CLOVER_ECOMM_BASE_SANDBOX;

const CLOVER_ECOMM_PRIVATE_TOKEN = process.env.CLOVER_ECOMM_PRIVATE_TOKEN;

interface CloverChargeRequest {
  source: string; // clv_* token from iframe
  amount: number; // Amount in cents
  currency?: string;
  description?: string;
  externalReferenceId?: string;
}

interface CloverChargeResponse {
  id: string;
  amount: number;
  captured: boolean;
  status: string;
  source?: {
    last4?: string;
    brand?: string;
  };
  created?: number;
  ref_num?: string;
}

interface CloverError {
  error: {
    type: string;
    code: string;
    message: string;
  };
}

export class CloverPaymentService {
  private privateToken: string;
  private baseUrl: string;

  constructor() {
    if (!CLOVER_ECOMM_PRIVATE_TOKEN) {
      console.warn("Warning: CLOVER_ECOMM_PRIVATE_TOKEN not configured. Payment processing will fail.");
    }
    this.privateToken = CLOVER_ECOMM_PRIVATE_TOKEN || "";
    this.baseUrl = CLOVER_ECOMM_BASE;
  }

  /**
   * Check if payment service is configured
   */
  isConfigured(): boolean {
    return !!this.privateToken;
  }

  /**
   * Create a charge using a card token from the iframe
   */
  async createCharge(request: CloverChargeRequest): Promise<CloverChargeResponse> {
    if (!this.isConfigured()) {
      throw new Error("Clover payment service is not configured. Missing CLOVER_ECOMM_PRIVATE_TOKEN.");
    }

    try {
      const response = await fetch(`${this.baseUrl}/v1/charges`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.privateToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: request.source,
          amount: request.amount,
          currency: request.currency || "usd",
          description: request.description,
          external_reference_id: request.externalReferenceId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorData = data as CloverError;
        console.error("Clover charge error:", errorData);
        throw new Error(errorData.error?.message || `Payment failed: ${response.status}`);
      }

      return data as CloverChargeResponse;
    } catch (error) {
      console.error("Error creating Clover charge:", error);
      throw error;
    }
  }

  /**
   * Refund a charge
   */
  async refundCharge(chargeId: string, amount?: number): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error("Clover payment service is not configured.");
    }

    try {
      const body: any = { charge: chargeId };
      if (amount) {
        body.amount = amount;
      }

      const response = await fetch(`${this.baseUrl}/v1/refunds`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.privateToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorData = data as CloverError;
        console.error("Clover refund error:", errorData);
        throw new Error(errorData.error?.message || `Refund failed: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error("Error refunding Clover charge:", error);
      throw error;
    }
  }

  /**
   * Get charge details
   */
  async getCharge(chargeId: string): Promise<CloverChargeResponse> {
    if (!this.isConfigured()) {
      throw new Error("Clover payment service is not configured.");
    }

    try {
      const response = await fetch(`${this.baseUrl}/v1/charges/${chargeId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${this.privateToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`Failed to get charge: ${response.status}`);
      }

      return data as CloverChargeResponse;
    } catch (error) {
      console.error("Error getting Clover charge:", error);
      throw error;
    }
  }
}

// Singleton instance
export const cloverPaymentService = new CloverPaymentService();
