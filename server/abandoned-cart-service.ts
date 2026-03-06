import { storage } from './storage';
import { sendEmail } from './email-service';

const ABANDONED_CART_HOURS = 24;
const MAX_REMINDERS = 2;
const REMINDER_INTERVAL_HOURS = 48;

let abandonedCartJobRunning = false;

async function getAbandonedCartTemplate(): Promise<{ subject: string; bodyText: string }> {
  try {
    const tpl = await storage.getEmailTemplate('abandoned_cart');
    if (tpl) return { subject: tpl.subject, bodyText: tpl.bodyText };
  } catch {
  }
  return {
    subject: "Your cart is waiting! Complete your order at Vape Cave",
    bodyText: `Hi [CUSTOMER_NAME],

We noticed you left some items in your cart. Don't worry — we've saved them for you!

Complete your order now and get your items delivered to your door. Stock is limited, so grab yours before it's gone.

Questions? Just reply to this email and we'll be happy to help.`,
  };
}

function renderTemplate(bodyText: string, variables: Record<string, string>): string {
  let result = bodyText;
  for (const [key, value] of Object.entries(variables)) {
    result = result.split(`[${key}]`).join(value);
  }
  return result;
}

function masterShell(headerTitle: string, bodyHtml: string, ctaHtml: string): string {
  const inner = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #1a1a1a; color: #f5f5f5; border-radius: 12px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #ff7100, #ff9a00); padding: 28px 24px; text-align: center;">
    <h1 style="margin: 0; font-size: 24px; color: #000; font-weight: 800;">${headerTitle}</h1>
  </div>
  <div style="background: #ffffff; padding: 32px 28px; color: #333;">
    <div style="font-size: 15px; line-height: 1.7; white-space: pre-line;">${bodyHtml}</div>
    <div style="margin-top: 28px;">${ctaHtml}</div>
  </div>
  <div style="padding: 20px 24px; text-align: center;">
    <p style="font-size: 12px; color: #888; margin: 0;">
      Vape Cave Smoke &amp; Stuff &middot; Frisco, TX &middot; <a href="https://vapecavetx.com" style="color: #ff7100; text-decoration: none;">vapecavetx.com</a>
    </p>
    <p style="font-size: 11px; color: #666; margin: 10px 0 0 0;">
      You're receiving this email because you have items in your cart.
    </p>
  </div>
</div>`.trim();
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Vape Cave</title></head><body style="margin:0;padding:16px;background:#f4f4f4;">${inner}</body></html>`;
}

export async function processAbandonedCarts(): Promise<{ sent: number; errors: number }> {
  if (abandonedCartJobRunning) {
    console.log('[Abandoned Cart] Job already running, skipping...');
    return { sent: 0, errors: 0 };
  }

  abandonedCartJobRunning = true;
  let sent = 0;
  let errors = 0;

  try {
    console.log('[Abandoned Cart] Starting abandoned cart check...');
    
    const abandonedCarts = await storage.getCustomersWithAbandonedCarts(ABANDONED_CART_HOURS, MAX_REMINDERS);
    console.log(`[Abandoned Cart] Found ${abandonedCarts.length} customers with abandoned carts`);

    for (const { customer, cartItems, cartValue } of abandonedCarts) {
      try {
        const reminder = await storage.getCartReminder(customer.id);
        if (reminder?.lastReminderSent) {
          const hoursSinceLastReminder = (Date.now() - new Date(reminder.lastReminderSent).getTime()) / (1000 * 60 * 60);
          if (hoursSinceLastReminder < REMINDER_INTERVAL_HOURS) {
            console.log(`[Abandoned Cart] Skipping customer ${customer.id} - reminder sent ${hoursSinceLastReminder.toFixed(1)} hours ago`);
            continue;
          }
        }

        const itemsHtml = await buildCartItemsList(cartItems);
        const template = await getAbandonedCartTemplate();
        const firstName = customer.fullName.split(' ')[0];

        const processedBody = renderTemplate(template.bodyText, {
          CUSTOMER_NAME: firstName,
          CART_TOTAL: `$${cartValue.toFixed(2)}`,
          CART_ITEMS_HTML: itemsHtml,
        });

        const cartSummaryHtml = `
<div style="background-color: #f8f8f8; border-radius: 8px; padding: 20px; margin: 20px 0;">
  <h3 style="color: #1A1A1A; margin: 0 0 15px 0; font-size: 16px;">Your Cart Items:</h3>
  ${itemsHtml}
  <div style="border-top: 1px solid #e0e0e0; padding-top: 15px; margin-top: 15px;">
    <p style="color: #1A1A1A; font-size: 17px; font-weight: bold; margin: 0;">
      Cart Total: $${cartValue.toFixed(2)}
    </p>
  </div>
</div>`;

        const ctaHtml = `
<div style="text-align: center; margin: 24px 0;">
  <a href="https://vapecavetx.com/delivery/cart" style="background: linear-gradient(135deg, #ff7100, #ff9a00); color: #000; font-weight: 700; font-size: 15px; text-decoration: none; padding: 14px 36px; border-radius: 8px; display: inline-block;">Complete Your Order</a>
</div>`;

        const subject = renderTemplate(template.subject, {
          CUSTOMER_NAME: firstName,
          CART_TOTAL: `$${cartValue.toFixed(2)}`,
          CART_ITEMS_HTML: '',
        });

        const htmlContent = masterShell(
          "Your Cart is Waiting!",
          processedBody + cartSummaryHtml,
          ctaHtml
        );

        const result = await sendEmail({
          to: customer.email,
          subject,
          html: htmlContent,
          text: `Hi ${firstName}, you left items in your cart. Complete your order at vapecavetx.com/delivery/cart. Cart Total: $${cartValue.toFixed(2)}`,
          from: 'noreply',
        });

        if (result.success) {
          const currentCount = reminder?.reminderCount || 0;
          await storage.upsertCartReminder(customer.id, {
            lastReminderSent: new Date(),
            reminderCount: currentCount + 1,
          });
          sent++;
          console.log(`[Abandoned Cart] Sent reminder to ${customer.email} (reminder #${currentCount + 1})`);
        } else {
          errors++;
          console.error(`[Abandoned Cart] Failed to send to ${customer.email}: ${result.error}`);
        }
      } catch (error) {
        errors++;
        console.error(`[Abandoned Cart] Error processing customer ${customer.id}:`, error);
      }
    }
  } catch (error) {
    console.error('[Abandoned Cart] Error in abandoned cart job:', error);
  } finally {
    abandonedCartJobRunning = false;
  }

  console.log(`[Abandoned Cart] Completed - sent: ${sent}, errors: ${errors}`);
  return { sent, errors };
}

async function buildCartItemsList(cartItems: any[]): Promise<string> {
  let html = '';
  
  for (const item of cartItems) {
    const product = await storage.getDeliveryProduct(item.productId);
    if (product) {
      const price = product.salePrice && parseFloat(product.salePrice) > 0 
        ? parseFloat(product.salePrice) 
        : parseFloat(product.price);
      const itemTotal = price * item.quantity;
      
      html += `
        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0;">
          <div>
            <p style="margin: 0; color: #1A1A1A; font-weight: 500;">${product.name}</p>
            <p style="margin: 5px 0 0 0; color: #666666; font-size: 14px;">Qty: ${item.quantity} x $${price.toFixed(2)}</p>
          </div>
          <p style="margin: 0; color: #1A1A1A; font-weight: bold;">$${itemTotal.toFixed(2)}</p>
        </div>`;
    }
  }
  
  return html;
}

let abandonedCartInterval: NodeJS.Timeout | null = null;

export function startAbandonedCartScheduler(): void {
  console.log('[Abandoned Cart] Starting scheduler...');
  
  abandonedCartInterval = setInterval(async () => {
    await processAbandonedCarts();
  }, 60 * 60 * 1000);
  
  setTimeout(async () => {
    await processAbandonedCarts();
  }, 60 * 1000);
}

export function stopAbandonedCartScheduler(): void {
  if (abandonedCartInterval) {
    clearInterval(abandonedCartInterval);
    abandonedCartInterval = null;
    console.log('[Abandoned Cart] Scheduler stopped');
  }
}
