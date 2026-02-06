import { DeliveryHeader } from "@/components/DeliveryHeader";
import { DeliveryFooter } from "@/components/DeliveryFooter";
import { AlertCircle, Ban } from "lucide-react";

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DeliveryHeader showSearch={false} showBackButton={true} />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <Ban className="w-16 h-16 mx-auto text-primary mb-4" />
          <h1 className="text-3xl font-bold mb-2">Refund Policy</h1>
          <p className="text-muted-foreground">
            Last Updated: January 24, 2026
          </p>
        </div>

        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-8 h-8 text-destructive flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-bold text-destructive mb-2">ALL SALES ARE FINAL</h2>
              <p className="text-foreground">
                Vape Cave Smoke & Stuff does not offer refunds, returns, or exchanges on any products. Please review your order carefully before completing your purchase.
              </p>
            </div>
          </div>
        </div>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">1. No Refund Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Due to the nature of our products and for health and safety reasons, all sales at Vape Cave Smoke & Stuff are final. We do not accept returns, and we do not issue refunds or exchanges under any circumstances. This policy applies to all products purchased through our website or delivery service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">2. Why All Sales Are Final</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Our strict no-refund policy exists for several important reasons:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Health and Safety:</strong> Vaping products cannot be resold once they leave our possession for health and safety regulations</li>
              <li><strong>Product Integrity:</strong> We cannot verify the condition of returned products</li>
              <li><strong>Legal Compliance:</strong> Age-restricted products require strict handling procedures</li>
              <li><strong>Quality Control:</strong> Maintaining product quality and authenticity for all customers</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">3. Before You Purchase</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We strongly encourage you to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Read product descriptions carefully</li>
              <li>Check product specifications, flavors, and nicotine levels</li>
              <li>Review your cart before checkout</li>
              <li>Verify your delivery address is correct</li>
              <li>Contact us with any questions before placing your order</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">4. Order Cancellations</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you need to cancel an order, please contact us immediately. Orders may only be cancelled if they have not yet been prepared for delivery. Once an order has been prepared or dispatched, it cannot be cancelled, and our no-refund policy applies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">5. Damaged or Defective Products</h2>
            <p className="text-muted-foreground leading-relaxed">
              In the rare event that you receive a product that is damaged during delivery or is defective upon arrival, please contact us within 24 hours of delivery with photo evidence. We will review your case and, at our sole discretion, may offer a replacement for the affected item. This does not constitute a refund.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">6. Wrong Item Received</h2>
            <p className="text-muted-foreground leading-relaxed">
              If we shipped an incorrect item due to our error, please contact us within 24 hours of delivery. We will work to correct the error. This may involve exchanging the incorrect item for the correct one, subject to availability.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">7. Failed Delivery</h2>
            <p className="text-muted-foreground leading-relaxed">
              If a delivery cannot be completed because no eligible adult (21+) with valid ID is available to accept the order, the order will be returned to our store. You may arrange to pick up the order at our location or request redelivery (additional delivery fees may apply). No refunds will be issued for failed deliveries.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">8. Promotional Items and Discounts</h2>
            <p className="text-muted-foreground leading-relaxed">
              Products purchased with promotional codes, discounts, or as part of special offers are subject to the same no-refund policy. All sales are final regardless of the price paid.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">9. Payment Disputes</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you dispute a charge with your credit card company or bank for a valid purchase, we reserve the right to suspend your account and pursue collection of the amount owed. Please contact us directly to resolve any concerns before initiating a dispute.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">10. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about this policy or concerns about an order, please contact us:
            </p>
            <div className="mt-4 text-muted-foreground">
              <p>Vape Cave Smoke & Stuff</p>
              <p>6958 Main St #200</p>
              <p>Frisco, TX 75033</p>
              <p>Email: vapecavetex@gmail.com</p>
              <p>Phone: (469) 294-0061</p>
            </div>
          </section>

          <section className="bg-muted/30 rounded-lg p-6 mt-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Acknowledgment</h2>
            <p className="text-muted-foreground leading-relaxed">
              By completing a purchase on our website, you acknowledge that you have read, understood, and agree to this Refund Policy. You understand that all sales are final and that no refunds, returns, or exchanges will be provided.
            </p>
          </section>
        </div>
      </main>
      
      <DeliveryFooter />
    </div>
  );
}
