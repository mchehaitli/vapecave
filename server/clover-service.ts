import type { DeliveryProduct } from "@shared/schema";

// Clover API configuration
const CLOVER_API_BASE = process.env.CLOVER_API_BASE || "https://api.clover.com";
const CLOVER_API_TOKEN = process.env.CLOVER_API_TOKEN;
const CLOVER_MERCHANT_ID = process.env.CLOVER_MERCHANT_ID;

if (!CLOVER_API_TOKEN || !CLOVER_MERCHANT_ID) {
  console.warn("Warning: Clover API credentials not configured. Set CLOVER_API_TOKEN and CLOVER_MERCHANT_ID environment variables.");
}

// Clover API types
interface CloverItem {
  id: string;
  name: string;
  price: number;
  alternateName?: string;
  code?: string;
  sku?: string;
  cost?: number;
  isRevenue?: boolean;
  modifiedTime?: number;
  defaultTaxRates?: boolean;
  unitName?: string;
  hidden?: boolean;
  available?: boolean;
  autoManage?: boolean;
  itemStock?: {
    quantity: number;
    item: {
      id: string;
    };
  };
  categories?: {
    elements: Array<{
      id: string;
      name: string;
    }>;
  };
  images?: {
    elements: Array<{
      url: string;
    }>;
  };
}

interface CloverItemsResponse {
  elements: CloverItem[];
  href: string;
}

export class CloverService {
  private apiToken: string;
  private merchantId: string;
  private baseUrl: string;

  constructor() {
    if (!CLOVER_API_TOKEN || !CLOVER_MERCHANT_ID) {
      throw new Error("Clover API credentials not configured. Set CLOVER_API_TOKEN and CLOVER_MERCHANT_ID environment variables.");
    }
    this.apiToken = CLOVER_API_TOKEN;
    this.merchantId = CLOVER_MERCHANT_ID;
    this.baseUrl = CLOVER_API_BASE;
  }

  /**
   * Fetch all inventory items from Clover with stock information
   * Automatically handles pagination to retrieve all items
   */
  async fetchInventoryItems(): Promise<CloverItem[]> {
    try {
      let allItems: CloverItem[] = [];
      let offset = 0;
      const limit = 1000; // Clover's max limit per page
      let hasMore = true;
      
      console.log(`Fetching Clover inventory (paginated)...`);
      
      while (hasMore) {
        const url = `${this.baseUrl}/v3/merchants/${this.merchantId}/items?expand=itemStock,categories,images&limit=${limit}&offset=${offset}`;
        
        console.log(`Fetching page at offset ${offset}...`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Clover API error (${response.status}):`, errorText);
          console.error(`API URL: ${url}`);
          console.error(`Merchant ID: ${this.merchantId}`);
          console.error(`Authentication failed. Verify your API token and merchant ID are correct.`);
          
          if (response.status === 401) {
            throw new Error(
              `Clover API authentication failed (401 Unauthorized). ` +
              `Please verify:\n` +
              `1. Your API token is valid and not expired\n` +
              `2. You're using the correct environment (sandbox vs production)\n` +
              `3. The token has 'Read Inventory' permissions\n` +
              `API Base: ${this.baseUrl}\n` +
              `Merchant ID: ${this.merchantId}`
            );
          }
          
          throw new Error(`Clover API request failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data: CloverItemsResponse = await response.json();
        const items = data.elements || [];
        
        console.log(`Fetched ${items.length} items at offset ${offset}`);
        
        allItems = allItems.concat(items);
        
        // Check if there are more items to fetch
        if (items.length < limit) {
          hasMore = false;
        } else {
          offset += limit;
        }
      }
      
      console.log(`Successfully fetched ${allItems.length} total items from Clover`);
      
      return allItems;
    } catch (error) {
      console.error("Error fetching Clover inventory:", error);
      throw error;
    }
  }

  /**
   * Transform Clover item to DeliveryProduct format
   */
  transformCloverItemToProduct(item: CloverItem): Partial<DeliveryProduct> {
    // Get the primary category name, default to "Uncategorized"
    const categoryName = item.categories?.elements?.[0]?.name || "Uncategorized";
    
    // Get the primary image URL, or use a placeholder
    const imageUrl = item.images?.elements?.[0]?.url || "/placeholder-product.png";
    
    // Calculate stock quantity
    const stockQuantity = item.itemStock?.quantity || 0;
    
    // Price is in cents in Clover API, convert to dollars
    const price = (item.price / 100).toFixed(2);
    
    return {
      cloverItemId: item.id,
      name: item.name,
      price: price,
      image: imageUrl,
      description: item.alternateName || item.name,
      category: categoryName,
      stockQuantity: stockQuantity.toString(),
      enabled: false, // Default to disabled until admin enables it
      badge: null,
      displayOrder: 0,
      isFeaturedSlideshow: false,
      isHeroSlideshow: false,
      slideshowPosition: 0,
    };
  }

  /**
   * Fetch and transform all inventory items
   */
  async getTransformedInventory(): Promise<Array<Partial<DeliveryProduct>>> {
    const items = await this.fetchInventoryItems();
    return items
      .filter(item => !item.hidden && item.available !== false) // Filter out hidden/unavailable items
      .map(item => this.transformCloverItemToProduct(item));
  }

  /**
   * Get stock quantity for a specific item
   */
  async getItemStock(cloverItemId: string): Promise<number> {
    try {
      const url = `${this.baseUrl}/v3/merchants/${this.merchantId}/item_stocks/${cloverItemId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        console.error(`Failed to fetch stock for item ${cloverItemId}: ${response.status}`);
        return 0;
      }

      const data = await response.json();
      return data.quantity || 0;
    } catch (error) {
      console.error(`Error fetching stock for item ${cloverItemId}:`, error);
      return 0;
    }
  }

  /**
   * Update stock quantity for a specific item on Clover (active push).
   * Only writes stock quantity — never pushes name, description, price, or any other field.
   */
  async updateItemStock(cloverItemId: string, quantityToDeduct: number): Promise<{ success: boolean; previousStock: number; newStock: number }> {
    try {
      const currentStock = await this.getItemStock(cloverItemId);
      const newStock = Math.max(0, currentStock - quantityToDeduct);

      const url = `${this.baseUrl}/v3/merchants/${this.merchantId}/item_stocks/${cloverItemId}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ quantity: newStock }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Clover Stock Push] Failed to update stock for ${cloverItemId}: ${response.status} ${errorText}`);
        return { success: false, previousStock: currentStock, newStock: currentStock };
      }

      console.log(`[Clover Stock Push] ${cloverItemId}: ${currentStock} → ${newStock} (deducted ${quantityToDeduct})`);
      return { success: true, previousStock: currentStock, newStock };
    } catch (error) {
      console.error(`[Clover Stock Push] Error updating stock for ${cloverItemId}:`, error);
      return { success: false, previousStock: 0, newStock: 0 };
    }
  }

  /**
   * Deduct stock for an entire order. Handles inventory multiplier for pack purchases.
   * If purchaseType is "pack", deducts quantity × packSize units from Clover.
   * Only pushes stock quantity — never pushes names, prices, or pack settings to Clover.
   */
  async deductStockForOrder(items: Array<{ cloverItemId: string | null; quantity: number; purchaseType: string; packSize: number }>): Promise<Array<{ cloverItemId: string; unitsDeducted: number; success: boolean }>> {
    const results: Array<{ cloverItemId: string; unitsDeducted: number; success: boolean }> = [];

    for (const item of items) {
      if (!item.cloverItemId) {
        continue;
      }

      const unitsToDeduct = item.purchaseType === 'pack'
        ? item.quantity * item.packSize
        : item.quantity;

      const result = await this.updateItemStock(item.cloverItemId, unitsToDeduct);
      results.push({
        cloverItemId: item.cloverItemId,
        unitsDeducted: unitsToDeduct,
        success: result.success,
      });
    }

    const succeeded = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    console.log(`[Clover Stock Push] Order deduction complete: ${succeeded} succeeded, ${failed} failed`);

    return results;
  }

  private async getItemStockStrict(cloverItemId: string): Promise<number> {
    const url = `${this.baseUrl}/v3/merchants/${this.merchantId}/item_stocks/${cloverItemId}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch stock for ${cloverItemId}: ${response.status}`);
    }

    const data = await response.json();
    return data.quantity || 0;
  }

  async addItemStock(cloverItemId: string, quantityToAdd: number, retryCount = 0): Promise<{ success: boolean; previousStock: number; newStock: number }> {
    const MAX_RETRIES = 3;
    const BASE_DELAY_MS = 1000;

    try {
      const currentStock = await this.getItemStockStrict(cloverItemId);
      const newStock = currentStock + quantityToAdd;

      const url = `${this.baseUrl}/v3/merchants/${this.merchantId}/item_stocks/${cloverItemId}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ quantity: newStock }),
      });

      if (response.status === 429 && retryCount < MAX_RETRIES) {
        const retryAfter = response.headers.get('Retry-After');
        const delayMs = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : BASE_DELAY_MS * Math.pow(2, retryCount);
        console.warn(`[Clover Stock Restore] Rate limited on ${cloverItemId}, retrying in ${delayMs}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return this.addItemStock(cloverItemId, quantityToAdd, retryCount + 1);
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Clover Stock Restore] Failed to restore stock for ${cloverItemId}: ${response.status} ${errorText}`);
        return { success: false, previousStock: currentStock, newStock: currentStock };
      }

      console.log(`[Clover Stock Restore] ${cloverItemId}: ${currentStock} → ${newStock} (restored ${quantityToAdd})`);
      return { success: true, previousStock: currentStock, newStock };
    } catch (error) {
      console.error(`[Clover Stock Restore] Error restoring stock for ${cloverItemId}:`, error);
      return { success: false, previousStock: 0, newStock: 0 };
    }
  }

  async restoreStockForOrder(items: Array<{ cloverItemId: string | null; quantity: number; purchaseType: string; packSize: number }>): Promise<Array<{ cloverItemId: string; unitsRestored: number; success: boolean }>> {
    const results: Array<{ cloverItemId: string; unitsRestored: number; success: boolean }> = [];

    for (const item of items) {
      if (!item.cloverItemId) {
        continue;
      }

      const unitsToRestore = item.purchaseType === 'pack'
        ? item.quantity * item.packSize
        : item.quantity;

      const result = await this.addItemStock(item.cloverItemId, unitsToRestore);
      results.push({
        cloverItemId: item.cloverItemId,
        unitsRestored: unitsToRestore,
        success: result.success,
      });
    }

    const succeeded = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    console.log(`[Clover Stock Restore] Order restoration complete: ${succeeded} succeeded, ${failed} failed`);

    return results;
  }

  async createCashOrder(params: {
    orderRef: string;
    customerName: string;
    items: Array<{ name: string; price: number; quantity: number }>;
    total: number;
    note?: string;
  }): Promise<{ success: boolean; cloverOrderId?: string; error?: string }> {
    try {
      const orderUrl = `${this.baseUrl}/v3/merchants/${this.merchantId}/orders`;
      const createRes = await fetch(orderUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          state: 'open',
          total: Math.round(params.total * 100),
          title: params.orderRef,
          note: params.note || `Online order for ${params.customerName}`,
          manualTransaction: false,
        }),
      });

      if (!createRes.ok) {
        const errText = await createRes.text();
        console.error(`[Clover Cash Order] Failed to create order: ${createRes.status} ${errText}`);
        return { success: false, error: `Failed to create Clover order: ${createRes.status}` };
      }

      const cloverOrder = await createRes.json();
      const cloverOrderId = cloverOrder.id;
      console.log(`[Clover Cash Order] Created order ${cloverOrderId}`);

      for (const item of params.items) {
        const lineUrl = `${this.baseUrl}/v3/merchants/${this.merchantId}/orders/${cloverOrderId}/line_items`;
        const lineRes = await fetch(lineUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            name: item.name,
            price: Math.round(item.price * 100),
            unitQty: item.quantity * 1000,
          }),
        });
        if (!lineRes.ok) {
          console.error(`[Clover Cash Order] Failed to add line item "${item.name}": ${lineRes.status}`);
        }
      }

      const tendersUrl = `${this.baseUrl}/v3/merchants/${this.merchantId}/tenders`;
      const tendersRes = await fetch(tendersUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Accept': 'application/json',
        },
      });

      let cashTenderId: string | null = null;
      if (tendersRes.ok) {
        const tendersData = await tendersRes.json();
        const cashTender = (tendersData.elements || []).find(
          (t: any) => t.label?.toLowerCase() === 'cash' || t.labelKey === 'com.clover.tender.cash'
        );
        cashTenderId = cashTender?.id || null;
      }

      if (cashTenderId) {
        const paymentUrl = `${this.baseUrl}/v3/merchants/${this.merchantId}/orders/${cloverOrderId}/payments`;
        const payRes = await fetch(paymentUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            tender: { id: cashTenderId },
            amount: Math.round(params.total * 100),
          }),
        });
        if (!payRes.ok) {
          console.error(`[Clover Cash Order] Failed to add cash payment: ${payRes.status}`);
        } else {
          console.log(`[Clover Cash Order] Cash payment recorded for order ${cloverOrderId}`);
        }
      } else {
        console.warn(`[Clover Cash Order] No cash tender found — order ${cloverOrderId} created without payment record`);
      }

      return { success: true, cloverOrderId };
    } catch (error: any) {
      console.error('[Clover Cash Order] Error:', error);
      return { success: false, error: error.message || 'Unknown error creating Clover cash order' };
    }
  }
}
