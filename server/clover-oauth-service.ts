import { storage } from "./storage";

const CLOVER_CLIENT_ID = process.env.CLOVER_CLIENT_ID;
const CLOVER_CLIENT_SECRET = process.env.CLOVER_CLIENT_SECRET;
const CLOVER_REDIRECT_URI = process.env.CLOVER_REDIRECT_URI || "https://vapecavetx.com/api/clover/oauth/callback";
const CLOVER_AUTH_BASE = process.env.CLOVER_AUTH_BASE || "https://www.clover.com/oauth";
const CLOVER_API_BASE = process.env.CLOVER_API_BASE || "https://api.clover.com";

interface CloverTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

export class CloverOAuthService {
  /**
   * Generate the authorization URL to redirect the user to Clover
   */
  getAuthorizationUrl(state?: string): string {
    if (!CLOVER_CLIENT_ID) {
      throw new Error("CLOVER_CLIENT_ID is not configured");
    }

    const params = new URLSearchParams({
      client_id: CLOVER_CLIENT_ID,
      redirect_uri: CLOVER_REDIRECT_URI
    });

    if (state) {
      params.append('state', state);
    }

    return `${CLOVER_AUTH_BASE}/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token and refresh token
   */
  async exchangeCodeForToken(code: string): Promise<CloverTokenResponse> {
    if (!CLOVER_CLIENT_ID || !CLOVER_CLIENT_SECRET) {
      throw new Error("Clover OAuth credentials not configured");
    }

    const params = new URLSearchParams({
      client_id: CLOVER_CLIENT_ID,
      client_secret: CLOVER_CLIENT_SECRET,
      code: code
    });

    const response = await fetch(`${CLOVER_AUTH_BASE}/token?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token exchange failed:', errorText);
      throw new Error(`Failed to exchange code for token: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Refresh an expired access token using the refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<CloverTokenResponse> {
    if (!CLOVER_CLIENT_ID || !CLOVER_CLIENT_SECRET) {
      throw new Error("Clover OAuth credentials not configured");
    }

    const params = new URLSearchParams({
      client_id: CLOVER_CLIENT_ID,
      client_secret: CLOVER_CLIENT_SECRET,
      refresh_token: refreshToken
    });

    const response = await fetch(`${CLOVER_AUTH_BASE}/refresh?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token refresh failed:', errorText);
      throw new Error(`Failed to refresh token: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get merchant ID from access token
   */
  async getMerchantId(accessToken: string): Promise<string> {
    const response = await fetch(`${CLOVER_API_BASE}/v3/merchants/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get merchant info: ${response.status}`);
    }

    const data = await response.json();
    return data.id;
  }

  /**
   * Store OAuth tokens in database
   */
  async storeTokens(merchantId: string, tokenData: CloverTokenResponse): Promise<void> {
    const expiresIn = tokenData.expires_in || 31536000; // Default to 1 year if not provided
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    await storage.upsertCloverOAuthToken({
      merchantId,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || tokenData.access_token, // Use access_token as fallback
      expiresAt
    });

    console.log(`[OAuth] Stored tokens for merchant ${merchantId}, expires at ${expiresAt.toISOString()}`);
  }

  /**
   * Get valid access token for a merchant, refreshing if necessary
   */
  async getValidAccessToken(merchantId: string): Promise<string | null> {
    const tokenRecord = await storage.getCloverOAuthToken(merchantId);

    if (!tokenRecord) {
      console.log(`[OAuth] No token found for merchant ${merchantId}`);
      return null;
    }

    // Check if token is expired (with 5 minute buffer)
    const now = new Date();
    const expiresAt = new Date(tokenRecord.expiresAt);
    const bufferMs = 5 * 60 * 1000; // 5 minutes

    if (now.getTime() + bufferMs < expiresAt.getTime()) {
      // Token is still valid
      return tokenRecord.accessToken;
    }

    // Token is expired or about to expire, refresh it
    console.log(`[OAuth] Token expired for merchant ${merchantId}, refreshing...`);
    
    try {
      const newTokenData = await this.refreshAccessToken(tokenRecord.refreshToken);
      await this.storeTokens(merchantId, newTokenData);
      return newTokenData.access_token;
    } catch (error) {
      console.error(`[OAuth] Failed to refresh token for merchant ${merchantId}:`, error);
      return null;
    }
  }

  /**
   * Check if merchant has connected their Clover account
   */
  async isConnected(merchantId: string): Promise<boolean> {
    const token = await this.getValidAccessToken(merchantId);
    return token !== null;
  }

  /**
   * Disconnect Clover account
   */
  async disconnect(merchantId: string): Promise<void> {
    await storage.deleteCloverOAuthToken(merchantId);
    console.log(`[OAuth] Disconnected merchant ${merchantId}`);
  }
}

export const cloverOAuthService = new CloverOAuthService();
