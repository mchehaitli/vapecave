import { motion } from "framer-motion";
import { Package, Truck, Clock, Shield, MapPin, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { useDeliveryRadiusMiles } from "@/hooks/useSettings";
import MainLayout from "@/layouts/MainLayout";

export default function DeliveryLanding() {
  const [, setLocation] = useLocation();
  const deliveryRadiusMiles = useDeliveryRadiusMiles();

  // If user is already authenticated, redirect to portal
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/delivery/customers/me", {
          credentials: "include",
        });
        if (response.ok) {
          setLocation("/delivery/home");
        }
      } catch (error) {
        // Not authenticated, stay on landing page
      }
    };
    checkAuth();
  }, [setLocation]);

  const features = [
    {
      icon: <Truck className="w-8 h-8" />,
      title: "Same Day Delivery",
      description: "Get your order delivered within your scheduled time window"
    },
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: "Free Delivery Over $99",
      description: "No delivery fees when you spend $99 or more"
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Daily Delivery Slots",
      description: "Choose the time slot that works best for you, daily up until 10pm"
    },
    {
      icon: <MapPin className="w-8 h-8" />,
      title: `${deliveryRadiusMiles}-Mile Radius`,
      description: `Available for delivery within ${deliveryRadiusMiles} miles of our Frisco store location`
    },
    {
      icon: <Package className="w-8 h-8" />,
      title: "Wide Selection",
      description: "Browse hundreds of products"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Age Verification",
      description: "We take age verification seriously, ID required for sign-up and delivery"
    }
  ];

  return (
    <MainLayout
      title="Delivery Service - Vape Cave"
      description={`Order our products for delivery within ${deliveryRadiusMiles} miles of Frisco, TX. Fast, convenient, and reliable delivery service.`}
      canonical="/delivery"
    >
      <div className="min-h-[80vh] bg-background" data-testid="delivery-landing">
        <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-4 leading-tight text-foreground">
            <span className="text-primary">DELIVERY</span> COMING <span className="text-primary">SOON</span>
          </h1>
          
          <p className="text-xs md:text-base lg:text-lg mb-8 max-w-4xl mx-auto leading-relaxed text-foreground">
            [ Sign up now to be one of the first to know when our <span className="text-primary">SAME DAY</span> delivery services begin ]
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                size="lg"
                className="px-8 py-6 text-lg w-full sm:w-auto"
                onClick={() => setLocation("/register")}
                data-testid="button-signup"
              >
                Sign Up
              </Button>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-6 text-lg w-full sm:w-auto"
                onClick={() => setLocation("/signin")}
                data-testid="button-signin"
              >
                Sign In
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold text-center mb-10 text-foreground">Why Choose Delivery?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  boxShadow: [
                    '0 0 15px rgba(255, 113, 0, 0.2), 0 0 30px rgba(255, 113, 0, 0.1)',
                    '0 0 25px rgba(255, 113, 0, 0.4), 0 0 50px rgba(255, 113, 0, 0.2)',
                    '0 0 15px rgba(255, 113, 0, 0.2), 0 0 30px rgba(255, 113, 0, 0.1)',
                  ]
                }}
                transition={{
                  opacity: { delay: 0.5 + index * 0.1 },
                  y: { delay: 0.5 + index * 0.1 },
                  boxShadow: {
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="h-full rounded-lg p-6 bg-card border-2 border-primary/50"
              >
                <div className="text-primary mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-20"
        >
          <h2 className="text-3xl font-bold text-center mb-10 text-foreground">How It Works</h2>
          
          <div className="max-w-3xl mx-auto space-y-6">
            {[
              { step: "1", title: "Create Account", description: "Sign up and verify your age with a valid photo ID" },
              { step: "2", title: "Wait for Approval", description: "Our team will review and approve your account within 24 hours" },
              { step: "3", title: "Browse & Order", description: "Shop our full catalog and add items to your cart" },
              { step: "4", title: "Schedule Delivery", description: "Choose a convenient delivery window for your order" },
              { step: "5", title: "Receive Your Order", description: "Get your products delivered right to your door" }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + index * 0.1 }}
                className="flex items-start gap-4"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-black flex items-center justify-center font-bold text-xl">
                  {step.step}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-1 text-foreground">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.6 }}
          className="mt-20 text-center"
        >
          <motion.div 
            className="p-8 rounded-xl bg-card border-2 border-primary/50 shadow-[0_0_20px_rgba(255,113,0,0.3),0_0_40px_rgba(255,113,0,0.15)]"
          >
            <h2 className="text-3xl font-bold mb-4 text-foreground">Ready to Get Started?</h2>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join hundreds of satisfied customers who enjoy the convenience of Vape Cave delivery service.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="px-8 py-6 text-lg"
                onClick={() => setLocation("/register")}
                data-testid="button-signup-bottom"
              >
                Sign Up Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-6 text-lg bg-background border-primary/50 text-foreground hover:bg-primary/10"
                onClick={() => setLocation("/signin")}
                data-testid="button-signin-bottom"
              >
                Already Have an Account? Sign In
              </Button>
            </div>
          </motion.div>
        </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
