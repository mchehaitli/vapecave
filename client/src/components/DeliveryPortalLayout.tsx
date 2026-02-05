import { useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, LogOut, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useInactivityTimeout } from "@/hooks/useInactivityTimeout";

interface DeliveryPortalLayoutProps {
  children: React.ReactNode;
  showBackButton?: boolean;
  backPath?: string;
  title?: string;
}

export function DeliveryPortalLayout({
  children,
  showBackButton = true,
  backPath,
  title,
}: DeliveryPortalLayoutProps) {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  useInactivityTimeout({
    timeoutMinutes: 30,
    warningMinutes: 2,
  });

  const handleBack = () => {
    if (backPath) {
      setLocation(backPath);
    } else {
      window.history.back();
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/delivery/logout", {
        method: "POST",
        credentials: "include",
      });
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully.",
      });
      setLocation("/delivery/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isHomePage = location === "/delivery/shop" || location === "/delivery/shop";

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {showBackButton && !isHomePage && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="mr-2"
                data-testid="button-back"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            {isHomePage && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocation("/delivery/shop")}
                className="mr-2"
                data-testid="button-home"
              >
                <Home className="h-5 w-5" />
              </Button>
            )}
            {title && <h1 className="text-lg font-semibold">{title}</h1>}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-destructive"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
      
      <div className="pt-14">
        {children}
      </div>
    </div>
  );
}
