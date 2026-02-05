import { Link } from "wouter";
import { Instagram, Facebook, Twitter, MapPin, Phone, Mail } from "lucide-react";
import Logo from "./Logo";

export function GlobalFooter() {
  const currentYear = new Date().getFullYear();

  const navigationLinks = [
    { label: "Home", href: "/" },
    { label: "Products", href: "/products" },
    { label: "Locations", href: "/frisco" },
    { label: "Blog", href: "/blog" },
  ];

  const supportLinks = [
    { label: "Contact Us", href: "/contact" },
    { label: "FAQ", href: "/faq" },
    { label: "Reviews", href: "/reviews" },
  ];

  const legalLinks = [
    { label: "Terms of Service", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
  ];

  const socialLinks = [
    { icon: Instagram, href: "https://instagram.com/vapecavetx", label: "Instagram" },
    { icon: Facebook, href: "https://facebook.com/vapecavetx", label: "Facebook" },
    { icon: Twitter, href: "https://twitter.com/vapecavetx", label: "Twitter" },
  ];

  return (
    <footer className="bg-gradient-to-b from-background via-background to-black/40 border-t border-border/30 mt-auto relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="flex flex-col items-center text-center mb-12">
          <Logo variant="black" location="footer" />
          
          <div className="flex items-center gap-4 mt-6">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-110"
                aria-label={social.label}
              >
                <social.icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
          <div className="text-center md:text-left">
            <h3 className="text-foreground font-semibold mb-4 text-sm uppercase tracking-wider">Navigate</h3>
            <ul className="space-y-3">
              {navigationLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-center md:text-left">
            <h3 className="text-foreground font-semibold mb-4 text-sm uppercase tracking-wider">Support</h3>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-center md:text-left">
            <h3 className="text-foreground font-semibold mb-4 text-sm uppercase tracking-wider">Legal</h3>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-center md:text-left">
            <h3 className="text-foreground font-semibold mb-4 text-sm uppercase tracking-wider">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground text-sm">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                <span>Frisco, TX</span>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground text-sm">
                <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                <a href="tel:+14697148888" className="hover:text-primary transition-colors duration-200">
                  (469) 714-8888
                </a>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground text-sm">
                <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                <a href="mailto:info@vapecavetx.com" className="hover:text-primary transition-colors duration-200">
                  info@vapecavetx.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/30 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground text-xs md:text-sm">
              © {currentYear} Vape Cave TX. All rights reserved.
            </p>
            <p className="text-muted-foreground/60 text-xs">
              Must be 21+ to purchase. Please vape responsibly.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
