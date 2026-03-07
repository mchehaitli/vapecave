import type { IStorage } from "./storage";

const TEMPLATES = [
  {
    templateId: "welcome_signup",
    templateName: "Signup Confirmation",
    subject: "Welcome to Vape Cave Delivery - Application Received",
    bodyText: `Hi [CUSTOMER_NAME],

Thank you for signing up for Vape Cave Smoke & Stuff delivery service!

We've received your application and our team will review it. Once your account is approved, you'll receive an email with instructions to set up your password.

What happens next:
1. Our team will verify your information and photo ID
2. You'll receive an email with approval and instructions to set up your password

In the meantime, if you have any questions, feel free to contact us at vapecavetx@gmail.com.

Thank you,
Vape Cave Smoke & Stuff Team`,
    availableVariables: "[CUSTOMER_NAME]",
  },
  {
    templateId: "welcome_approved",
    templateName: "Account Approved",
    subject: "Your Vape Cave Account Has Been Approved!",
    bodyText: `Hi [CUSTOMER_NAME],

Great news! Your Vape Cave Smoke & Stuff delivery account has been approved.

To get started, please create your password using the button below. This secure link will expire in 48 hours for your security.

Next steps:
1. Click the button below to create your password
2. Choose a secure password for your account
3. Start browsing our products and placing orders!

Once you've set your password, you can log in at vapecavetx.com/signin

Thank you for choosing Vape Cave Smoke & Stuff!`,
    availableVariables: "[CUSTOMER_NAME]",
  },
  {
    templateId: "account_rejected",
    templateName: "Account Rejected",
    subject: "Delivery Application Status - Vape Cave",
    bodyText: `Hi [CUSTOMER_NAME],

Thank you for your interest in Vape Cave Smoke & Stuff's delivery service.

Unfortunately, we are unable to approve your delivery account application at this time.

Reason: [REJECTION_REASON]

If you have questions or would like to reapply, please contact us:
- Visit: vapecavetx.com/contact
- Email: vapecavetx@gmail.com

We appreciate your understanding.

Vape Cave Smoke & Stuff Team`,
    availableVariables: "[CUSTOMER_NAME], [REJECTION_REASON]",
  },
  {
    templateId: "password_reset",
    templateName: "Password Reset",
    subject: "Password Reset - Vape Cave Delivery",
    bodyText: `Hi [CUSTOMER_NAME],

We received a request to reset your Vape Cave Smoke & Stuff delivery account password.

Your temporary password is: [TEMP_PASSWORD]

Next steps:
1. Visit vapecavetx.com/signin
2. Log in with your email and the temporary password above
3. You'll be prompted to create a new, secure password

If you didn't request a password reset, please contact us immediately at vapecavetx@gmail.com.

This temporary password will expire in 24 hours.

Vape Cave Smoke & Stuff Team`,
    availableVariables: "[CUSTOMER_NAME], [TEMP_PASSWORD]",
  },
  {
    templateId: "restock_alert",
    templateName: "Restock Alert",
    subject: "🔔 [PRODUCT_NAME] is back in stock at Vape Cave!",
    bodyText: `Hey [CUSTOMER_NAME],

You asked us to let you know — and we're delivering! The product you've been waiting for is now available:

[PRODUCT_NAME] is back and ready to order.

Stock may be limited, so don't wait — head over to our delivery portal now and grab yours before it's gone again.`,
    availableVariables: "[CUSTOMER_NAME], [PRODUCT_NAME]",
  },
  {
    templateId: "abandoned_cart",
    templateName: "Abandoned Cart Reminder",
    subject: "Your cart is waiting! Complete your order at Vape Cave",
    bodyText: `Hi [CUSTOMER_NAME],

We noticed you left some items in your cart. Don't worry — we've saved them for you!

Complete your order now and get your items delivered to your door. Stock is limited, so grab yours before it's gone.

Questions? Just reply to this email and we'll be happy to help.`,
    availableVariables: "[CUSTOMER_NAME], [CART_TOTAL], [CART_ITEMS_HTML] (auto-generated)",
  },
  {
    templateId: "order_confirmation",
    templateName: "Order Confirmation",
    subject: "Order #[ORDER_ID] Confirmed - Vape Cave Smoke & Stuff",
    bodyText: `Hi [CUSTOMER_NAME],

[ORDER_INTRO]

If you have any questions, reply to this email or visit vapecavetx.com.

Thank you for choosing Vape Cave Smoke & Stuff!`,
    availableVariables: "[CUSTOMER_NAME], [ORDER_ID], [ORDER_INTRO] (auto), [ORDER_TOTAL]",
  },
  {
    templateId: "order_status_update",
    templateName: "Order Status Update",
    subject: "Order #[ORDER_ID] Update - [STATUS_TITLE]",
    bodyText: `Hi [CUSTOMER_NAME],

[STATUS_MESSAGE]

Thank you for choosing Vape Cave Smoke & Stuff!`,
    availableVariables: "[CUSTOMER_NAME], [ORDER_ID], [STATUS_TITLE] (auto), [STATUS_MESSAGE] (auto)",
  },
  {
    templateId: "order_ready_for_pickup",
    templateName: "Order Ready for Pickup",
    subject: "Your Order #[ORDER_ID] is Ready for Pickup! 🛍️",
    bodyText: `Hi [CUSTOMER_NAME],

Great news — your order is ready and waiting for you at the register!

Order #[ORDER_ID] | Total: $[ORDER_TOTAL]

Pickup Location:
Vape Cave Smoke & Stuff
6958 Main St #200
Frisco, TX 75033
Phone: (469) 294-0061

Please head over at your convenience during store hours and let the team at the register know you have an online order to pick up.

Don't forget to bring a valid photo ID — it's required for age verification on all tobacco and nicotine products.

If you have any questions, reply to this email or call us at (469) 294-0061.

Thank you for choosing Vape Cave Smoke & Stuff!`,
    availableVariables: "[CUSTOMER_NAME], [ORDER_ID], [ORDER_TOTAL]",
  },
];

export async function seedEmailTemplates(storage: IStorage): Promise<void> {
  try {
    for (const template of TEMPLATES) {
      await storage.upsertEmailTemplate(template);
    }
    console.log("[Email Templates] Seeded", TEMPLATES.length, "email templates");
  } catch (error) {
    console.error("[Email Templates] Error seeding templates:", error);
  }
}
