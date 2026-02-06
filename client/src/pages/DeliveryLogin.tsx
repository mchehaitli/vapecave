import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation, Link } from "wouter";
import MainLayout from "@/layouts/MainLayout";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
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

export default function DeliveryLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Login with email and password
      const response = await apiRequest("POST", "/api/delivery/login", {
        email: formData.email,
        password: formData.password,
      });
      
      const data = await response.json();
      
      // Check if user must change password (e.g., after password reset)
      if (data.mustChangePassword) {
        toast({
          title: "Password Change Required",
          description: "Please create a new password to continue.",
        });
        setLocation("/delivery/change-password");
        return;
      }
      
      // Redirect to delivery home page
      toast({
        title: "Welcome back!",
        description: "You've successfully logged in.",
      });
      setLocation("/delivery/home");
    } catch (error: any) {
      console.error("Login error:", error);
      
      let errorMessage = "Failed to login. Please try again.";
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout
      title="Delivery Login - Vape Cave Smoke & Stuff"
      description="Sign in to your Vape Cave Smoke & Stuff delivery account to browse products and place orders."
      canonical="/signin"
    >
      <div className="min-h-[80vh] bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full max-w-md p-6 rounded-xl bg-card border-2 border-primary/50 shadow-[0_0_20px_rgba(255,113,0,0.3),0_0_40px_rgba(255,113,0,0.15)]"
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="mb-6">
              <h1 className="text-2xl font-bold text-foreground mb-2">Delivery Login</h1>
              <p className="text-muted-foreground">
                Sign in to access your delivery account
              </p>
            </motion.div>
            <form onSubmit={handleLogin} className="space-y-4">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 transition-colors group-focus-within:text-primary" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    className="pl-10 transition-all duration-300 focus:shadow-[0_0_15px_rgba(255,113,0,0.2)]"
                    required
                    data-testid="input-email"
                  />
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 transition-colors group-focus-within:text-primary" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="pl-10 pr-10 transition-all duration-300 focus:shadow-[0_0_15px_rgba(255,113,0,0.2)]"
                    required
                    data-testid="input-password"
                  />
                  <motion.button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </motion.button>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="flex items-center justify-between text-sm">
                <Link href="/delivery/reset-password" className="text-primary hover:underline hover:text-primary/80 transition-colors" data-testid="link-reset-password">
                  Forgot password?
                </Link>
                <Link href="/register" className="text-primary hover:underline hover:text-primary/80 transition-colors" data-testid="link-signup">
                  Sign up
                </Link>
              </motion.div>

              <motion.div variants={itemVariants}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    type="submit"
                    className="w-full transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,113,0,0.3)]"
                    disabled={loading || !formData.email || !formData.password}
                    data-testid="button-login"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      "Login"
                    )}
                  </Button>
                </motion.div>
              </motion.div>
            </form>
          </motion.div>
        </motion.div>
      </div>
    </MainLayout>
  );
}
