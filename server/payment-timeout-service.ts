import type { IStorage } from "./storage";

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
          await storage.updateDeliveryOrderStatus(order.id, "cancelled");
          console.log(
            `[PaymentTimeout] Cancelled order #${order.id} (expired after ${TIMEOUT_MINUTES}min), restored ${items.length} item stock(s)`
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
