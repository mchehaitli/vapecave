import { motion } from "framer-motion";
import { UserPlus, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import MainLayout from "@/layouts/MainLayout";

export default function SignupPage() {
  const [, setLocation] = useLocation();

  return (
    <MainLayout
      title="Sign Up or Sign In | Vape Cave Smoke & Stuff"
      description="Create an account or sign in to shop at Vape Cave Smoke & Stuff. Our account system works for both delivery and in-store pickup customers."
    >
      <div className="min-h-screen bg-background py-12 px-4 flex items-center justify-center">
        <div className="container mx-auto max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="p-6 rounded-xl bg-card border-2 border-primary/50 shadow-[0_0_20px_rgba(255,113,0,0.3),0_0_40px_rgba(255,113,0,0.15)]"
          >
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Welcome to Vape Cave Smoke & Stuff
              </h1>
              <p className="text-muted-foreground">
                Create an account or sign in to view pricing and shop our products. One account works for both delivery and in-store pickup.
              </p>
            </div>
            <div className="space-y-4">
                <Button
                  onClick={() => setLocation("/register")}
                  className="w-full bg-primary hover:bg-primary/90 text-black font-semibold py-6 text-lg"
                  data-testid="button-create-account"
                >
                  <UserPlus className="mr-2 h-5 w-5" />
                  Sign Up
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Already have an account?
                    </span>
                  </div>
                </div>
                
                <Button
                  onClick={() => setLocation("/signin")}
                  variant="outline"
                  className="w-full border-primary/50 text-foreground hover:bg-primary/10 hover:border-primary py-6 text-lg"
                  data-testid="button-signin"
                >
                  <LogIn className="mr-2 h-5 w-5" />
                  Sign In
                </Button>
                
                <div className="mt-6 pt-6 border-t border-border text-center">
                  <p className="text-muted-foreground text-sm">
                    Need help? {" "}
                    <a href="/contact" className="text-primary hover:underline">
                      Contact Us
                    </a>.
                  </p>
                </div>
            </div>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
