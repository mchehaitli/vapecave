import { CloverService } from "./clover-service";
import { storage } from "./storage";

let syncInterval: NodeJS.Timeout | null = null;
let lastSyncTime: Date | null = null;

/**
 * Sync stock and prices from Clover for enabled products only
 */
async function syncEnabledProducts(): Promise<{ refreshed: number; timestamp: string }> {
  try {
    if (!process.env.CLOVER_API_TOKEN || !process.env.CLOVER_MERCHANT_ID) {
      console.log("Clover API credentials not configured, skipping sync");
      return { refreshed: 0, timestamp: new Date().toISOString() };
    }

    console.log("[Clover Sync] Starting automatic sync of enabled products...");
    
    // Get all enabled products from our database
    const enabledProducts = await storage.getEnabledDeliveryProducts();
    console.log(`[Clover Sync] Found ${enabledProducts.length} enabled products to sync`);
    
    // Build a set of Clover IDs for enabled products
    const enabledCloverIds = new Set(
      enabledProducts
        .map(p => p.cloverItemId)
        .filter(id => id !== null) as string[]
    );
    
    if (enabledCloverIds.size === 0) {
      console.log("[Clover Sync] No enabled products with Clover IDs, skipping sync");
      return { refreshed: 0, timestamp: new Date().toISOString() };
    }
    
    const cloverService = new CloverService();
    const items = await cloverService.fetchInventoryItems();
    
    let refreshed = 0;
    for (const item of items) {
      // Only sync if this item is in our enabled products
      if (!enabledCloverIds.has(item.id)) {
        continue;
      }
      
      const stockQuantity = (item.itemStock?.quantity || 0).toString();
      const price = (item.price / 100).toFixed(2); // Convert cents to dollars
      const updated = await storage.refreshProductStockAndPrice(item.id, stockQuantity, price);
      if (updated) refreshed++;
    }
    
    lastSyncTime = new Date();
    const timestamp = lastSyncTime.toISOString();
    
    console.log(`[Clover Sync] Successfully synced ${refreshed} enabled products at ${timestamp}`);
    
    return { refreshed, timestamp };
  } catch (error) {
    console.error("[Clover Sync] Error syncing products:", error);
    return { refreshed: 0, timestamp: new Date().toISOString() };
  }
}

/**
 * Start automatic sync every 5 minutes
 */
export function startAutoSync() {
  if (syncInterval) {
    console.log("[Clover Sync] Auto-sync already running");
    return;
  }

  console.log("[Clover Sync] Starting auto-sync (every 5 minutes)");
  
  // Run initial sync
  syncEnabledProducts();
  
  // Set up interval (5 minutes = 300000ms)
  syncInterval = setInterval(() => {
    syncEnabledProducts();
  }, 5 * 60 * 1000);
}

/**
 * Stop automatic sync
 */
export function stopAutoSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log("[Clover Sync] Auto-sync stopped");
  }
}

/**
 * Manually trigger sync (e.g., after order completion)
 */
export async function triggerManualSync(): Promise<{ refreshed: number; timestamp: string }> {
  console.log("[Clover Sync] Manual sync triggered");
  return await syncEnabledProducts();
}

/**
 * Get last sync time
 */
export function getLastSyncTime(): Date | null {
  return lastSyncTime;
}

/**
 * Get next sync time
 */
export function getNextSyncTime(): Date | null {
  if (!lastSyncTime) return null;
  const next = new Date(lastSyncTime.getTime() + 5 * 60 * 1000);
  return next;
}
