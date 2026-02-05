import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, CreditCard, Lock, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

declare global {
  interface Window {
    Clover: any;
  }
}

interface CloverPaymentFormProps {
  publicKey: string;
  onTokenCreate: (token: string) => void;
  onError: (error: string) => void;
  isProcessing?: boolean;
}

export default function CloverPaymentForm({
  publicKey,
  onTokenCreate,
  onError,
  isProcessing = false,
}: CloverPaymentFormProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [cardErrors, setCardErrors] = useState<{ [key: string]: string }>({});
  const cloverRef = useRef<any>(null);
  const elementsRef = useRef<any>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    // Load Clover SDK script with retry
    const loadCloverSDK = async (retryCount = 0) => {
      console.log("Checking for Clover SDK...", { 
        cloverExists: !!window.Clover,
        cloverType: typeof window.Clover 
      });
      
      // Check if already loaded (from HTML or previous load)
      if (window.Clover) {
        console.log("Clover SDK already loaded, initializing...");
        initializeClover();
        return;
      }

      // Check if script is loading from HTML head
      const existingScript = document.querySelector('script[src*="clover.com/sdk.js"]');
      console.log("Script element found:", !!existingScript);
      
      if (existingScript) {
        // Wait for existing script to load
        let attempts = 0;
        const maxAttempts = 100; // 20 seconds total
        const checkClover = setInterval(() => {
          attempts++;
          console.log(`Checking for Clover (attempt ${attempts}):`, !!window.Clover);
          if (window.Clover) {
            clearInterval(checkClover);
            console.log("Clover SDK loaded from HTML, initializing...");
            initializeClover();
          } else if (attempts >= maxAttempts) {
            clearInterval(checkClover);
            console.error("Clover SDK failed to load after 20 seconds. window.Clover =", window.Clover);
            setSdkError("Payment SDK loading timed out. Please try Cash on Delivery or contact us.");
            setIsLoading(false);
          }
        }, 200);
        return;
      }

      // Fallback: dynamically load script if not in HTML
      const script = document.createElement("script");
      script.src = "https://checkout.clover.com/sdk.js";
      script.async = true;
      script.crossOrigin = "anonymous";
      
      script.onload = () => {
        setTimeout(() => {
          initializeClover();
        }, 100);
      };
      
      script.onerror = () => {
        if (retryCount < 2) {
          console.log(`Clover SDK load attempt ${retryCount + 1} failed, retrying...`);
          setTimeout(() => loadCloverSDK(retryCount + 1), 1000);
        } else {
          setSdkError("Failed to load payment SDK. Please refresh the page or try again later.");
          setIsLoading(false);
        }
      };
      document.head.appendChild(script);
    };

    const initializeClover = () => {
      try {
        if (!window.Clover) {
          setSdkError("Payment SDK not available.");
          setIsLoading(false);
          return;
        }

        const clover = new window.Clover(publicKey);
        cloverRef.current = clover;

        const elements = clover.elements();
        elementsRef.current = elements;

        const styles = {
          body: {
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontSize: "16px",
          },
          input: {
            fontSize: "16px",
            padding: "12px",
            border: "1px solid hsl(var(--border))",
            borderRadius: "6px",
            backgroundColor: "hsl(var(--background))",
            color: "hsl(var(--foreground))",
          },
          "input:focus": {
            border: "1px solid hsl(var(--primary))",
            outline: "none",
          },
          "input.invalid": {
            border: "1px solid hsl(var(--destructive))",
          },
        };

        // Create and mount elements
        const cardNumber = elements.create("CARD_NUMBER", styles);
        const cardDate = elements.create("CARD_DATE", styles);
        const cardCvv = elements.create("CARD_CVV", styles);
        const cardPostalCode = elements.create("CARD_POSTAL_CODE", styles);

        // Add event listeners for validation
        cardNumber.addEventListener("change", (event: any) => {
          handleCardEvent("cardNumber", event);
        });
        cardDate.addEventListener("change", (event: any) => {
          handleCardEvent("cardDate", event);
        });
        cardCvv.addEventListener("change", (event: any) => {
          handleCardEvent("cardCvv", event);
        });
        cardPostalCode.addEventListener("change", (event: any) => {
          handleCardEvent("cardPostalCode", event);
        });

        // Wait for DOM elements
        setTimeout(() => {
          const cardNumberEl = document.getElementById("clover-card-number");
          const cardDateEl = document.getElementById("clover-card-date");
          const cardCvvEl = document.getElementById("clover-card-cvv");
          const cardPostalEl = document.getElementById("clover-card-postal");

          if (cardNumberEl) cardNumber.mount("#clover-card-number");
          if (cardDateEl) cardDate.mount("#clover-card-date");
          if (cardCvvEl) cardCvv.mount("#clover-card-cvv");
          if (cardPostalEl) cardPostalCode.mount("#clover-card-postal");

          setIsLoading(false);
        }, 100);
      } catch (error) {
        console.error("Error initializing Clover:", error);
        setSdkError("Failed to initialize payment form.");
        setIsLoading(false);
      }
    };

    loadCloverSDK();

    return () => {
      // Cleanup if needed
    };
  }, [publicKey]);

  const handleCardEvent = (field: string, event: any) => {
    if (event.CARD_NUMBER_ERROR || event.CARD_DATE_ERROR || event.CARD_CVV_ERROR || event.CARD_POSTAL_CODE_ERROR) {
      setCardErrors((prev) => ({
        ...prev,
        [field]: event.error?.message || "Invalid input",
      }));
    } else {
      setCardErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Expose createToken method
  const createToken = async (): Promise<string | null> => {
    if (!cloverRef.current) {
      onError("Payment form not initialized");
      return null;
    }

    try {
      const result = await cloverRef.current.createToken();
      
      if (result.errors) {
        const errorMessages = Object.values(result.errors).join(", ");
        onError(errorMessages || "Invalid card details");
        return null;
      }

      if (result.token) {
        onTokenCreate(result.token);
        return result.token;
      }

      onError("Failed to create payment token");
      return null;
    } catch (error: any) {
      onError(error.message || "Payment processing error");
      return null;
    }
  };

  // Attach createToken to window for parent component access
  useEffect(() => {
    (window as any).cloverCreateToken = createToken;
    return () => {
      delete (window as any).cloverCreateToken;
    };
  }, []);

  if (sdkError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{sdkError}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="h-5 w-5" />
          Card Details
          <Lock className="h-4 w-4 text-muted-foreground ml-auto" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading secure payment form...</span>
          </div>
        )}

        <div className={isLoading ? "hidden" : "space-y-4"}>
          <div className="space-y-2">
            <Label htmlFor="clover-card-number">Card Number</Label>
            <div
              id="clover-card-number"
              className="min-h-[46px] rounded-md border bg-background"
              data-testid="input-card-number"
            />
            {cardErrors.cardNumber && (
              <p className="text-sm text-destructive">{cardErrors.cardNumber}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clover-card-date">Expiry</Label>
              <div
                id="clover-card-date"
                className="min-h-[46px] rounded-md border bg-background"
                data-testid="input-card-date"
              />
              {cardErrors.cardDate && (
                <p className="text-sm text-destructive">{cardErrors.cardDate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="clover-card-cvv">CVV</Label>
              <div
                id="clover-card-cvv"
                className="min-h-[46px] rounded-md border bg-background"
                data-testid="input-card-cvv"
              />
              {cardErrors.cardCvv && (
                <p className="text-sm text-destructive">{cardErrors.cardCvv}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="clover-card-postal">ZIP Code</Label>
              <div
                id="clover-card-postal"
                className="min-h-[46px] rounded-md border bg-background"
                data-testid="input-card-postal"
              />
              {cardErrors.cardPostalCode && (
                <p className="text-sm text-destructive">{cardErrors.cardPostalCode}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
          <Lock className="h-3 w-3" />
          <span>Your payment is secured with industry-standard encryption</span>
        </div>
      </CardContent>
    </Card>
  );
}
