import { Link } from "wouter";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Instagram, Facebook } from "lucide-react";
import { SiTiktok } from "react-icons/si";

const footerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.5,
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

export function DeliveryFooter() {
  return (
    <motion.footer
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={footerVariants}
      className="bg-card border-t mt-auto"
    >
      <div className="container mx-auto px-4 py-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div variants={sectionVariants}>
            <img 
              src="/logo-orange.png" 
              alt="Vape Cave Smoke & Stuff - Frisco, TX" 
              className="h-4 w-auto mb-3"
            />
            <div className="flex items-center gap-2">
              <motion.a 
                href="https://www.instagram.com/vapecavetx" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,113,0,0.3)]"
                whileHover={{ scale: 1.15, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Instagram className="w-4 h-4" />
              </motion.a>
              <motion.a 
                href="https://www.facebook.com/vapecavetx" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,113,0,0.3)]"
                whileHover={{ scale: 1.15, rotate: -5 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Facebook className="w-4 h-4" />
              </motion.a>
              <motion.a 
                href="https://www.tiktok.com/@vapecavetx" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,113,0,0.3)]"
                whileHover={{ scale: 1.15, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <SiTiktok className="w-4 h-4" />
              </motion.a>
            </div>
          </motion.div>

          <motion.div variants={sectionVariants}>
            <h3 className="font-semibold mb-2 text-sm">Contact</h3>
            <ul className="space-y-1 text-xs">
              <li>
                <motion.a 
                  href="mailto:vapecavetex@gmail.com" 
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-all duration-200"
                  whileHover={{ x: 3 }}
                  transition={{ duration: 0.2 }}
                >
                  <Mail className="h-3 w-3" />
                  vapecavetex@gmail.com
                </motion.a>
              </li>
              <li>
                <motion.a 
                  href="tel:+14692940061" 
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-all duration-200"
                  whileHover={{ x: 3 }}
                  transition={{ duration: 0.2 }}
                >
                  <Phone className="h-3 w-3" />
                  (469) 294-0061
                </motion.a>
              </li>
              <li>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  6958 Main St #200, Frisco, TX 75033
                </span>
              </li>
            </ul>
          </motion.div>

          <motion.div variants={sectionVariants}>
            <h3 className="font-semibold mb-2 text-sm">Quick Links</h3>
            <ul className="space-y-1 text-xs">
              <li>
                <Link href="/delivery/shop">
                  <motion.span 
                    className="text-muted-foreground hover:text-primary transition-all duration-200 inline-block"
                    whileHover={{ x: 3 }}
                    transition={{ duration: 0.2 }}
                  >
                    Shop Products
                  </motion.span>
                </Link>
              </li>
              <li>
                <Link href="/delivery/account">
                  <motion.span 
                    className="text-muted-foreground hover:text-primary transition-all duration-200 inline-block"
                    whileHover={{ x: 3 }}
                    transition={{ duration: 0.2 }}
                  >
                    My Account
                  </motion.span>
                </Link>
              </li>
              <li>
                <Link href="/delivery/help">
                  <motion.span 
                    className="text-muted-foreground hover:text-primary transition-all duration-200 inline-block"
                    whileHover={{ x: 3 }}
                    transition={{ duration: 0.2 }}
                  >
                    Help & Support
                  </motion.span>
                </Link>
              </li>
              <li>
                <Link href="/">
                  <motion.span 
                    className="text-muted-foreground hover:text-primary transition-all duration-200 inline-block"
                    whileHover={{ x: 3 }}
                    transition={{ duration: 0.2 }}
                  >
                    Back to Main Website
                  </motion.span>
                </Link>
              </li>
            </ul>
          </motion.div>

          <motion.div variants={sectionVariants}>
            <h3 className="font-semibold mb-2 text-sm">We Accept</h3>
            <div className="flex items-center gap-1.5 flex-wrap">
              {["VISA", "MC", "AMEX", "Apple Pay", "Google Pay"].map((payment, index) => (
                <motion.span 
                  key={payment}
                  className="bg-muted rounded px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground hover:bg-primary/20 hover:text-primary transition-all duration-200"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.05, duration: 0.3 }}
                  whileHover={{ scale: 1.05 }}
                >
                  {payment}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div 
          variants={sectionVariants}
          className="border-t mt-4 pt-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
        >
          <div className="flex flex-wrap gap-3 text-xs">
            {[
              { href: "/terms", label: "Terms of Service" },
              { href: "/privacy", label: "Privacy Policy" },
              { href: "/refund-policy", label: "Refund Policy" },
            ].map((link) => (
              <Link key={link.href} href={link.href}>
                <motion.span 
                  className="text-muted-foreground hover:text-primary transition-all duration-200"
                  whileHover={{ y: -1 }}
                  transition={{ duration: 0.2 }}
                >
                  {link.label}
                </motion.span>
              </Link>
            ))}
          </div>
          <div className="text-xs text-muted-foreground">
            <span>&copy; {new Date().getFullYear()} Vape Cave Smoke &amp; Stuff. Must be 21+ to purchase.</span>
          </div>
        </motion.div>
      </div>
    </motion.footer>
  );
}
