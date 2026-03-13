import type { IStorage } from "./storage";
import { CloverService } from "./clover-service";

const STALE_HOURS = 24;
const TARGET_HOUR = 2;
const TIMEZONE = "America/Chicago";

function getNextRunDelay(): number {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const currentHour = parseInt(parts.find(p => p.type === "hour")!.value, 10);
  const currentMinute = parseInt(parts.find(p => p.type === "minute")!.value, 10);
  const currentSecond = parseInt(parts.find(p => p.type === "second")!.value, 10);

  let hoursUntil = TARGET_HOUR - currentHour;
  if (hoursUntil < 0 || (hoursUntil === 0 && (currentMinute > 0 || currentSecond > 0))) {
    hoursUntil += 24;
  }

  return hoursUntil * 3600000 - currentMinute * 60000 - currentSecond * 1000;
}

async function cleanupStaleOrders(storage: IStorage): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - STALE_HOURS * 60 * 60 * 1000);
    const allOrders = await storage.getAllDeliveryOrders();
    const staleOrders = allOrders.filter(
      (o) =>
        o.status === "pending" &&
        (o.paymentMethod === "cash" || o.paymentMethod === "pay_on_delivery") &&
        new Date(o.createdAt!) < cutoff
    );

    if (staleOrders.length === 0) {
      console.log("[StaleOrderCleanup] No stale orders found");
      return;
    }

    console.log(`[StaleOrderCleanup] Found ${staleOrders.length} stale pending cash/POD order(s)`);

    for (const order of staleOrders) {
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
            console.error(`[StaleOrderCleanup] Error pushing stock restoration to Clover for order #${order.id}:`, cloverErr);
          }
        }

        await storage.updateDeliveryOrderStatus(order.id, "cancelled");
        console.log(
          `[StaleOrderCleanup] Cancelled stale order #${order.id} (${order.paymentMethod}, created ${order.createdAt}), restored ${items.length} item stock(s)`
        );
      } catch (err) {
        console.error(`[StaleOrderCleanup] Error processing stale order #${order.id}:`, err);
      }
    }
  } catch (err) {
    console.error("[StaleOrderCleanup] Error during cleanup:", err);
  }
}

function scheduleNextRun(storage: IStorage): void {
  const delay = getNextRunDelay();
  const delayHours = (delay / 3600000).toFixed(1);
  console.log(`[StaleOrderCleanup] Next run in ~${delayHours} hours`);

  setTimeout(async () => {
    await cleanupStaleOrders(storage);
    scheduleNextRun(storage);
  }, delay);
}

export function startStaleOrderCleanupService(storage: IStorage): void {
  console.log(
    `[StaleOrderCleanup] Service started — runs at ${TARGET_HOUR}:00 AM ${TIMEZONE} daily`
  );
  scheduleNextRun(storage);
}
