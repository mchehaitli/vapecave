import { DeliveryHeader } from "@/components/DeliveryHeader";
import { DeliveryFooter } from "@/components/DeliveryFooter";
import { FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DeliveryHeader showSearch={false} showBackButton={true} />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <FileText className="w-16 h-16 mx-auto text-primary mb-4" />
          <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
          <p className="text-muted-foreground">
            Last Updated: January 24, 2026
          </p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and using the Vape Cave website and services, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">2. Age Verification</h2>
            <p className="text-muted-foreground leading-relaxed">
              You must be at least 21 years of age to purchase products from Vape Cave. By placing an order, you certify that you are 21 years of age or older. We implement age verification systems and require valid government-issued photo identification for all deliveries. We reserve the right to refuse or cancel any order that fails age verification.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">3. Products and Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              Vape Cave offers vaping products, accessories, and related merchandise. All products sold comply with federal and Texas state regulations. Product availability, descriptions, and prices are subject to change without notice. We make every effort to display product information accurately, but we do not warrant that descriptions or other content are error-free.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">4. Ordering and Payment</h2>
            <p className="text-muted-foreground leading-relaxed">
              By placing an order, you agree to pay the total amount, including product costs, applicable taxes, and delivery fees. We accept major credit cards, debit cards, and digital payment methods. All payments are processed securely through our payment processor. We reserve the right to refuse or cancel any order for any reason, including but not limited to product availability, pricing errors, or suspected fraud.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">5. Delivery Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our delivery service is available within a 3-mile radius of our Frisco, TX store location. Adult signature (21+) is required for all deliveries. The delivery recipient must present valid government-issued photo identification. If no eligible adult is available to accept the delivery, the order may be returned to the store. Delivery times are estimates and not guaranteed.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">6. All Sales Are Final</h2>
            <p className="text-muted-foreground leading-relaxed font-medium text-foreground">
              ALL SALES ARE FINAL. We do not offer refunds, returns, or exchanges under any circumstances. Due to the nature of our products and health and safety regulations, we cannot accept returns on any purchased items. Please review your order carefully before completing your purchase.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">7. Account Responsibilities</h2>
            <p className="text-muted-foreground leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account. We reserve the right to suspend or terminate accounts that violate these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">8. Prohibited Uses</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree not to use our website or services for any unlawful purpose, to violate any laws, to provide false information, to resell products without authorization, or to interfere with the proper functioning of our website.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">9. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              All content on our website, including text, images, logos, and graphics, is the property of Vape Cave and is protected by copyright and trademark laws. You may not reproduce, distribute, or create derivative works without our express written permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">10. Health Disclaimer</h2>
            <p className="text-muted-foreground leading-relaxed">
              Vaping products contain nicotine, which is an addictive substance. Our products are not intended as smoking cessation devices and have not been evaluated by the FDA for that purpose. Keep all vaping products away from children and pets.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">11. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              Vape Cave shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services or products. Our total liability shall not exceed the amount paid for the specific product or service giving rise to the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">12. Indemnification</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree to indemnify and hold harmless Vape Cave, its officers, employees, and affiliates from any claims, damages, or expenses arising from your violation of these terms or your use of our products and services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">13. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms of Service are governed by the laws of the State of Texas. Any disputes arising from these terms shall be resolved in the courts of Collin County, Texas.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">14. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately upon posting. Your continued use of our services after any changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">15. Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these Terms of Service, please contact us at:
            </p>
            <div className="mt-4 text-muted-foreground">
              <p>Vape Cave</p>
              <p>6958 Main St #200</p>
              <p>Frisco, TX 75033</p>
              <p>Email: vapecavetex@gmail.com</p>
              <p>Phone: (469) 294-0061</p>
            </div>
          </section>
        </div>
      </main>
      
      <DeliveryFooter />
    </div>
  );
}
