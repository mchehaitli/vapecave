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
}
