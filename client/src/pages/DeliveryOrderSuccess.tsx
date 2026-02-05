import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { DeliveryHeader } from "@/components/DeliveryHeader";
import { DeliveryCategoryNav } from "@/components/DeliveryCategoryNav";

export default function DeliveryOrderSuccess() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [orderId, setOrderId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("session");

    if (!sessionId) {
      setStatus("error");
      setErrorMessage("No payment session found. Please contact support.");
      return;
    }

    const verifyPayment = async () => {
      try {
        const response = await fetch(`/api/delivery/verify-payment?session=${sessionId}`, {
          credentials: "include",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Payment verification failed");
        }

        const data = await response.json();
        setOrderId(data.orderId);
        setStatus("success");

        setTimeout(() => {
          setLocation(`/delivery/order-confirmation/${data.orderId}`);
        }, 2000);
      } catch (error: any) {
        setStatus("error");
        setErrorMessage(error.message || "Failed to verify payment");
      }
    };

    verifyPayment();
  }, [setLocation]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted flex flex-col">
        <DeliveryHeader showSearch={false} />
        <DeliveryCategoryNav />
        <div className="flex-1 py-12">
          <div className="container mx-auto px-4 max-w-lg">
            <Card className="text-center py-16">
              <CardContent>
                <Loader2 className="mx-auto h-16 w-16 animate-spin text-primary mb-6" />
                <h2 className="text-2xl font-bold mb-2">Verifying Payment...</h2>
                <p className="text-muted-foreground">
                  Please wait while we confirm your payment.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted flex flex-col">
        <DeliveryHeader showSearch={false} />
        <DeliveryCategoryNav />
        <div className="flex-1 py-12">
          <div className="container mx-auto px-4 max-w-lg">
            <Card className="text-center py-16">
              <CardContent>
                <XCircle className="mx-auto h-16 w-16 text-destructive mb-6" />
                <h2 className="text-2xl font-bold mb-2">Payment Issue</h2>
                <p className="text-muted-foreground mb-6">{errorMessage}</p>
                <div className="flex gap-4 justify-center">
                  <Button onClick={() => setLocation("/delivery/checkout")} data-testid="button-try-again">
                    Try Again
                  </Button>
                  <Button variant="outline" onClick={() => setLocation("/delivery/shop")} data-testid="button-back-to-shop">
                    Back to Shop
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex flex-col">
      <DeliveryHeader showSearch={false} />
      <DeliveryCategoryNav />
      <div className="flex-1 py-12">
        <div className="container mx-auto px-4 max-w-lg">
          <Card className="text-center py-16">
            <CardContent>
              <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-6" />
              <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
              <p className="text-muted-foreground mb-4">
                Your order has been placed. Redirecting to order details...
              </p>
              <Button onClick={() => setLocation(`/delivery/order-confirmation/${orderId}`)} data-testid="button-view-order">
                View Order
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
