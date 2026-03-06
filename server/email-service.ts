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
  paymentMethod: string;
  deliveryDate?: string;
  deliveryTime?: string;
  notes?: string;
  items: Array<{ name: string; quantity: number; price: string }>;
}

// Interface for delivery rejection email
export interface DeliveryRejectionData {
  email: string;
  fullName: string;
  rejectionReason: string;
}

// Helper function to create RFC 2822 formatted email
function createEmailMessage(to: string, from: string, subject: string, textContent: string, htmlContent: string): string {
  const messageParts = [
    `To: ${to}`,
    `From: ${from}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: multipart/alternative; boundary="boundary"',
    '',
    '--boundary',
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    textContent,
    '',
    '--boundary',
    'Content-Type: text/html; charset="UTF-8"',
    '',
    htmlContent,
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
  return `
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
</div>
  `.trim();
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
  try {
    const gmail = await getUncachableGmailClient();

    const statusMessages: Record<string, { title: string; color: string; message: string }> = {
      confirmed: {
        title: '✅ Order Confirmed',
        color: '#4CAF50',
        message: 'Your order has been confirmed and is being prepared.'
      },
      preparing: {
        title: '👨‍🍳 Order Being Prepared',
        color: '#FF9800',
        message: 'Your order is currently being prepared.'
      },
      out_for_delivery: {
        title: '🚗 Out for Delivery',
        color: '#2196F3',
        message: 'Your order is on its way!'
      },
      delivered: {
        title: '🎉 Order Delivered',
        color: '#4CAF50',
        message: 'Your order has been delivered. Enjoy!'
      },
      cancelled: {
        title: '❌ Order Cancelled',
        color: '#f44336',
        message: 'Your order has been cancelled.'
      },
      refunded: {
        title: '💰 Refund Processed',
        color: '#9C27B0',
        message: 'A refund has been processed for your order.'
      }
    };

    const statusInfo = statusMessages[data.status] || {
      title: `Order Status Update`,
      color: '#FF6B00',
      message: `Your order status has been updated to: ${data.status}`
    };

    const textContent = `
Hi ${data.fullName},

${statusInfo.message}

Order #${data.orderId}
Delivery Address: ${data.deliveryAddress}
Total: $${data.total}
${data.deliveryDate ? `Delivery Date: ${data.deliveryDate}` : ''}
${data.deliveryTime ? `Delivery Time: ${data.deliveryTime}` : ''}
${data.refundAmount ? `Refund Amount: $${data.refundAmount}` : ''}
${data.refundReason ? `Refund Reason: ${data.refundReason}` : ''}

Thank you,
Vape Cave Smoke & Stuff Team
    `.trim();

    const htmlContent = `
<div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; background-color: #f9f9f9;">
  <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 style="color: ${statusInfo.color}; margin-top: 0;">${statusInfo.title}</h2>
    <p>Hi ${data.fullName},</p>
    <p>${statusInfo.message}</p>
    
    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin: 0 0 15px 0; color: #333;">Order Details</h3>
      <p style="margin: 5px 0;"><strong>Order #:</strong> ${data.orderId}</p>
      <p style="margin: 5px 0;"><strong>Delivery Address:</strong> ${data.deliveryAddress}</p>
      <p style="margin: 5px 0;"><strong>Total:</strong> $${data.total}</p>
      ${data.deliveryDate ? `<p style="margin: 5px 0;"><strong>Delivery Date:</strong> ${data.deliveryDate}</p>` : ''}
      ${data.deliveryTime ? `<p style="margin: 5px 0;"><strong>Delivery Time:</strong> ${data.deliveryTime}</p>` : ''}
      ${data.refundAmount ? `<p style="margin: 5px 0;"><strong>Refund Amount:</strong> $${data.refundAmount}</p>` : ''}
      ${data.refundReason ? `<p style="margin: 5px 0;"><strong>Refund Reason:</strong> ${data.refundReason}</p>` : ''}
    </div>
    
    <p style="margin-top: 30px;">Thank you,<br><strong>Vape Cave Smoke & Stuff Team</strong></p>
  </div>
  <p style="text-align: center; color: #666; font-size: 12px; margin-top: 20px;">
    This email was sent from Vape Cave Smoke & Stuff Delivery Service
  </p>
</div>
    `.trim();

    const emailMessage = createEmailMessage(
      data.email,
      EMAIL_ALIASES.delivery,
      `Order #${data.orderId} Update - ${statusInfo.title}`,
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

    console.log(`Order status email sent for order #${data.orderId}:`, result.data.id);

    return { success: true, message: 'Order status email sent successfully' };
  } catch (error) {
    console.error('Error sending order status email:', error);
    return { success: false, message: 'Failed to send order status email' };
  }
};

/**
 * Send order confirmation email to customer
 */
export const sendOrderConfirmationEmail = async (data: OrderConfirmationEmailData): Promise<{ success: boolean; message: string; }> => {
  try {
    const gmail = await getUncachableGmailClient();

    const itemsText = data.items.map(item =>
      `${item.name} x${item.quantity} - $${item.price}`
    ).join('\n');

    const itemsHtml = data.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #f5f5f5;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #f5f5f5; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #f5f5f5; text-align: right;">$${item.price}</td>
      </tr>
    `).join('');

    const textContent = `
Hi ${data.fullName},

${data.isReplacement ? 'Your replacement order has been confirmed!' : 'Thank you for your order!'}

Order #${data.orderId}
Delivery Address: ${data.deliveryAddress}
${data.deliveryDate ? `Delivery Date: ${data.deliveryDate}` : ''}
${data.deliveryTime ? `Delivery Time: ${data.deliveryTime}` : ''}

Items:
${itemsText}

Subtotal: $${data.subtotal}
${data.deliveryFee !== '0.00' ? `Delivery Fee: $${data.deliveryFee}` : 'Delivery: FREE'}
Tax: $${data.tax}
${data.discount ? `Discount: -$${data.discount}` : ''}
Total: $${data.total}

Payment Method: ${data.paymentMethod || 'Cash on Delivery'}
${data.notes ? `Special Instructions: ${data.notes}` : ''}

Thank you,
Vape Cave Smoke & Stuff Team
    `.trim();

    const htmlContent = `
<div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; background-color: #f9f9f9;">
  <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 style="color: #FF6B00; margin-top: 0;">${data.isReplacement ? '🔄 Replacement Order Confirmed!' : '✅ Order Confirmed!'}</h2>
    <p>Hi ${data.fullName},</p>
    <p>${data.isReplacement ? 'Your replacement order has been confirmed and is being prepared.' : 'Thank you for your order! We\'re preparing it now.'}</p>
    
    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin: 0 0 15px 0; color: #333;">Order #${data.orderId}</h3>
      <p style="margin: 5px 0;"><strong>Delivery Address:</strong> ${data.deliveryAddress}</p>
      ${data.deliveryDate ? `<p style="margin: 5px 0;"><strong>Delivery Date:</strong> ${data.deliveryDate}</p>` : ''}
      ${data.deliveryTime ? `<p style="margin: 5px 0;"><strong>Delivery Time:</strong> ${data.deliveryTime}</p>` : ''}
      <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${data.paymentMethod || 'Cash on Delivery'}</p>
    </div>
    
    ${data.notes ? `
    <div style="background-color: #fce4ec; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
      <h3 style="color: #c2185b; margin: 0 0 10px 0;">Special Instructions</h3>
      <p style="margin: 0;">${data.notes}</p>
    </div>
    ` : ''}
    
    <h3 style="color: #333; border-bottom: 2px solid #FF6B00; padding-bottom: 10px;">Order Items</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background-color: #f5f5f5;">
          <th style="padding: 10px; text-align: left;">Item</th>
          <th style="padding: 10px; text-align: center;">Qty</th>
          <th style="padding: 10px; text-align: right;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>
    
    <div style="margin-top: 20px; text-align: right;">
      <p style="margin: 5px 0;">Subtotal: $${data.subtotal}</p>
      <p style="margin: 5px 0;">${data.deliveryFee !== '0.00' ? `Delivery Fee: $${data.deliveryFee}` : 'Delivery: <strong style="color: #4CAF50;">FREE</strong>'}</p>
      <p style="margin: 5px 0;">Tax: $${data.tax}</p>
      ${data.discount ? `<p style="margin: 5px 0; color: #4CAF50;">Discount: -$${data.discount}</p>` : ''}
      <p style="margin: 10px 0; font-size: 18px; font-weight: bold; color: #FF6B00;">Total: $${data.total}</p>
    </div>
    
    <p style="margin-top: 30px;">Thank you,<br><strong>Vape Cave Smoke & Stuff Team</strong></p>
  </div>
  <p style="text-align: center; color: #666; font-size: 12px; margin-top: 20px;">
    This email was sent from Vape Cave Smoke & Stuff Delivery Service
  </p>
</div>
    `.trim();

    const emailMessage = createEmailMessage(
      data.email,
      EMAIL_ALIASES.billing,
      `Order #${data.orderId} Confirmed - Vape Cave Smoke & Stuff`,
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

    console.log(`Order confirmation email sent for order #${data.orderId}:`, result.data.id);

    return { success: true, message: 'Order confirmation email sent successfully' };
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return { success: false, message: 'Failed to send order confirmation email' };
  }
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
Payment: ${data.paymentMethod}
Total: $${data.total}

Items:
${itemsText}

${data.notes ? `Notes: ${data.notes}` : ''}
    `.trim();

    const htmlContent = `
<div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; background-color: #1a1a1a; color: #f5f5f5; border-radius: 10px;">
  <div style="background: linear-gradient(135deg, #ff7100, #ff9a00); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2 style="margin: 0; color: #000;">🚗 NEW DELIVERY ORDER #${data.orderId}</h2>
    <p style="margin: 5px 0 0; color: #1a1a1a; font-weight: bold;">Total: $${data.total} · ${data.paymentMethod}</p>
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
  <p style="text-align: center; color: #666; font-size: 12px; margin-top: 20px;">
    Vape Cave Smoke & Stuff Delivery System
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
