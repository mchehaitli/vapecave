import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import MainLayout from "@/layouts/MainLayout";

export default function DeliverySetPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Get token from URL query parameter
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    
    if (!tokenParam) {
      setValidating(false);
      setTokenValid(false);
      return;
    }
    
    setToken(tokenParam);
    
    // Validate token with backend
    const validateToken = async () => {
      try {
        const response = await fetch(`/api/delivery/validate-setup-token?token=${tokenParam}`);
        
        if (!response.ok) {
          setTokenValid(false);
          setValidating(false);
          return;
        }
        
        const data = await response.json();
        setCustomerName(data.fullName);
        setTokenValid(true);
      } catch (error) {
        console.error("Error validating token:", error);
        setTokenValid(false);
      } finally {
        setValidating(false);
      }
    };

    validateToken();
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.newPassword) {
      newErrors.newPassword = "Password is required";
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !token) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await fetch("/api/delivery/set-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password: formData.newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to set password");
      }

      toast({
        title: "Password Set Successfully",
        description: "You can now log in with your new password.",
      });

      // Redirect to login page
      setTimeout(() => {
        setLocation("/signin");
      }, 1500);
    } catch (error: any) {
      console.error("Password set error:", error);
      
      toast({
        title: "Error",
        description: error.message || "Failed to set password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <MainLayout
        title="Set Your Password - Vape Cave Smoke & Stuff Delivery"
        description="Create your password for Vape Cave Smoke & Stuff delivery account"
        canonical="/delivery/set-password"
      >
        <div className="min-h-[80vh] bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Validating your link...</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (!tokenValid) {
    return (
      <MainLayout
        title="Invalid Link - Vape Cave Smoke & Stuff Delivery"
        description="Password setup link is invalid or expired"
        canonical="/delivery/set-password"
      >
        <div className="min-h-[80vh] bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <Card>
              <CardHeader>
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <CardTitle className="text-2xl text-center">Invalid or Expired Link</CardTitle>
                <CardDescription className="text-center">
                  This password setup link is invalid or has expired
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground mb-6">
                  Password setup links expire after 48 hours for security reasons.
                </p>
                <Button
                  onClick={() => setLocation("/signin")}
                  className="w-full"
                  data-testid="button-back-to-login"
                >
                  Back to Login
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      title="Set Your Password - Vape Cave Smoke & Stuff Delivery"
      description="Create your password for Vape Cave Smoke & Stuff delivery account"
      canonical="/delivery/set-password"
    >
      <div className="min-h-[80vh] bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Create Your Password</CardTitle>
              <CardDescription>
                Welcome, {customerName}! Set your password to get started.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      placeholder="Enter your password"
                      className="pl-10 pr-10"
                      data-testid="input-new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      data-testid="button-toggle-new-password"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-sm text-destructive" data-testid="error-new-password">
                      {errors.newPassword}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 6 characters long
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Confirm your password"
                      className="pl-10 pr-10"
                      data-testid="input-confirm-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      data-testid="button-toggle-confirm-password"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive" data-testid="error-confirm-password">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                  data-testid="button-set-password"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Password...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Create Password
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </MainLayout>
  );
}
