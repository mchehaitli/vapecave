import { storage } from './storage';
import { sendEmail } from './email-service';

const ABANDONED_CART_HOURS = 24; // Hours before cart is considered abandoned
const MAX_REMINDERS = 2; // Maximum number of reminder emails per customer
const REMINDER_INTERVAL_HOURS = 48; // Minimum hours between reminders

let abandonedCartJobRunning = false;

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
        // Check if enough time has passed since last reminder
        const reminder = await storage.getCartReminder(customer.id);
        if (reminder?.lastReminderSent) {
          const hoursSinceLastReminder = (Date.now() - new Date(reminder.lastReminderSent).getTime()) / (1000 * 60 * 60);
          if (hoursSinceLastReminder < REMINDER_INTERVAL_HOURS) {
            console.log(`[Abandoned Cart] Skipping customer ${customer.id} - reminder sent ${hoursSinceLastReminder.toFixed(1)} hours ago`);
            continue;
          }
        }

        // Build email content
        const itemsList = await buildCartItemsList(cartItems);
        
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Don't Forget Your Cart!</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="background: linear-gradient(135deg, #FF7100 0%, #FF8C33 100%); padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Vape Cave Smoke & Stuff</h1>
        <p style="color: #fff3e0; margin: 10px 0 0 0; font-size: 14px;">Frisco, TX</p>
      </td>
    </tr>
    
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #1A1A1A; margin: 0 0 20px 0; font-size: 24px;">Hi ${customer.fullName.split(' ')[0]}!</h2>
        
        <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
          We noticed you left some items in your cart. Don't worry, we've saved them for you!
        </p>
        
        <div style="background-color: #f8f8f8; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1A1A1A; margin: 0 0 15px 0; font-size: 18px;">Your Cart Items:</h3>
          ${itemsList}
          <div style="border-top: 1px solid #e0e0e0; padding-top: 15px; margin-top: 15px;">
            <p style="color: #1A1A1A; font-size: 18px; font-weight: bold; margin: 0;">
              Cart Total: $${cartValue.toFixed(2)}
            </p>
          </div>
        </div>
        
        <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 20px 0;">
          Complete your order now and get your items delivered to your door!
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://vapecavefrisco.com/delivery/cart" 
             style="display: inline-block; background-color: #FF7100; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-size: 16px; font-weight: bold;">
            Complete Your Order
          </a>
        </div>
        
        <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
          Questions? Reply to this email or give us a call. We're here to help!
        </p>
      </td>
    </tr>
    
    <tr>
      <td style="background-color: #1A1A1A; padding: 25px 30px; text-align: center;">
        <p style="color: #999999; font-size: 12px; margin: 0;">
          Vape Cave Smoke & Stuff | Frisco, TX<br>
          <a href="https://vapecavefrisco.com" style="color: #FF7100; text-decoration: none;">vapecavefrisco.com</a>
        </p>
        <p style="color: #666666; font-size: 11px; margin: 15px 0 0 0;">
          You're receiving this email because you have items in your cart.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

        // Send the email
        const result = await sendEmail({
          to: customer.email,
          subject: 'Your cart is waiting! Complete your order',
          html: emailHtml,
          from: 'noreply',
        });

        if (result.success) {
          // Update reminder tracking
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
  
  // Run every hour
  abandonedCartInterval = setInterval(async () => {
    await processAbandonedCarts();
  }, 60 * 60 * 1000); // Every hour
  
  // Run once on startup after a delay
  setTimeout(async () => {
    await processAbandonedCarts();
  }, 60 * 1000); // After 1 minute
}

export function stopAbandonedCartScheduler(): void {
  if (abandonedCartInterval) {
    clearInterval(abandonedCartInterval);
    abandonedCartInterval = null;
    console.log('[Abandoned Cart] Scheduler stopped');
  }
}
