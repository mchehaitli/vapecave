import { getUncachableGmailClient } from './gmail-client';
import * as dotenv from 'dotenv';
import { storage } from './storage';

dotenv.config();

// Email alias configuration for different types of communications
// These aliases should be configured in your Gmail/Google Workspace settings
export const EMAIL_ALIASES = {
  // Welcome and onboarding emails
  welcome: '"Vape Cave Smoke & Stuff" <welcome@vapecavetx.com>',
  // Account verification and password reset emails
  verify: '"Vape Cave Smoke & Stuff" <verify@vapecavetx.com>',
  // Order confirmations, receipts, and billing-related emails
  billing: '"Vape Cave Smoke & Stuff" <billing@vapecavetx.com>',
  // Delivery status updates and driver notifications
  delivery: '"Vape Cave Smoke & Stuff Delivery" <delivery@vapecavetx.com>',
  // Contact form notifications (internal)
  contact: '"Vape Cave Smoke & Stuff Contact" <contact@vapecavetx.com>',
  // Support-related emails (rejections, issues)
  support: '"Vape Cave Smoke & Stuff Support" <support@vapecavetx.com>',
  // Newsletter and subscription emails
  join: '"Vape Cave Smoke & Stuff" <join@vapecavetx.com>',
  // Automated emails that don't expect replies
  noreply: '"Vape Cave Smoke & Stuff" <noreply@vapecavetx.com>',
  // Fallback for any other emails
  default: '"Vape Cave Smoke & Stuff" <noreply@vapecavetx.com>',
} as const;

// Interface for contact form data
export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// Interface for newsletter subscription data
export interface NewsletterSubscription {
  email: string;
}

// Interface for delivery signup confirmation
export interface DeliverySignupData {
  email: string;
  fullName: string;
}

// Interface for delivery approval email with password setup link
export interface DeliveryApprovalData {
  email: string;
  fullName: string;
  passwordSetupToken: string;
}

// Interface for password reset email
export interface PasswordResetData {
  email: string;
  fullName: string;
  temporaryPassword: string;
}

// Interface for order status update email
export interface OrderStatusEmailData {
  email: string;
  fullName: string;
  orderId: number;
  status: string;
  deliveryAddress: string;
  total: string;
  deliveryDate?: string;
  deliveryTime?: string;
  refundAmount?: string;
  refundReason?: string;
}

// Interface for order confirmation email to customer
export interface OrderConfirmationEmailData {
  email: string;
  fullName: string;
  orderId: number;
  deliveryAddress: string;
  total: string;
  subtotal: string;
  tax: string;
  deliveryFee: string;
  discount?: string;
  paymentMethod?: string;
  deliveryDate?: string;
  deliveryTime?: string;
  items: Array<{ name: string; quantity: number; price: string }>;
  notes?: string;
  isReplacement?: boolean;
  fulfillmentMode?: string;
}

// Interface for pickup-ready email
export interface PickupReadyEmailData {
  email: string;
  fullName: string;
  orderId: number;
  total: string;
  items: Array<{ name: string; quantity: number; price: string }>;
}

// Interface for driver notification email
export interface DriverNotificationEmailData {
  driverEmail: string;
  orderId: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress: string;
  total: string;
  subtotal: string;
  tax: string;
  deliveryFee: string;
  discount?: string;
  paymentMethod: string;
  deliveryDate?: string;
  deliveryTime?: string;
  notes?: string;
  items: Array<{ name: string; quantity: number; price: string }>;
  fulfillmentMode?: string;
}

// Interface for delivery rejection email
export interface DeliveryRejectionData {
  email: string;
  fullName: string;
  rejectionReason: string;
}

// Encode a subject line using RFC 2047 base64 word encoding so that
// emojis and other non-ASCII characters survive transit through email servers.
function encodeSubject(subject: string): string {
  return '=?UTF-8?B?' + Buffer.from(subject, 'utf8').toString('base64') + '?=';
}

// Helper function to create RFC 2822 formatted email.
// Each MIME part uses Content-Transfer-Encoding: base64 so that multi-byte
// UTF-8 characters (including emojis) are never mangled by intermediate MTAs.
function createEmailMessage(to: string, from: string, subject: string, textContent: string, htmlContent: string): string {
  const encodedSubject = encodeSubject(subject);
  const encodedText = Buffer.from(textContent, 'utf8').toString('base64');
  const encodedHtml = Buffer.from(htmlContent, 'utf8').toString('base64');

  const messageParts = [
    `To: ${to}`,
    `From: ${from}`,
    `Subject: ${encodedSubject}`,
    'MIME-Version: 1.0',
    'Content-Type: multipart/alternative; boundary="boundary"',
    '',
    '--boundary',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    encodedText,
    '',
    '--boundary',
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    encodedHtml,
    '',
    '--boundary--'
  ];
  
  return messageParts.join('\r\n');
}

// Helper function to encode email message for Gmail API
function encodeMessage(message: string): string {
  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Replace [PLACEHOLDER] tokens in a template string with actual values.
 * Also converts newlines to <br> tags for HTML output.
 */
function renderTemplate(bodyText: string, variables: Record<string, string>): string {
  let result = bodyText;
  for (const [key, value] of Object.entries(variables)) {
    result = result.split(`[${key}]`).join(value);
  }
  return result;
}

/**
 * Master HTML email shell — orange header, white content card, optional CTA, dark footer.
 */
function masterHtmlShell(params: {
  headerTitle: string;
  bodyHtml: string;
  ctaHtml?: string;
  footerNote?: string;
}): string {
  const inner = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #1a1a1a; color: #f5f5f5; border-radius: 12px; overflow: hidden;">
  <div style="background: linear-gradient(135deg, #ff7100, #ff9a00); padding: 28px 24px; text-align: center;">
    <h1 style="margin: 0; font-size: 24px; color: #000; font-weight: 800;">${params.headerTitle}</h1>
  </div>
  <div style="background: #ffffff; padding: 32px 28px; color: #333;">
    <div style="font-size: 15px; line-height: 1.7; white-space: pre-line;">${params.bodyHtml}</div>
    ${params.ctaHtml ? `<div style="margin-top: 28px;">${params.ctaHtml}</div>` : ''}
  </div>
  <div style="padding: 20px 24px; text-align: center;">
    <p style="font-size: 12px; color: #888; margin: 0;">
      ${params.footerNote || 'Vape Cave Smoke &amp; Stuff · Frisco, TX · <a href="https://vapecavetx.com" style="color: #ff7100; text-decoration: none;">vapecavetx.com</a>'}
    </p>
  </div>
</div>`.trim();

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Vape Cave</title></head><body style="margin:0;padding:16px;background:#f4f4f4;">${inner}</body></html>`;
}

/**
 * Fetch a template from the DB; if unavailable, return the provided fallback.
 */
async function getTemplate(
  templateId: string,
  fallback: { subject: string; bodyText: string }
): Promise<{ subject: string; bodyText: string }> {
  try {
    const tpl = await storage.getEmailTemplate(templateId);
    if (tpl) return { subject: tpl.subject, bodyText: tpl.bodyText };
  } catch {
    // DB unavailable — use fallback silently
  }
  return fallback;
}

/**
 * Generic email sending function
 */
export const sendEmail = async (options: { 
  to: string; 
  subject: string; 
  html: string; 
  text?: string;
  from?: keyof typeof EMAIL_ALIASES;
}): Promise<{ success: boolean; error?: string }> => {
  try {
    const gmail = await getUncachableGmailClient();
    
    const textContent = options.text || options.html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const fromAddress = EMAIL_ALIASES[options.from || 'default'];
    
    const emailMessage = createEmailMessage(
      options.to,
      fromAddress,
      options.subject,
      textContent,
      options.html
    );
    
    const encodedMessage = encodeMessage(emailMessage);
    
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });
    
    console.log('Email sent via Gmail:', result.data.id);
    return { success: true };
  } catch (error: any) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
};

/**
 * Send an email from the contact form
 */
export const sendContactEmail = async (data: ContactFormData): Promise<{ success: boolean; message: string; }> => {
  try {
    const gmail = await getUncachableGmailClient();
    
    const textContent = `
Name: ${data.name}
Email: ${data.email}
Subject: ${data.subject}

Message:
${data.message}
    `.trim();
    
    const htmlContent = `
<div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
  <h2 style="color: #FF6B00;">New Contact Form Submission</h2>
  <p><strong>Name:</strong> ${data.name}</p>
  <p><strong>Email:</strong> ${data.email}</p>
  <p><strong>Subject:</strong> ${data.subject}</p>
  <h3 style="margin-top: 20px;">Message:</h3>
  <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
    ${data.message.replace(/\n/g, '<br>')}
  </div>
  <p style="margin-top: 20px; color: #666;">This email was sent from the contact form on vapecavetx.com</p>
</div>
    `.trim();
    
    const emailMessage = createEmailMessage(
      'vapecavetx@gmail.com',
      EMAIL_ALIASES.contact,
      `Contact Form Submission: ${data.subject}`,
      textContent,
      htmlContent
    );
    
    const encodedMessage = encodeMessage(emailMessage);
    
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });
    
    console.log('Contact email sent via Gmail:', result.data.id);
    
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Error sending contact email:', error);
    return { success: false, message: 'Failed to send email' };
  }
};

/**
 * Send a confirmation email for newsletter subscription
 */
export const sendNewsletterSubscriptionEmail = async (data: NewsletterSubscription): Promise<{ success: boolean; message: string; }> => {
  try {
    const gmail = await getUncachableGmailClient();
    
    const textContent = `
New Newsletter Subscription
Email: ${data.email}

This user has subscribed to receive updates from Vape Cave Smoke & Stuff.
    `.trim();
    
    const htmlContent = `
<div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
  <h2 style="color: #FF6B00;">New Newsletter Subscription</h2>
  <p><strong>Email:</strong> ${data.email}</p>
  <p style="margin-top: 20px;">This user has subscribed to receive updates from Vape Cave Smoke & Stuff.</p>
  <p style="margin-top: 20px; color: #666;">This email was sent from the newsletter subscription form on vapecavetx.com</p>
</div>
    `.trim();
    
    const emailMessage = createEmailMessage(
      'vapecavetx@gmail.com',
      EMAIL_ALIASES.join,
      'New Newsletter Subscription',
      textContent,
      htmlContent
    );
    
    const encodedMessage = encodeMessage(emailMessage);
    
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });
    
    console.log('Newsletter subscription email sent via Gmail:', result.data.id);
    
    return { success: true, message: 'Subscription email sent successfully' };
  } catch (error) {
    console.error('Error sending newsletter subscription email:', error);
    return { success: false, message: 'Failed to send subscription email' };
  }
};

/**
 * Send a signup confirmation email to delivery customer
 */
export const sendDeliverySignupConfirmation = async (data: DeliverySignupData): Promise<{ success: boolean; message: string; }> => {
  try {
    const fallback = {
      subject: "Welcome to Vape Cave Delivery - Application Received",
      bodyText: `Hi [CUSTOMER_NAME],\n\nThank you for signing up for Vape Cave Smoke & Stuff delivery service!\n\nWe've received your application and our team will review it. Once your account is approved, you'll receive an email with instructions to set up your password.\n\nWhat happens next:\n1. Our team will verify your information and photo ID\n2. You'll receive an email with approval and instructions to set up your password\n\nIn the meantime, if you have any questions, feel free to contact us at vapecavetx@gmail.com.\n\nThank you,\nVape Cave Smoke & Stuff Team`,
    };
    const template = await getTemplate("welcome_signup", fallback);
    const processedBody = renderTemplate(template.bodyText, { CUSTOMER_NAME: data.fullName });
    const subject = renderTemplate(template.subject, { CUSTOMER_NAME: data.fullName });

    const htmlContent = masterHtmlShell({
      headerTitle: "Welcome to Vape Cave Delivery!",
      bodyHtml: processedBody,
    });

    const result = await sendEmail({ to: data.email, subject, html: htmlContent, from: 'welcome' });
    if (result.success) {
      return { success: true, message: 'Signup confirmation email sent successfully' };
    }
    return { success: false, message: result.error || 'Failed to send email' };
  } catch (error) {
    console.error('Error sending delivery signup confirmation:', error);
    return { success: false, message: 'Failed to send signup confirmation email' };
  }
};

/**
 * Send approval email with password setup link
 */
export const sendDeliveryApprovalEmail = async (data: DeliveryApprovalData): Promise<{ success: boolean; message: string; }> => {
  try {
    const setupLink = `https://vapecavetx.com/delivery/set-password?token=${data.passwordSetupToken}`;
    const fallback = {
      subject: "Your Vape Cave Account Has Been Approved!",
      bodyText: `Hi [CUSTOMER_NAME],\n\nGreat news! Your Vape Cave Smoke & Stuff delivery account has been approved.\n\nTo get started, please create your password using the button below. This secure link will expire in 48 hours for your security.\n\nNext steps:\n1. Click the button below to create your password\n2. Choose a secure password for your account\n3. Start browsing our products and placing orders!\n\nOnce you've set your password, you can log in at vapecavetx.com/signin\n\nThank you for choosing Vape Cave Smoke & Stuff!`,
    };
    const template = await getTemplate("welcome_approved", fallback);
    const processedBody = renderTemplate(template.bodyText, { CUSTOMER_NAME: data.fullName });
    const subject = renderTemplate(template.subject, { CUSTOMER_NAME: data.fullName });

    const ctaHtml = `
      <div style="text-align: center; margin: 24px 0;">
        <a href="${setupLink}" style="background: linear-gradient(135deg, #ff7100, #ff9a00); color: #000; font-weight: 700; font-size: 15px; text-decoration: none; padding: 14px 32px; border-radius: 8px; display: inline-block;">Create Your Password</a>
      </div>
      <p style="font-size: 13px; color: #888; text-align: center;">If the button doesn't work, copy and paste: <a href="${setupLink}" style="color: #ff7100;">${setupLink}</a></p>
    `;

    const htmlContent = masterHtmlShell({
      headerTitle: "🎉 Account Approved!",
      bodyHtml: processedBody,
      ctaHtml,
    });

    const result = await sendEmail({ to: data.email, subject, html: htmlContent, from: 'welcome' });
    if (result.success) {
      return { success: true, message: 'Approval email sent successfully' };
    }
    return { success: false, message: result.error || 'Failed to send email' };
  } catch (error) {
    console.error('Error sending delivery approval email:', error);
    return { success: false, message: 'Failed to send approval email' };
  }
};

/**
 * Send delivery rejection email
 */
export const sendDeliveryRejectionEmail = async (data: DeliveryRejectionData): Promise<{ success: boolean; message: string; }> => {
  try {
    const fallback = {
      subject: "Delivery Application Status - Vape Cave",
      bodyText: `Hi [CUSTOMER_NAME],\n\nThank you for your interest in Vape Cave Smoke & Stuff's delivery service.\n\nUnfortunately, we are unable to approve your delivery account application at this time.\n\nReason: [REJECTION_REASON]\n\nIf you have questions or would like to reapply, please contact us:\n- Visit: vapecavetx.com/contact\n- Email: vapecavetx@gmail.com\n\nWe appreciate your understanding.\n\nVape Cave Smoke & Stuff Team`,
    };
    const template = await getTemplate("account_rejected", fallback);
    const processedBody = renderTemplate(template.bodyText, {
      CUSTOMER_NAME: data.fullName,
      REJECTION_REASON: data.rejectionReason,
    });
    const subject = renderTemplate(template.subject, { CUSTOMER_NAME: data.fullName });

    const htmlContent = masterHtmlShell({
      headerTitle: "Delivery Application Status",
      bodyHtml: processedBody,
    });

    const result = await sendEmail({ to: data.email, subject, html: htmlContent, from: 'support' });
    if (result.success) {
      return { success: true, message: 'Rejection email sent successfully' };
    }
    return { success: false, message: result.error || 'Failed to send email' };
  } catch (error) {
    console.error('Error sending delivery rejection email:', error);
    return { success: false, message: 'Failed to send rejection email' };
  }
};

/**
 * Send password reset email with temporary password
 */
export const sendPasswordResetEmail = async (data: PasswordResetData): Promise<{ success: boolean; message: string; }> => {
  try {
    const fallback = {
      subject: "Password Reset - Vape Cave Delivery",
      bodyText: `Hi [CUSTOMER_NAME],\n\nWe received a request to reset your Vape Cave Smoke & Stuff delivery account password.\n\nYour temporary password is: [TEMP_PASSWORD]\n\nNext steps:\n1. Visit vapecavetx.com/signin\n2. Log in with your email and the temporary password above\n3. You'll be prompted to create a new, secure password\n\nIf you didn't request a password reset, please contact us immediately at vapecavetx@gmail.com.\n\nThis temporary password will expire in 24 hours.\n\nVape Cave Smoke & Stuff Team`,
    };
    const template = await getTemplate("password_reset", fallback);
    const processedBody = renderTemplate(template.bodyText, {
      CUSTOMER_NAME: data.fullName,
      TEMP_PASSWORD: data.temporaryPassword,
    });
    const subject = renderTemplate(template.subject, { CUSTOMER_NAME: data.fullName });

    const ctaHtml = `
      <div style="text-align: center; margin: 24px 0;">
        <a href="https://vapecavetx.com/signin" style="background: linear-gradient(135deg, #ff7100, #ff9a00); color: #000; font-weight: 700; font-size: 15px; text-decoration: none; padding: 14px 32px; border-radius: 8px; display: inline-block;">Log In Now</a>
      </div>
    `;

    const htmlContent = masterHtmlShell({
      headerTitle: "Password Reset Request",
      bodyHtml: processedBody,
      ctaHtml,
    });

    const result = await sendEmail({ to: data.email, subject, html: htmlContent, from: 'verify' });
    if (result.success) {
      return { success: true, message: 'Password reset email sent successfully' };
    }
    return { success: false, message: result.error || 'Failed to send email' };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, message: 'Failed to send password reset email' };
  }
};

/**
 * Send order status update email
 */
export const sendOrderStatusEmail = async (data: OrderStatusEmailData): Promise<{ success: boolean; message: string; }> => {
  const statusMessages: Record<string, { title: string; message: string }> = {
    confirmed:         { title: 'Order Confirmed',           message: 'Your order has been confirmed and is being prepared.' },
    preparing:         { title: 'Order Being Prepared',      message: 'Your order is currently being prepared.' },
    out_for_delivery:  { title: 'Out for Delivery',          message: 'Your order is on its way!' },
    delivered:         { title: 'Order Delivered',           message: 'Your order has been delivered. Enjoy!' },
    cancelled:         { title: 'Order Cancelled',           message: 'Your order has been cancelled.' },
    refunded:          { title: 'Refund Processed',          message: 'A refund has been processed for your order.' },
    ready_for_pickup:  { title: 'Order Ready for Pickup',    message: 'Your order is ready! Please come pick it up at the register. Don\'t forget to bring a valid photo ID.' },
    picked_up:         { title: 'Order Picked Up',           message: 'Your order has been picked up. Thank you for shopping with us!' },
  };
  const statusInfo = statusMessages[data.status] || {
    title: 'Order Status Update',
    message: `Your order status has been updated to: ${data.status}`,
  };

  const fallback = {
    subject: `Order #[ORDER_ID] Update - [STATUS_TITLE]`,
    bodyText: `Hi [CUSTOMER_NAME],\n\n[STATUS_MESSAGE]\n\nThank you for choosing Vape Cave Smoke & Stuff!`,
  };
  const template = await getTemplate('order_status_update', fallback);
  const processedBody = renderTemplate(template.bodyText, {
    CUSTOMER_NAME: data.fullName,
    ORDER_ID:      String(data.orderId),
    STATUS_TITLE:  statusInfo.title,
    STATUS_MESSAGE: statusInfo.message,
  });
  const subject = renderTemplate(template.subject, {
    ORDER_ID:     String(data.orderId),
    STATUS_TITLE: statusInfo.title,
  });

  const orderDetailsHtml = `
<div style="background:#f5f5f5;padding:18px 20px;border-radius:8px;margin:20px 0;font-size:14px;color:#333;">
  <strong style="display:block;margin-bottom:10px;font-size:15px;color:#222;">Order #${data.orderId}</strong>
  <div><strong>Delivery Address:</strong> ${data.deliveryAddress}</div>
  <div><strong>Total:</strong> $${data.total}</div>
  ${data.deliveryDate ? `<div><strong>Delivery Date:</strong> ${data.deliveryDate}</div>` : ''}
  ${data.deliveryTime ? `<div><strong>Delivery Time:</strong> ${data.deliveryTime}</div>` : ''}
  ${data.refundAmount ? `<div><strong>Refund Amount:</strong> $${data.refundAmount}</div>` : ''}
  ${data.refundReason ? `<div><strong>Refund Reason:</strong> ${data.refundReason}</div>` : ''}
</div>`;

  const ctaHtml = `
<div style="text-align:center;margin:24px 0;">
  <a href="https://vapecavetx.com/delivery/orders" style="background:linear-gradient(135deg,#ff7100,#ff9a00);color:#000;font-weight:700;font-size:15px;text-decoration:none;padding:14px 36px;border-radius:8px;display:inline-block;">View Order</a>
</div>`;

  const htmlContent = masterHtmlShell({
    headerTitle: statusInfo.title,
    bodyHtml: processedBody + orderDetailsHtml,
    ctaHtml,
  });

  const textContent = `Hi ${data.fullName},\n\n${statusInfo.message}\n\nOrder #${data.orderId}\nAddress: ${data.deliveryAddress}\nTotal: $${data.total}\n\nVape Cave Smoke & Stuff Team`;

  return sendEmail({ to: data.email, subject, html: htmlContent, text: textContent, from: 'delivery' });
};

/**
 * Send order confirmation email to customer
 */
export const sendOrderConfirmationEmail = async (data: OrderConfirmationEmailData): Promise<{ success: boolean; message: string; }> => {
  const fallback = {
    subject: `Order #[ORDER_ID] Confirmed - Vape Cave Smoke & Stuff`,
    bodyText: `Hi [CUSTOMER_NAME],\n\n[ORDER_INTRO]\n\nIf you have any questions, reply to this email or visit vapecavetx.com.\n\nThank you for choosing Vape Cave Smoke & Stuff!`,
  };
  const template = await getTemplate('order_confirmation', fallback);
  const orderIntro = data.isReplacement
    ? 'Your replacement order has been confirmed and is being prepared.'
    : "Thank you for your order! We're preparing it now.";
  const processedBody = renderTemplate(template.bodyText, {
    CUSTOMER_NAME: data.fullName,
    ORDER_ID:      String(data.orderId),
    ORDER_INTRO:   orderIntro,
    ORDER_TOTAL:   data.total,
  });
  const subject = renderTemplate(template.subject, { ORDER_ID: String(data.orderId) });

  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding:9px 10px;border-bottom:1px solid #f0f0f0;">${item.name}</td>
      <td style="padding:9px 10px;border-bottom:1px solid #f0f0f0;text-align:center;">${item.quantity}</td>
      <td style="padding:9px 10px;border-bottom:1px solid #f0f0f0;text-align:right;">$${item.price}</td>
    </tr>`).join('');

  const isPickup = data.fulfillmentMode === 'pickup';
  const orderDetailsHtml = `
<div style="background:#f5f5f5;padding:18px 20px;border-radius:8px;margin:20px 0;font-size:14px;color:#333;">
  <strong style="display:block;margin-bottom:10px;font-size:15px;color:#222;">Order #${data.orderId}</strong>
  ${isPickup
    ? `<div><strong>Pickup Location:</strong> Vape Cave Smoke &amp; Stuff — 6958 Main St #200, Frisco, TX 75033</div>
  <div style="margin-top:6px;padding:10px;background:#fff8e1;border-left:3px solid #ff9a00;border-radius:4px;color:#555;">
    Your order will be ready within 1 hour. Please pick up at the register and bring a valid photo ID.
  </div>`
    : `<div><strong>Delivery Address:</strong> ${data.deliveryAddress}</div>
  ${data.deliveryDate ? `<div><strong>Delivery Date:</strong> ${data.deliveryDate}</div>` : ''}
  ${data.deliveryTime ? `<div><strong>Delivery Time:</strong> ${data.deliveryTime}</div>` : ''}`
  }
  <div style="margin-top:6px;"><strong>Payment:</strong> ${data.paymentMethod === 'credit_card' ? 'Card Payment' : isPickup ? 'Pay in Store' : 'Pay on Delivery'}</div>
  ${data.notes ? `<div style="margin-top:8px;padding-top:8px;border-top:1px solid #ddd;"><strong>Special Instructions:</strong> ${data.notes}</div>` : ''}
</div>
<table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px;">
  <thead>
    <tr style="background:#f0f0f0;">
      <th style="padding:9px 10px;text-align:left;">Item</th>
      <th style="padding:9px 10px;text-align:center;">Qty</th>
      <th style="padding:9px 10px;text-align:right;">Price</th>
    </tr>
  </thead>
  <tbody>${itemsHtml}</tbody>
</table>
<div style="text-align:right;font-size:14px;color:#333;padding:0 4px;">
  <div>Subtotal: $${data.subtotal}</div>
  <div>${data.deliveryFee !== '0.00' ? `Delivery Fee: $${data.deliveryFee}` : 'Delivery: FREE'}</div>
  <div>Tax: $${data.tax}</div>
  ${data.discount ? `<div style="color:#4CAF50;">Discount: -$${data.discount}</div>` : ''}
  <div style="font-size:17px;font-weight:700;color:#ff7100;margin-top:6px;">Total: $${data.total}</div>
</div>`;

  const ctaHtml = `
<div style="text-align:center;margin:24px 0;">
  <a href="https://vapecavetx.com/delivery/orders" style="background:linear-gradient(135deg,#ff7100,#ff9a00);color:#000;font-weight:700;font-size:15px;text-decoration:none;padding:14px 36px;border-radius:8px;display:inline-block;">View Your Order</a>
</div>`;

  const htmlContent = masterHtmlShell({
    headerTitle: data.isReplacement ? 'Replacement Order Confirmed!' : 'Order Confirmed!',
    bodyHtml: processedBody + orderDetailsHtml,
    ctaHtml,
  });

  const textContent = `Hi ${data.fullName},\n\n${orderIntro}\n\nOrder #${data.orderId} | Total: $${data.total}\n\nVape Cave Smoke & Stuff Team`;

  return sendEmail({ to: data.email, subject, html: htmlContent, text: textContent, from: 'billing' });
};

/**
 * Send pickup-ready notification email to customer
 */
export const sendPickupReadyEmail = async (data: PickupReadyEmailData): Promise<{ success: boolean; message: string; }> => {
  const fallback = {
    subject: `Your Order #[ORDER_ID] is Ready for Pickup! 🛍️`,
    bodyText: `Hi [CUSTOMER_NAME],\n\nGreat news — your order is ready and waiting for you at the register!\n\nOrder #[ORDER_ID] | Total: $[ORDER_TOTAL]\n\nPickup Location:\nVape Cave Smoke & Stuff\n6958 Main St #200\nFrisco, TX 75033\nPhone: (469) 294-0061\n\nPlease bring a valid photo ID for age verification.\n\nThank you for choosing Vape Cave Smoke & Stuff!`,
  };
  const template = await getTemplate('order_ready_for_pickup', fallback);
  const processedBody = renderTemplate(template.bodyText, {
    CUSTOMER_NAME: data.fullName,
    ORDER_ID:      String(data.orderId),
    ORDER_TOTAL:   data.total,
  });
  const subject = renderTemplate(template.subject, { ORDER_ID: String(data.orderId) });

  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding:9px 10px;border-bottom:1px solid #f0f0f0;">${item.name}</td>
      <td style="padding:9px 10px;border-bottom:1px solid #f0f0f0;text-align:center;">${item.quantity}</td>
      <td style="padding:9px 10px;border-bottom:1px solid #f0f0f0;text-align:right;">$${item.price}</td>
    </tr>`).join('');

  const storeInfoHtml = `
<div style="background:#e8f5e9;border-left:4px solid #4caf50;padding:16px 20px;border-radius:6px;margin:20px 0;font-size:14px;color:#333;">
  <strong style="display:block;font-size:15px;color:#2e7d32;margin-bottom:8px;">📍 Pickup Location</strong>
  <div><strong>Vape Cave Smoke &amp; Stuff</strong></div>
  <div>6958 Main St #200, Frisco, TX 75033</div>
  <div>Phone: <a href="tel:4692940061" style="color:#2e7d32;">(469) 294-0061</a></div>
  <div style="margin-top:10px;padding:8px;background:#fff;border-radius:4px;color:#555;">
    ⚠️ <strong>Reminder:</strong> Please bring a valid government-issued photo ID — required for all tobacco &amp; nicotine purchases.
  </div>
</div>
<table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px;">
  <thead>
    <tr style="background:#f0f0f0;">
      <th style="padding:9px 10px;text-align:left;">Item</th>
      <th style="padding:9px 10px;text-align:center;">Qty</th>
      <th style="padding:9px 10px;text-align:right;">Price</th>
    </tr>
  </thead>
  <tbody>${itemsHtml}</tbody>
</table>
<div style="text-align:right;font-size:15px;font-weight:700;color:#ff7100;">Total: $${data.total}</div>`;

  const ctaHtml = `
<div style="text-align:center;margin:24px 0;">
  <a href="https://vapecavetx.com/delivery/orders" style="background:linear-gradient(135deg,#ff7100,#ff9a00);color:#000;font-weight:700;font-size:15px;text-decoration:none;padding:14px 36px;border-radius:8px;display:inline-block;">View Your Order</a>
</div>`;

  const htmlContent = masterHtmlShell({
    headerTitle: '🛍️ Your Order is Ready!',
    bodyHtml: processedBody + storeInfoHtml,
    ctaHtml,
  });

  const textContent = `Hi ${data.fullName},\n\nYour order #${data.orderId} is ready for pickup!\n\nPickup at: Vape Cave Smoke & Stuff, 6958 Main St #200, Frisco, TX 75033\nPhone: (469) 294-0061\nTotal: $${data.total}\n\nBring a valid photo ID.\n\nVape Cave Smoke & Stuff Team`;

  return sendEmail({ to: data.email, subject, html: htmlContent, text: textContent, from: 'delivery' });
};

/**
 * Send driver notification email
 */
export const sendDriverNotificationEmail = async (data: DriverNotificationEmailData): Promise<{ success: boolean; message: string; }> => {
  try {
    const gmail = await getUncachableGmailClient();

    const itemsText = data.items.map(item =>
      `${item.name} x${item.quantity} - $${item.price}`
    ).join('\n');

    const itemsHtml = data.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #333;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #333; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #333; text-align: right;">$${item.price}</td>
      </tr>
    `).join('');

    const textContent = `
NEW ORDER #${data.orderId}

Customer: ${data.customerName}
Phone: ${data.customerPhone}
Email: ${data.customerEmail}
Address: ${data.deliveryAddress}
${data.deliveryDate ? `Date: ${data.deliveryDate}` : ''}
${data.deliveryTime ? `Time: ${data.deliveryTime}` : ''}
Payment: ${data.paymentMethod === 'credit_card' ? 'Card Payment' : data.fulfillmentMode === 'pickup' ? 'Pay in Store' : 'Pay on Delivery'}

Items:
${itemsText}

---
Subtotal:     $${data.subtotal}
Delivery Fee: $${data.deliveryFee}
Tax (8.25%):  $${data.tax}
${data.discount ? `Discount:     -$${data.discount}` : ''}
AMOUNT DUE:   $${data.total}
---
${data.notes ? `\nNotes: ${data.notes}` : ''}
    `.trim();

    const htmlContent = `
<div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; background-color: #1a1a1a; color: #f5f5f5; border-radius: 10px;">
  <div style="background: linear-gradient(135deg, #ff7100, #ff9a00); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="margin: 0; color: #000;">🚗 NEW DELIVERY ORDER #${data.orderId}</h2>
    <p style="margin: 5px 0 0; color: #1a1a1a; font-weight: bold;">Total: $${data.total} · ${data.paymentMethod === 'credit_card' ? 'Card Payment' : data.fulfillmentMode === 'pickup' ? 'Pay in Store' : 'Pay on Delivery'}</p>
  </div>
  
  <div style="background-color: #2a2a2a; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
    <h3 style="color: #ff7100; margin: 0 0 15px 0;">Customer Info</h3>
    <p style="margin: 5px 0;"><strong>Name:</strong> ${data.customerName}</p>
    <p style="margin: 5px 0;"><strong>Phone:</strong> ${data.customerPhone}</p>
    <p style="margin: 5px 0;"><strong>Email:</strong> ${data.customerEmail}</p>
    <p style="margin: 5px 0;"><strong>Address:</strong> ${data.deliveryAddress}</p>
    ${data.deliveryDate ? `<p style="margin: 5px 0;"><strong>Date:</strong> ${data.deliveryDate}</p>` : ''}
    ${data.deliveryTime ? `<p style="margin: 5px 0;"><strong>Time:</strong> ${data.deliveryTime}</p>` : ''}
  </div>
  
  ${data.notes ? `
  <div style="background-color: #fce4ec; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
    <h3 style="color: #c2185b; margin: 0 0 10px 0;">Special Instructions</h3>
    <p style="margin: 0;">${data.notes}</p>
  </div>
  ` : ''}
  
  <h3 style="color: #ff7100; border-bottom: 2px solid #ff7100; padding-bottom: 10px;">Order Items</h3>
  <table style="width: 100%; border-collapse: collapse;">
    <thead>
      <tr style="background-color: #2a2a2a;">
        <th style="padding: 10px; text-align: left;">Item</th>
        <th style="padding: 10px; text-align: center;">Qty</th>
        <th style="padding: 10px; text-align: right;">Price</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  <div style="margin-top: 20px; background-color: #2a2a2a; border-radius: 8px; padding: 16px;">
    <h3 style="color: #ff7100; margin: 0 0 12px 0; font-size: 15px;">Order Total Breakdown</h3>
    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      <tr>
        <td style="padding: 5px 0; color: #bbb;">Subtotal</td>
        <td style="padding: 5px 0; text-align: right;">$${data.subtotal}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0; color: #bbb;">Delivery Fee</td>
        <td style="padding: 5px 0; text-align: right;">${parseFloat(data.deliveryFee) === 0 ? '<span style="color:#4caf50;">FREE</span>' : `$${data.deliveryFee}`}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0; color: #bbb;">Tax (8.25%)</td>
        <td style="padding: 5px 0; text-align: right;">$${data.tax}</td>
      </tr>
      ${data.discount ? `
      <tr>
        <td style="padding: 5px 0; color: #4caf50;">Discount</td>
        <td style="padding: 5px 0; text-align: right; color: #4caf50;">-$${data.discount}</td>
      </tr>` : ''}
      <tr>
        <td colspan="2" style="padding-top: 10px; border-top: 2px solid #ff7100;"></td>
      </tr>
      <tr>
        <td style="padding: 8px 0 0; font-size: 17px; font-weight: 700; color: #ff7100;">AMOUNT DUE</td>
        <td style="padding: 8px 0 0; text-align: right; font-size: 17px; font-weight: 700; color: #ff7100;">$${data.total}</td>
      </tr>
    </table>
    <div style="margin-top: 10px; padding: 8px 10px; background-color: #1a1a1a; border-radius: 4px; font-size: 13px; color: #ccc;">
      <strong>Payment:</strong> ${data.paymentMethod}
    </div>
  </div>

  <p style="text-align: center; color: #666; font-size: 12px; margin-top: 20px;">
    Vape Cave Smoke &amp; Stuff Delivery System
  </p>
</div>
    `.trim();

    const emailMessage = createEmailMessage(
      data.driverEmail,
      EMAIL_ALIASES.delivery,
      `NEW ORDER #${data.orderId} - ${data.customerName} - $${data.total}`,
      textContent,
      htmlContent
    );

    const encodedMessage = encodeMessage(emailMessage);

    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    console.log(`Driver notification email sent for order #${data.orderId}:`, result.data.id);

    return { success: true, message: 'Driver notification email sent successfully' };
  } catch (error) {
    console.error('Error sending driver notification email:', error);
    return { success: false, message: 'Failed to send driver notification email' };
  }
};

export interface RestockNotificationData {
  email: string;
  fullName: string;
  productName: string;
}

export const sendRestockNotificationEmail = async (data: RestockNotificationData): Promise<{ success: boolean; message: string }> => {
  const fallback = {
    subject: "🔔 [PRODUCT_NAME] is back in stock at Vape Cave!",
    bodyText: `Hey [CUSTOMER_NAME],\n\nYou asked us to let you know — and we're delivering! The product you've been waiting for is now available:\n\n[PRODUCT_NAME] is back and ready to order.\n\nStock may be limited, so don't wait — head over to our delivery portal now and grab yours before it's gone again.`,
  };
  const template = await getTemplate("restock_alert", fallback);
  const processedBody = renderTemplate(template.bodyText, {
    CUSTOMER_NAME: data.fullName,
    PRODUCT_NAME: data.productName,
  });
  const subject = renderTemplate(template.subject, {
    CUSTOMER_NAME: data.fullName,
    PRODUCT_NAME: data.productName,
  });

  const ctaHtml = `
    <div style="text-align: center; margin: 24px 0;">
      <a href="https://vapecavetx.com/delivery/shop" style="background: linear-gradient(135deg, #ff7100, #ff9a00); color: #000; font-weight: 700; font-size: 15px; text-decoration: none; padding: 14px 36px; border-radius: 8px; display: inline-block;">Shop Now →</a>
    </div>
  `;

  const htmlContent = masterHtmlShell({
    headerTitle: "🎉 It's Back in Stock!",
    bodyHtml: processedBody,
    ctaHtml,
    footerNote: `You're receiving this because you signed up for a restock alert at Vape Cave Smoke &amp; Stuff.<br />Frisco, TX · <a href="https://vapecavetx.com" style="color: #ff7100; text-decoration: none;">vapecavetx.com</a>`,
  });

  return sendEmail({ to: data.email, subject, html: htmlContent, from: 'noreply' });
};
