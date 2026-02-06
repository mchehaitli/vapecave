import { DeliveryHeader } from "@/components/DeliveryHeader";
import { DeliveryFooter } from "@/components/DeliveryFooter";
import { Shield } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DeliveryHeader showSearch={false} showBackButton={true} />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <Shield className="w-16 h-16 mx-auto text-primary mb-4" />
          <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground">
            Last Updated: January 24, 2026
          </p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Vape Cave Smoke & Stuff ("we," "us," or "our") respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">2. Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We collect information you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Name, email address, phone number, and delivery address</li>
              <li>Date of birth for age verification</li>
              <li>Government-issued photo ID for delivery verification</li>
              <li>Payment information (processed securely by our payment processor)</li>
              <li>Order history and product preferences</li>
              <li>Communications with our customer service team</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">3. Automatic Information Collection</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              When you visit our website, we automatically collect:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>IP address and device information</li>
              <li>Browser type and operating system</li>
              <li>Pages viewed and time spent on our site</li>
              <li>Referring website addresses</li>
              <li>Location data (with your permission)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">4. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Process and fulfill your orders</li>
              <li>Verify your age and identity as required by law</li>
              <li>Communicate with you about orders, products, and services</li>
              <li>Send promotional communications (with your consent)</li>
              <li>Improve our website and customer experience</li>
              <li>Detect and prevent fraud</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">5. Information Sharing</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We may share your information with:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Payment processors to complete transactions</li>
              <li>Delivery partners to fulfill orders</li>
              <li>Age verification services as required by law</li>
              <li>Legal authorities when required by law or to protect our rights</li>
              <li>Business partners with your consent</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">6. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes encryption, secure servers, and access controls. However, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">7. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this policy, comply with legal obligations, resolve disputes, and enforce our agreements. Age verification documents are stored securely and retained as required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">8. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Depending on your location, you may have the right to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your personal information</li>
              <li>Opt-out of marketing communications</li>
              <li>Request data portability</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              To exercise these rights, please contact us using the information provided below.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">9. Cookies and Tracking</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use cookies and similar tracking technologies to enhance your browsing experience, analyze website traffic, and personalize content. You can control cookie settings through your browser preferences. Some features of our website may not function properly if cookies are disabled.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">10. Third-Party Links</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our website may contain links to third-party websites. We are not responsible for the privacy practices of these sites. We encourage you to review the privacy policies of any third-party sites you visit.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">11. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our website and services are not intended for individuals under 21 years of age. We do not knowingly collect personal information from anyone under 21. If we learn that we have collected information from someone under 21, we will delete that information immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">12. California Privacy Rights</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA), including the right to know what personal information we collect, the right to delete your information, and the right to opt-out of the sale of your information. We do not sell personal information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">13. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. The updated version will be indicated by the "Last Updated" date at the top of this page. We encourage you to review this policy periodically for any changes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">14. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions or concerns about this Privacy Policy or our data practices, please contact us at:
            </p>
            <div className="mt-4 text-muted-foreground">
              <p>Vape Cave Smoke & Stuff</p>
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
