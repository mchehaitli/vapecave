import { getUncachableGmailClient } from './gmail-client';
import * as dotenv from 'dotenv';

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
 * Generic email sending function
 * @param options Email options (to, subject, html, text)
 * @returns Object with success status and optional error
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
 * @param data The contact form data
 * @returns Object with success status and message
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
 * @param data The newsletter subscription data
 * @returns Object with success status and message
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
 * @param data The delivery signup data
 * @returns Object with success status and message
 */
export const sendDeliverySignupConfirmation = async (data: DeliverySignupData): Promise<{ success: boolean; message: string; }> => {
  try {
    const gmail = await getUncachableGmailClient();
    
    const textContent = `
Hi ${data.fullName},

Thank you for signing up for Vape Cave Smoke & Stuff delivery service!

We've received your application and our team will review it once our delivery system launches. Once we launch and your account is approved, you'll receive an email notification with instructions to set up your password.

What happens next:
1. Our team will verify your information and photo ID
2. You'll receive an email notification once our system launches with approval and instructions to set up your password

In the meantime, if you have any questions, feel free to contact us.

Thank you,
Vape Cave Smoke & Stuff Team
    `.trim();
    
    const htmlContent = `
<div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; background-color: #f9f9f9;">
  <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 style="color: #FF6B00; margin-top: 0;">Welcome to Vape Cave Smoke & Stuff Delivery!</h2>
    <p>Hi ${data.fullName},</p>
    <p>Thank you for signing up for Vape Cave Smoke & Stuff delivery service!</p>
    <p style="background-color: #fff3e0; padding: 15px; border-left: 4px solid #FF6B00; margin: 20px 0;">
      We've received your application and our team will review it once our delivery system launches. Once we launch and your account is approved, you'll receive an email with instructions to set up your password.
    </p>
    <h3 style="color: #333;">What happens next:</h3>
    <ol style="line-height: 1.8;">
      <li>Our team will verify your information and photo ID</li>
      <li>You'll receive an email notification once our system launches with approval and instructions to set up your password</li>
    </ol>
    <p>In the meantime, if you have any questions, feel free to contact us.</p>
    <p style="margin-top: 30px;">Thank you,<br><strong>Vape Cave Smoke & Stuff Team</strong></p>
  </div>
  <p style="text-align: center; color: #666; font-size: 12px; margin-top: 20px;">
    This email was sent from Vape Cave Smoke & Stuff Delivery Service
  </p>
</div>
    `.trim();
    
    const emailMessage = createEmailMessage(
      data.email,
      EMAIL_ALIASES.welcome,
      'Welcome to Vape Cave Smoke & Stuff Delivery - Application Received',
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
    
    console.log('Delivery signup confirmation email sent:', result.data.id);
    
    return { success: true, message: 'Signup confirmation email sent successfully' };
  } catch (error) {
    console.error('Error sending delivery signup confirmation:', error);
    return { success: false, message: 'Failed to send signup confirmation email' };
  }
};

/**
 * Send approval email with password setup link
 * @param data The delivery approval data
 * @returns Object with success status and message
 */
export const sendDeliveryApprovalEmail = async (data: DeliveryApprovalData): Promise<{ success: boolean; message: string; }> => {
  try {
    const gmail = await getUncachableGmailClient();
    
    const setupLink = `https://vapecavetx.com/delivery/set-password?token=${data.passwordSetupToken}`;
    
    const textContent = `
Hi ${data.fullName},

Great news! Your Vape Cave Smoke & Stuff delivery account has been approved.

To get started, please create your password by clicking the link below:
${setupLink}

This secure link will expire in 48 hours for your security.

Next steps:
1. Click the link above to create your password
2. Choose a secure password for your account
3. Start browsing our products and placing orders!

Once you've set your password, you can log in at vapecavetx.com/signin

Thank you for choosing Vape Cave Smoke & Stuff!

Vape Cave Smoke & Stuff Team
    `.trim();
    
    const htmlContent = `
<div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; background-color: #f9f9f9;">
  <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 style="color: #4CAF50; margin-top: 0;">🎉 Account Approved!</h2>
    <p>Hi ${data.fullName},</p>
    <p>Great news! Your Vape Cave Smoke & Stuff delivery account has been <strong>approved</strong>.</p>
    
    <p style="margin: 25px 0;">To get started, please create your password:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${setupLink}" style="background-color: #FF6B00; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">Create Your Password</a>
    </div>
    
    <div style="background-color: #fff3e0; padding: 15px; border-left: 4px solid #FF6B00; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px;">⏰ <strong>Important:</strong> This secure link will expire in 48 hours for your security.</p>
    </div>
    
    <h3 style="color: #333;">Next steps:</h3>
    <ol style="line-height: 1.8;">
      <li>Click the button above to create your password</li>
      <li>Choose a secure password for your account</li>
      <li>Start browsing our products and placing orders!</li>
    </ol>
    
    <p>Once you've set your password, you can log in at <a href="https://vapecavetx.com/signin" style="color: #FF6B00; text-decoration: none; font-weight: bold;">vapecavetx.com/signin</a></p>
    
    <p style="margin-top: 30px;">Thank you for choosing Vape Cave Smoke & Stuff!<br><strong>Vape Cave Smoke & Stuff Team</strong></p>
  </div>
  <p style="text-align: center; color: #666; font-size: 12px; margin-top: 20px;">
    This email was sent from Vape Cave Smoke & Stuff Delivery Service<br>
    If the button doesn't work, copy and paste this link: ${setupLink}
  </p>
</div>
    `.trim();
    
    const emailMessage = createEmailMessage(
      data.email,
      EMAIL_ALIASES.welcome,
      'Your Vape Cave Smoke & Stuff Account Has Been Approved!',
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
    
    console.log('Delivery approval email sent:', result.data.id);
    
    return { success: true, message: 'Approval email sent successfully' };
  } catch (error) {
    console.error('Error sending delivery approval email:', error);
    return { success: false, message: 'Failed to send approval email' };
  }
};

/**
 * Send delivery rejection email
 * @param data The delivery rejection data
 * @returns Object with success status and message
 */
export const sendDeliveryRejectionEmail = async (data: DeliveryRejectionData): Promise<{ success: boolean; message: string; }> => {
  try {
    const gmail = await getUncachableGmailClient();
    
    const textContent = `
Hi ${data.fullName},

Thank you for your interest in Vape Cave Smoke & Stuff's delivery service.

Unfortunately, we are unable to approve your delivery account application at this time.

Reason: ${data.rejectionReason}

If you have questions or would like to reapply, please contact us:
- Visit: vapecavetx.com/contact
- Email: vapecavetx@gmail.com
- Phone: Visit our store locations for assistance

We appreciate your understanding.

Vape Cave Smoke & Stuff Team
    `.trim();
    
    const htmlContent = `
<div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; background-color: #f9f9f9;">
  <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 style="color: #f44336; margin-top: 0;">Delivery Application Status</h2>
    <p>Hi ${data.fullName},</p>
    <p>Thank you for your interest in Vape Cave Smoke & Stuff's delivery service.</p>
    
    <p>Unfortunately, we are unable to approve your delivery account application at this time.</p>
    
    <div style="background-color: #ffebee; padding: 20px; border-radius: 8px; border-left: 4px solid #f44336; margin: 25px 0;">
      <p style="margin: 0 0 10px 0; color: #666; font-weight: bold;">Reason for rejection:</p>
      <p style="margin: 0; color: #c62828;">${data.rejectionReason}</p>
    </div>
    
    <h3 style="color: #333;">Need Help?</h3>
    <p>If you have questions or would like to reapply, please contact us:</p>
    <ul style="line-height: 1.8;">
      <li>Visit: <a href="https://vapecavetx.com/contact" style="color: #FF6B00; text-decoration: none;">vapecavetx.com/contact</a></li>
      <li>Email: vapecavetx@gmail.com</li>
      <li>Phone: Visit our store locations for assistance</li>
    </ul>
    
    <p style="margin-top: 30px;">We appreciate your understanding.<br><strong>Vape Cave Smoke & Stuff Team</strong></p>
  </div>
  <p style="text-align: center; color: #666; font-size: 12px; margin-top: 20px;">
    This email was sent from Vape Cave Smoke & Stuff Delivery Service
  </p>
</div>
    `.trim();
    
    const emailMessage = createEmailMessage(
      data.email,
      EMAIL_ALIASES.support,
      'Delivery Application Status - Vape Cave Smoke & Stuff',
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
    
    console.log('Delivery rejection email sent:', result.data.id);
    
    return { success: true, message: 'Rejection email sent successfully' };
  } catch (error) {
    console.error('Error sending delivery rejection email:', error);
    return { success: false, message: 'Failed to send rejection email' };
  }
};

/**
 * Send password reset email with temporary password
 * @param data The password reset data
 * @returns Object with success status and message
 */
export const sendPasswordResetEmail = async (data: PasswordResetData): Promise<{ success: boolean; message: string; }> => {
  try {
    const gmail = await getUncachableGmailClient();
    
    const textContent = `
Hi ${data.fullName},

We received a request to reset your Vape Cave Smoke & Stuff delivery account password.

Your temporary password is: ${data.temporaryPassword}

Next steps:
1. Visit vapecavetx.com/signin
2. Log in with your email and the temporary password above
3. You'll be prompted to create a new, secure password

If you didn't request a password reset, please contact us immediately.

This temporary password will expire in 24 hours.

Vape Cave Smoke & Stuff Team
    `.trim();
    
    const htmlContent = `
<div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; background-color: #f9f9f9;">
  <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 style="color: #FF6B00; margin-top: 0;">Password Reset Request</h2>
    <p>Hi ${data.fullName},</p>
    <p>We received a request to reset your Vape Cave Smoke & Stuff delivery account password.</p>
    
    <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <p style="margin: 0 0 10px 0; color: #666;">Your temporary password:</p>
      <p style="font-family: monospace; font-size: 20px; font-weight: bold; color: #1565c0; margin: 0; letter-spacing: 2px;">${data.temporaryPassword}</p>
    </div>
    
    <h3 style="color: #333;">Next steps:</h3>
    <ol style="line-height: 1.8;">
      <li>Visit <a href="https://vapecavetx.com/signin" style="color: #FF6B00; text-decoration: none; font-weight: bold;">vapecavetx.com/signin</a></li>
      <li>Log in with your email and the temporary password above</li>
      <li>You'll be prompted to create a new, secure password</li>
    </ol>
    
    <div style="background-color: #ffebee; padding: 15px; border-left: 4px solid #f44336; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px;">⚠️ <strong>Security Notice:</strong> If you didn't request a password reset, please contact us immediately.</p>
    </div>
    
    <p style="color: #666; font-size: 14px;">This temporary password will expire in 24 hours.</p>
    
    <p style="margin-top: 30px;">Vape Cave Smoke & Stuff Team</p>
  </div>
  <p style="text-align: center; color: #666; font-size: 12px; margin-top: 20px;">
    This email was sent from Vape Cave Smoke & Stuff Delivery Service
  </p>
</div>
    `.trim();
    
    const emailMessage = createEmailMessage(
      data.email,
      EMAIL_ALIASES.verify,
      'Password Reset - Vape Cave Smoke & Stuff Delivery',
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
    
    console.log('Password reset email sent:', result.data.id);
    
    return { success: true, message: 'Password reset email sent successfully' };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, message: 'Failed to send password reset email' };
  }
};

/**
 * Send order status update email
 * @param data The order status email data
 * @returns Object with success status and message
 */
export const sendOrderStatusEmail = async (data: OrderStatusEmailData): Promise<{ success: boolean; message: string; }> => {
  try {
    const gmail = await getUncachableGmailClient();
    
    const statusMessages: Record<string, { subject: string; heading: string; message: string; emoji: string; color: string }> = {
      'confirmed': {
        subject: 'Order Confirmed',
        heading: 'Order Confirmed!',
        message: 'Your order has been confirmed and is being prepared.',
        emoji: '✓',
        color: '#4CAF50'
      },
      'preparing': {
        subject: 'Order Being Prepared',
        heading: 'Preparing Your Order',
        message: 'We\'re now preparing your order for delivery.',
        emoji: '📦',
        color: '#9C27B0'
      },
      'out_for_delivery': {
        subject: 'Your Order is On Its Way!',
        heading: 'Out for Delivery!',
        message: 'Your order is out for delivery and will arrive soon!',
        emoji: '🚚',
        color: '#FF9800'
      },
      'delivered': {
        subject: 'Order Delivered',
        heading: 'Order Delivered!',
        message: 'Your order has been delivered. Enjoy!',
        emoji: '✅',
        color: '#4CAF50'
      },
      'cancelled': {
        subject: 'Order Cancelled',
        heading: 'Order Cancelled',
        message: 'Your order has been cancelled. If you have questions, please contact us.',
        emoji: '❌',
        color: '#f44336'
      },
      'refunded': {
        subject: 'Order Refunded',
        heading: 'Refund Processed',
        message: data.refundAmount 
          ? `A refund of $${data.refundAmount} has been processed for your order.${data.refundReason ? ` Reason: ${data.refundReason}` : ''}`
          : 'Your order has been refunded.',
        emoji: '💳',
        color: '#2196F3'
      }
    };
    
    const statusInfo = statusMessages[data.status] || {
      subject: `Order Update - #${data.orderId}`,
      heading: 'Order Update',
      message: `Your order status has been updated to: ${data.status.replace(/_/g, ' ')}`,
      emoji: '📋',
      color: '#666'
    };
    
    const deliveryInfo = data.deliveryDate && data.deliveryTime 
      ? `\nDelivery Window: ${data.deliveryDate}, ${data.deliveryTime}` 
      : '';
    
    const textContent = `
Hi ${data.fullName},

${statusInfo.heading}

${statusInfo.message}

Order Details:
- Order #${data.orderId}
- Delivery Address: ${data.deliveryAddress}
- Total: $${data.total}${deliveryInfo}

Thank you for choosing Vape Cave Smoke & Stuff!

Vape Cave Smoke & Stuff Team
    `.trim();
    
    const htmlContent = `
<div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; background-color: #f9f9f9;">
  <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 48px; margin-bottom: 10px;">${statusInfo.emoji}</div>
      <h2 style="color: ${statusInfo.color}; margin: 0;">${statusInfo.heading}</h2>
    </div>
    
    <p>Hi ${data.fullName},</p>
    <p>${statusInfo.message}</p>
    
    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <h3 style="margin: 0 0 15px 0; color: #333;">Order Details</h3>
      <p style="margin: 5px 0;"><strong>Order Number:</strong> #${data.orderId}</p>
      <p style="margin: 5px 0;"><strong>Delivery Address:</strong> ${data.deliveryAddress}</p>
      <p style="margin: 5px 0;"><strong>Total:</strong> $${data.total}</p>
      ${data.deliveryDate && data.deliveryTime ? `<p style="margin: 5px 0;"><strong>Delivery Window:</strong> ${data.deliveryDate}, ${data.deliveryTime}</p>` : ''}
    </div>
    
    <p>You can view your order details and track your delivery by visiting your account:</p>
    <div style="text-align: center; margin: 25px 0;">
      <a href="https://vapecavetx.com/delivery/account" style="background-color: #FF6B00; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">View My Orders</a>
    </div>
    
    <p style="margin-top: 30px;">Thank you for choosing Vape Cave Smoke & Stuff!<br><strong>Vape Cave Smoke & Stuff Team</strong></p>
  </div>
  <p style="text-align: center; color: #666; font-size: 12px; margin-top: 20px;">
    This email was sent from Vape Cave Smoke & Stuff Delivery Service
  </p>
</div>
    `.trim();
    
    const emailMessage = createEmailMessage(
      data.email,
      EMAIL_ALIASES.delivery,
      `${statusInfo.subject} - Order #${data.orderId} - Vape Cave Smoke & Stuff`,
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
 * Send order confirmation email to customer after checkout
 * @param data The order confirmation data
 * @returns Object with success status and message
 */
export const sendOrderConfirmationEmail = async (data: OrderConfirmationEmailData): Promise<{ success: boolean; message: string; }> => {
  try {
    const gmail = await getUncachableGmailClient();
    
    const paymentDisplay = data.paymentMethod === 'cash' ? 'Cash on Delivery' : (data.paymentMethod === 'manual' ? 'Replacement Order' : 'Credit Card');
    const itemsList = data.items.map(item => `- ${item.name} x${item.quantity} @ $${item.price}`).join('\n');
    const itemsHtml = data.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.price}</td>
      </tr>
    `).join('');
    
    const isReplacement = data.isReplacement;
    const replacementNote = isReplacement ? `\nNote: ${data.notes || 'This is a replacement order for a defective or incorrect item. No payment required.'}` : '';
    const emailTitle = isReplacement ? 'Replacement Order Confirmed!' : 'Order Confirmed!';
    const emailIntro = isReplacement 
      ? `We're sending you a replacement order at no additional charge.${data.notes ? ` Reason: ${data.notes}` : ''}`
      : 'Thank you for your order! Your order has been confirmed.';
    
    const textContent = `
Hi ${data.fullName},

${emailIntro}

Order #${data.orderId}

Order Details:
${itemsList}

Subtotal: $${data.subtotal}
${data.discount && parseFloat(data.discount) > 0 ? `Discount: -$${data.discount}` : ''}
Tax: $${data.tax}
Delivery Fee: ${parseFloat(data.deliveryFee) === 0 ? 'FREE' : '$' + data.deliveryFee}
Total: $${data.total}

Delivery Address: ${data.deliveryAddress}
${data.deliveryDate && data.deliveryTime ? `Delivery Window: ${data.deliveryDate}, ${data.deliveryTime}` : ''}
${!isReplacement ? `Payment Method: ${paymentDisplay}` : ''}
${replacementNote}

You can view your order details by visiting your account at vapecavetx.com/delivery/account

Thank you for choosing Vape Cave Smoke & Stuff!
Vape Cave Smoke & Stuff Team
    `.trim();
    
    const htmlContent = `
<div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; background-color: #f9f9f9;">
  <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 25px;">
      <h1 style="color: ${isReplacement ? '#FF6B00' : '#4CAF50'}; margin: 0;">${emailTitle}</h1>
      <p style="color: #666; font-size: 14px; margin-top: 5px;">Order #${data.orderId}</p>
    </div>
    
    <p>Hi ${data.fullName},</p>
    <p>${emailIntro}</p>
    ${isReplacement && data.notes ? `<p style="background-color: #FFF3E0; padding: 10px; border-radius: 5px; border-left: 4px solid #FF6B00;"><strong>Reason:</strong> ${data.notes}</p>` : ''}
    
    <h3 style="color: #333; border-bottom: 2px solid #FF6B00; padding-bottom: 10px;">Order Items</h3>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
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
    
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <div style="display: flex; justify-content: space-between; margin: 5px 0;">
        <span>Subtotal:</span>
        <span>$${data.subtotal}</span>
      </div>
      ${data.discount && parseFloat(data.discount) > 0 ? `
      <div style="display: flex; justify-content: space-between; margin: 5px 0; color: #4CAF50;">
        <span>Discount:</span>
        <span>-$${data.discount}</span>
      </div>
      ` : ''}
      <div style="display: flex; justify-content: space-between; margin: 5px 0;">
        <span>Tax:</span>
        <span>$${data.tax}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin: 5px 0;">
        <span>Delivery Fee:</span>
        <span>${parseFloat(data.deliveryFee) === 0 ? '<span style="color: #4CAF50;">FREE</span>' : '$' + data.deliveryFee}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-top: 10px; padding-top: 10px; border-top: 2px solid #ddd; font-size: 18px; font-weight: bold;">
        <span>Total:</span>
        <span style="color: #FF6B00;">$${data.total}</span>
      </div>
    </div>
    
    <div style="background-color: #fff3e0; padding: 15px; border-left: 4px solid #FF6B00; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Delivery Address:</strong> ${data.deliveryAddress}</p>
      ${data.deliveryDate && data.deliveryTime ? `<p style="margin: 5px 0;"><strong>Delivery Window:</strong> ${data.deliveryDate}, ${data.deliveryTime}</p>` : ''}
      <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${paymentDisplay}</p>
    </div>
    
    <div style="text-align: center; margin: 25px 0;">
      <a href="https://vapecavetx.com/delivery/account" style="background-color: #FF6B00; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">View My Orders</a>
    </div>
    
    <p style="margin-top: 30px;">Thank you for choosing Vape Cave Smoke & Stuff!<br><strong>Vape Cave Smoke & Stuff Team</strong></p>
  </div>
  <p style="text-align: center; color: #666; font-size: 12px; margin-top: 20px;">
    This email was sent from Vape Cave Smoke & Stuff Delivery Service
  </p>
</div>
    `.trim();
    
    const emailMessage = createEmailMessage(
      data.email,
      EMAIL_ALIASES.billing,
      `Order Confirmed - #${data.orderId} - Vape Cave Smoke & Stuff`,
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
 * Send delivery notification email to driver when a new order is placed
 * @param data The driver notification data
 * @returns Object with success status and message
 */
export const sendDriverNotificationEmail = async (data: DriverNotificationEmailData): Promise<{ success: boolean; message: string; }> => {
  try {
    const gmail = await getUncachableGmailClient();
    
    const paymentDisplay = data.paymentMethod === 'cash' ? 'Cash on Delivery' : 'Credit Card (Paid)';
    const itemsList = data.items.map(item => `- ${item.name} x${item.quantity} @ $${item.price}`).join('\n');
    const itemsHtml = data.items.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${item.price}</td>
      </tr>
    `).join('');
    
    const textContent = `
NEW DELIVERY ORDER - #${data.orderId}

Customer Information:
Name: ${data.customerName}
Phone: ${data.customerPhone}
Email: ${data.customerEmail}

Delivery Details:
Address: ${data.deliveryAddress}
${data.deliveryDate && data.deliveryTime ? `Date & Time: ${data.deliveryDate}, ${data.deliveryTime}` : 'Date & Time: To be scheduled'}

Payment:
Method: ${paymentDisplay}
Total: $${data.total}

Order Items:
${itemsList}

${data.notes ? `Special Instructions: ${data.notes}` : ''}
    `.trim();
    
    const htmlContent = `
<div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; background-color: #f9f9f9;">
  <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <div style="background-color: #FF6B00; color: white; padding: 15px; margin: -30px -30px 25px -30px; border-radius: 10px 10px 0 0; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">New Delivery Order!</h1>
      <p style="margin: 5px 0 0 0; font-size: 16px;">Order #${data.orderId}</p>
    </div>
    
    <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h3 style="color: #2e7d32; margin: 0 0 15px 0;">Customer Information</h3>
      <p style="margin: 8px 0;"><strong>Name:</strong> ${data.customerName}</p>
      <p style="margin: 8px 0;"><strong>Phone:</strong> <a href="tel:${data.customerPhone}" style="color: #1976d2;">${data.customerPhone}</a></p>
      <p style="margin: 8px 0;"><strong>Email:</strong> <a href="mailto:${data.customerEmail}" style="color: #1976d2;">${data.customerEmail}</a></p>
    </div>
    
    <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h3 style="color: #1565c0; margin: 0 0 15px 0;">Delivery Details</h3>
      <p style="margin: 8px 0;"><strong>Address:</strong> ${data.deliveryAddress}</p>
      <p style="margin: 8px 0;"><strong>Date & Time:</strong> ${data.deliveryDate && data.deliveryTime ? `${data.deliveryDate}, ${data.deliveryTime}` : 'To be scheduled'}</p>
    </div>
    
    <div style="background-color: ${data.paymentMethod === 'cash' ? '#fff3e0' : '#e8f5e9'}; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h3 style="color: ${data.paymentMethod === 'cash' ? '#e65100' : '#2e7d32'}; margin: 0 0 15px 0;">Payment</h3>
      <p style="margin: 8px 0;"><strong>Method:</strong> ${paymentDisplay}</p>
      <p style="margin: 8px 0; font-size: 20px;"><strong>Total: $${data.total}</strong></p>
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
  </div>
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