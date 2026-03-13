import type { IStorage } from "./storage";
import { CloverService } from "./clover-service";

const TIMEOUT_MINUTES = 15;
const CHECK_INTERVAL_MS = 2 * 60 * 1000; // every 2 minutes

export function startPaymentTimeoutService(storage: IStorage): void {
  setInterval(async () => {
    try {
      const cutoff = new Date(Date.now() - TIMEOUT_MINUTES * 60 * 1000);
      const allOrders = await storage.getAllDeliveryOrders();
      const expired = allOrders.filter(
        (o) => o.status === "pending_payment" && new Date(o.createdAt!) < cutoff
      );

      if (expired.length === 0) return;

      console.log(`[PaymentTimeout] Found ${expired.length} expired pending_payment order(s)`);

      for (const order of expired) {
        try {
          const items = await storage.getDeliveryOrderItems(order.id);
          for (const item of items) {
            await storage.restoreProductStock(item.productId, item.quantity);
          }

          if (process.env.CLOVER_API_TOKEN && process.env.CLOVER_MERCHANT_ID) {
            try {
              const cloverService = new CloverService();
              const stockItems = items
                .filter((i: any) => i.product?.cloverItemId)
                .map((i: any) => ({
                  cloverItemId: i.product.cloverItemId,
                  quantity: i.quantity,
                  purchaseType: i.purchaseType || "single",
                  packSize: i.product.packSize || 1,
                }));
              if (stockItems.length > 0) {
                await cloverService.restoreStockForOrder(stockItems);
              }
            } catch (cloverErr) {
              console.error(`[PaymentTimeout] Error pushing stock restoration to Clover for order #${order.id}:`, cloverErr);
            }
          }

          await storage.updateDeliveryOrderStatus(order.id, "cancelled");
          console.log(
            `[PaymentTimeout] Cancelled order #${order.id} (expired after ${TIMEOUT_MINUTES}min), restored ${items.length} item stock(s) + pushed to Clover`
          );
        } catch (err) {
          console.error(`[PaymentTimeout] Error processing expired order #${order.id}:`, err);
        }
      }
    } catch (err) {
      console.error("[PaymentTimeout] Error during timeout check:", err);
    }
  }, CHECK_INTERVAL_MS);

  console.log(
    `[PaymentTimeout] Payment timeout service started — cancels pending_payment orders after ${TIMEOUT_MINUTES} minutes`
  );
}
