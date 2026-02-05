import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useInactivityTimeout } from "@/hooks/useInactivityTimeout";
import { DeliveryHeader } from "@/components/DeliveryHeader";
import { DeliveryCategoryNav } from "@/components/DeliveryCategoryNav";
import { Calendar, Clock, MapPin, ShoppingBag, CreditCard, Loader2, CheckCircle, Banknote, Home, Tag, X, AlertTriangle, MessageSquare, DollarSign } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DeliveryFooter } from "@/components/DeliveryFooter";

interface CartItem {
  id: number;
  customerId: number;
  productId: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    price: string;
    image: string;
    category: string;
  };
}

interface DeliveryWindow {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  currentBookings: number;
  enabled: boolean;
  isClosed?: boolean;
  closedReason?: string | null;
}

interface Customer {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

interface CloverConfig {
  publicKey: string | null;
  isConfigured: boolean;
  hostedCheckoutConfigured: boolean;
  environment: string;
}

export default function DeliveryCheckout() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedWindowId, setSelectedWindowId] = useState<number | null>(null);

  useInactivityTimeout({
    timeoutMinutes: 30,
    warningMinutes: 2,
  });

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("cash");
  const [sameAsDelivery, setSameAsDelivery] = useState(true);
  const [billingAddress, setBillingAddress] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingState, setBillingState] = useState("");
  const [billingZipCode, setBillingZipCode] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoValidation, setPromoValidation] = useState<{
    valid: boolean;
    discountAmount?: number;
    promotionId?: number;
    errorMessage?: string;
    discountType?: string;
    discountValue?: number;
  } | null>(null);
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  
  // Pre-checkout popup state
  const [showPreCheckoutDialog, setShowPreCheckoutDialog] = useState(false);
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [cashPaymentType, setCashPaymentType] = useState<"exact" | "specify">("exact");
  const [cashPaymentAmount, setCashPaymentAmount] = useState("");

  // Fetch cart items
  const { data: cartItems = [], isLoading: isLoadingCart, error: cartError } = useQuery<CartItem[]>({
    queryKey: ['/api/delivery/cart'],
    queryFn: async () => {
      const response = await fetch('/api/delivery/cart', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch cart');
      return response.json();
    },
  });

  // Fetch customer info
  const { data: customer, isLoading: isLoadingCustomer, error: customerError } = useQuery<Customer>({
    queryKey: ['/api/delivery/customers/me'],
    queryFn: async () => {
      const response = await fetch('/api/delivery/customers/me', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch customer info');
      return response.json();
    },
  });

  // Fetch delivery windows
  const { data: deliveryWindows = [], isLoading: isLoadingWindows, error: windowsError } = useQuery<DeliveryWindow[]>({
    queryKey: ['/api/delivery/windows'],
    queryFn: async () => {
      const response = await fetch('/api/delivery/windows');
      if (!response.ok) throw new Error('Failed to fetch delivery windows');
      return response.json();
    },
  });

  // Fetch delivery fee settings with actual distance
  const { data: feeData, isLoading: isLoadingFeeSettings } = useQuery<{
    distance: number;
    feeType: string;
    flatFee: number;
    perMileFee: number;
    perItemFee: number;
    withinDeliveryZone: boolean;
    deliveryRadiusMiles: number;
    addressNeedsVerification?: boolean;
  }>({
    queryKey: ['/api/delivery/calculate-fee'],
    queryFn: async () => {
      const response = await fetch('/api/delivery/calculate-fee', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch delivery fee settings');
      }
      return response.json();
    },
  });

  // Fetch Clover config for payment
  const { data: cloverConfig } = useQuery<CloverConfig>({
    queryKey: ['/api/delivery/clover-config'],
    queryFn: async () => {
      const response = await fetch('/api/delivery/clover-config');
      if (!response.ok) throw new Error('Failed to fetch Clover config');
      return response.json();
    },
  });

  // Place order mutation
  const placeOrderMutation = useMutation({
    mutationFn: async (orderData: { 
      deliveryWindowId: number; 
      paymentMethod: string;
      paymentToken?: string;
      deliveryAddress: string;
      billingAddress?: string;
      billingCity?: string;
      billingState?: string;
      billingZipCode?: string;
      sameAsDelivery: boolean;
      subtotal: string;
      discount: string;
      promoCode?: string;
      promotionId?: number;
      tax: string;
      deliveryFee: string;
      total: string;
      notes?: string;
    }) => {
      const response = await fetch('/api/delivery/orders', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to place order');
      }
      return response.json();
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['/api/delivery/cart'] });
      toast({
        title: "Order Placed!",
        description: "Your order has been placed successfully.",
      });
      setLocation(`/delivery/order-confirmation/${order.id}`);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Order Failed",
        description: error.message || "Failed to place order. Please try again.",
      });
      setIsProcessingPayment(false);
    },
  });

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => {
    return sum + (parseFloat(item.product.price) * item.quantity);
  }, 0);

  // Calculate delivery fee based on settings and actual distance
  const calculateDeliveryFee = () => {
    if (!feeData) return 10;
    
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const distance = feeData.distance;
    
    switch (feeData.feeType) {
      case 'flat':
        return feeData.flatFee;
      case 'per_item':
        return feeData.perItemFee * totalItems;
      case 'per_mile':
        return feeData.perMileFee * distance;
      case 'combined':
        return (
          feeData.flatFee +
          feeData.perItemFee * totalItems +
          feeData.perMileFee * distance
        );
      default:
        return feeData.flatFee;
    }
  };

  const deliveryFee = calculateDeliveryFee();
  const deliveryDistance = feeData?.distance || 0;
  const discount = promoValidation?.valid ? (promoValidation.discountAmount || 0) : 0;
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const tax = discountedSubtotal * 0.0825;
  const total = discountedSubtotal + deliveryFee + tax;

  // Validate promo code handler
  const handleValidatePromoCode = async () => {
    if (!promoCode.trim()) {
      toast({
        variant: "destructive",
        title: "Promo Code Required",
        description: "Please enter a promo code.",
      });
      return;
    }

    setIsValidatingPromo(true);
    try {
      const response = await fetch('/api/delivery/promo/validate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode.trim(), subtotal }),
      });
      const result = await response.json();
      
      if (result.valid) {
        setPromoValidation({
          valid: true,
          discountAmount: result.discountAmount,
          promotionId: result.promotion?.id,
          discountType: result.promotion?.discountType,
          discountValue: parseFloat(result.promotion?.discountValue || "0"),
        });
        toast({
          title: "Promo Code Applied!",
          description: `You saved $${result.discountAmount.toFixed(2)}!`,
        });
      } else {
        setPromoValidation({ valid: false, errorMessage: result.errorMessage });
      }
    } catch (error) {
      setPromoValidation({ valid: false, errorMessage: "Failed to validate promo code" });
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handleRemovePromoCode = () => {
    setPromoCode("");
    setPromoValidation(null);
  };

  // Show pre-checkout dialog for notes and cash payment details
  const handlePlaceOrder = async () => {
    if (!selectedWindowId) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please select a delivery window.",
      });
      return;
    }

    if (!customer) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Customer information not loaded.",
      });
      return;
    }

    // Check if customer is within delivery zone
    if (feeData && !feeData.withinDeliveryZone) {
      toast({
        variant: "destructive",
        title: "Outside Delivery Zone",
        description: `We only deliver within ${feeData.deliveryRadiusMiles} miles of our store. Your address is ${feeData.distance.toFixed(1)} miles away. Please update your delivery address.`,
      });
      return;
    }

    // Reset popup state and show dialog
    setDeliveryNotes("");
    setCashPaymentType("exact");
    setCashPaymentAmount("");
    setShowPreCheckoutDialog(true);
  };

  // Build notes string including cash payment info
  const buildOrderNotes = () => {
    let notes = deliveryNotes.trim();
    
    if (selectedPaymentMethod === "cash") {
      const cashNote = cashPaymentType === "exact" 
        ? "CASH: Paying exact change" 
        : `CASH: Customer paying with $${cashPaymentAmount} - Please bring $${(parseFloat(cashPaymentAmount) - total).toFixed(2)} change`;
      
      notes = notes ? `${notes}\n\n${cashNote}` : cashNote;
    }
    
    return notes;
  };

  // Process order after popup confirmation
  const processOrder = async () => {
    // Validate cash payment amount if specified
    if (selectedPaymentMethod === "cash" && cashPaymentType === "specify") {
      const amount = parseFloat(cashPaymentAmount);
      if (isNaN(amount) || amount < total) {
        toast({
          variant: "destructive",
          title: "Invalid Amount",
          description: `Please enter an amount of at least $${total.toFixed(2)}`,
        });
        return;
      }
    }

    setShowPreCheckoutDialog(false);
    setIsProcessingPayment(true);

    const orderNotes = buildOrderNotes();

    // For credit card payments, use Clover Hosted Checkout redirect
    if (selectedPaymentMethod === "credit_card") {
      if (!cloverConfig?.hostedCheckoutConfigured) {
        toast({
          variant: "destructive",
          title: "Payment Not Available",
          description: "Credit card payments are not currently available. Please choose cash on delivery.",
        });
        setIsProcessingPayment(false);
        return;
      }

      try {
        // Create checkout session and redirect to Clover hosted checkout
        const response = await fetch('/api/delivery/create-checkout-session', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            deliveryWindowId: selectedWindowId,
            deliveryFee: deliveryFee.toFixed(2),
            promoCode: promoValidation?.valid ? promoCode.trim().toUpperCase() : undefined,
            notes: orderNotes,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create checkout session');
        }

        const { checkoutUrl } = await response.json();
        
        // Redirect to Clover's hosted checkout page
        window.location.href = checkoutUrl;
        return;
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Payment Error",
          description: error.message || "Failed to initiate payment. Please try again.",
        });
        setIsProcessingPayment(false);
        return;
      }
    }

    // For cash payments, use the existing flow
    const deliveryAddress = `${customer!.address}, ${customer!.city}, ${customer!.state} ${customer!.zipCode}`;

    placeOrderMutation.mutate({
      deliveryWindowId: selectedWindowId!,
      paymentMethod: selectedPaymentMethod,
      deliveryAddress,
      billingAddress: sameAsDelivery ? undefined : billingAddress,
      billingCity: sameAsDelivery ? undefined : billingCity,
      billingState: sameAsDelivery ? undefined : billingState,
      billingZipCode: sameAsDelivery ? undefined : billingZipCode,
      sameAsDelivery,
      subtotal: subtotal.toFixed(2),
      discount: discount.toFixed(2),
      promoCode: promoValidation?.valid ? promoCode.trim().toUpperCase() : undefined,
      promotionId: promoValidation?.promotionId,
      tax: tax.toFixed(2),
      deliveryFee: deliveryFee.toFixed(2),
      total: total.toFixed(2),
      notes: orderNotes,
    });
  };

  const isLoading = isLoadingCart || isLoadingCustomer || isLoadingWindows || isLoadingFeeSettings;
  const hasError = cartError || customerError || windowsError;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card className="text-center py-16">
            <CardContent>
              <div className="text-destructive mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold mb-2">Error Loading Checkout</h2>
              <p className="text-muted-foreground mb-6">
                {(cartError as Error)?.message || (customerError as Error)?.message || (windowsError as Error)?.message || 'Failed to load checkout data'}
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => window.location.reload()} data-testid="button-retry">
                  Try Again
                </Button>
                <Button variant="outline" onClick={() => setLocation('/delivery/shop')} data-testid="button-back-to-shop-error">
                  Back to Shop
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card className="text-center py-16">
            <CardContent>
              <ShoppingBag className="mx-auto h-24 w-24 text-muted-foreground mb-4" />
              <h2 className="text-3xl font-bold mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground mb-6">
                Add some items to your cart before checking out.
              </p>
              <Button onClick={() => setLocation('/delivery/shop')} data-testid="button-back-to-shop">
                Continue Shopping
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Group windows by date
  const windowsByDate = deliveryWindows
    .filter(w => w.enabled && w.currentBookings < w.capacity)
    .reduce((acc, window) => {
      if (!acc[window.date]) {
        acc[window.date] = [];
      }
      acc[window.date].push(window);
      return acc;
    }, {} as Record<string, DeliveryWindow[]>);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DeliveryHeader cartItemCount={cartItems.length} showSearch={false} showBackButton={true} />
      <DeliveryCategoryNav />

      <div className="flex-1 py-6">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2" data-testid="text-page-title">Checkout</h1>
            <p className="text-muted-foreground">
              Review your order and complete your purchase
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Delivery Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                {customer && (
                  <div className="space-y-2" data-testid="section-delivery-address">
                    <p className="font-semibold">{customer.fullName}</p>
                    <p>{customer.address}</p>
                    <p>{customer.city}, {customer.state} {customer.zipCode}</p>
                    <p className="text-muted-foreground">{customer.phone}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Delivery Window Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Select Delivery Window
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Schedule your delivery up to 5 days ahead. Windows close 1 hour before delivery time.
                </p>
              </CardHeader>
              <CardContent>
                {Object.keys(windowsByDate).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="mx-auto h-12 w-12 mb-2" />
                    <p>No delivery windows available for the next 5 days.</p>
                    <p className="text-sm mt-2">Please check back later or contact us for assistance.</p>
                  </div>
                ) : (
                  <RadioGroup
                    value={selectedWindowId?.toString()}
                    onValueChange={(value) => setSelectedWindowId(parseInt(value))}
                  >
                    <div className="space-y-4">
                      {Object.entries(windowsByDate).map(([date, windows]) => (
                        <div key={date} className="space-y-2">
                          <h3 className="font-semibold text-sm text-muted-foreground">
                            {new Date(date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </h3>
                          {windows.map((window) => {
                            const isWindowClosed = window.isClosed || (window.capacity - window.currentBookings) <= 0;
                            const isDisabled = isWindowClosed;
                            
                            return (
                              <div
                                key={window.id}
                                className={`flex items-center space-x-2 p-3 border rounded-lg ${
                                  isDisabled 
                                    ? 'opacity-50 cursor-not-allowed bg-muted' 
                                    : 'hover:bg-accent cursor-pointer'
                                }`}
                                data-testid={`radio-window-${window.id}`}
                              >
                                <RadioGroupItem
                                  value={window.id.toString()}
                                  id={`window-${window.id}`}
                                  disabled={isDisabled}
                                  data-testid={`radio-button-window-${window.id}`}
                                />
                                <Label
                                  htmlFor={`window-${window.id}`}
                                  className={`flex-1 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-4 w-4 text-muted-foreground" />
                                      <span className="font-medium">
                                        {window.startTime} - {window.endTime}
                                      </span>
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                      {window.isClosed ? (
                                        <span className="text-destructive">Closed</span>
                                      ) : (window.capacity - window.currentBookings) <= 0 ? (
                                        <span className="text-destructive">Full</span>
                                      ) : (
                                        `${window.capacity - window.currentBookings} slots left`
                                      )}
                                    </span>
                                  </div>
                                  {window.isClosed && window.closedReason && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {window.closedReason}
                                    </p>
                                  )}
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                )}
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  value={selectedPaymentMethod}
                  onValueChange={setSelectedPaymentMethod}
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent">
                      <RadioGroupItem value="cash" id="cash" data-testid="radio-payment-cash" />
                      <Label htmlFor="cash" className="flex-1 cursor-pointer flex items-center gap-2">
                        <Banknote className="h-4 w-4" />
                        Cash on Delivery
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent">
                      <RadioGroupItem value="credit_card" id="credit_card" data-testid="radio-payment-credit" />
                      <Label htmlFor="credit_card" className="flex-1 cursor-pointer flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Credit/Debit Card
                      </Label>
                    </div>
                  </div>
                </RadioGroup>

                {selectedPaymentMethod === "cash" && (
                  <p className="text-sm text-muted-foreground">
                    Please have exact change ready for the delivery driver.
                  </p>
                )}

                {selectedPaymentMethod === "credit_card" && cloverConfig?.hostedCheckoutConfigured && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      You will be redirected to Clover's secure payment page to complete your purchase.
                    </p>
                  </div>
                )}

                {selectedPaymentMethod === "credit_card" && !cloverConfig?.hostedCheckoutConfigured && (
                  <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Credit card payments are not currently available. Please select cash on delivery or contact support.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Billing Address - only shown for non-hosted checkout (hosted checkout collects billing info on Clover's page) */}
            {selectedPaymentMethod === "credit_card" && !cloverConfig?.hostedCheckoutConfigured && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Billing Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sameAsDelivery"
                      checked={sameAsDelivery}
                      onCheckedChange={(checked) => setSameAsDelivery(checked as boolean)}
                      data-testid="checkbox-same-as-delivery"
                    />
                    <Label htmlFor="sameAsDelivery" className="cursor-pointer">
                      Billing address is the same as delivery address
                    </Label>
                  </div>

                  {!sameAsDelivery && (
                    <div className="space-y-4 pt-4">
                      <div>
                        <Label htmlFor="billingAddress">Street Address</Label>
                        <Input
                          id="billingAddress"
                          value={billingAddress}
                          onChange={(e) => setBillingAddress(e.target.value)}
                          placeholder="123 Main St"
                          className="mt-1"
                          data-testid="input-billing-address"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="billingCity">City</Label>
                          <Input
                            id="billingCity"
                            value={billingCity}
                            onChange={(e) => setBillingCity(e.target.value)}
                            placeholder="City"
                            className="mt-1"
                            data-testid="input-billing-city"
                          />
                        </div>
                        <div>
                          <Label htmlFor="billingState">State</Label>
                          <Input
                            id="billingState"
                            value={billingState}
                            onChange={(e) => setBillingState(e.target.value)}
                            placeholder="TX"
                            className="mt-1"
                            data-testid="input-billing-state"
                          />
                        </div>
                        <div>
                          <Label htmlFor="billingZipCode">ZIP Code</Label>
                          <Input
                            id="billingZipCode"
                            value={billingZipCode}
                            onChange={(e) => setBillingZipCode(e.target.value)}
                            placeholder="75001"
                            className="mt-1"
                            data-testid="input-billing-zip"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Outside Delivery Zone Warning */}
                {feeData && !feeData.withinDeliveryZone && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>
                      {feeData.addressNeedsVerification ? "Address Verification Required" : "Outside Delivery Zone"}
                    </AlertTitle>
                    <AlertDescription>
                      {feeData.addressNeedsVerification 
                        ? "Your delivery address needs to be verified. Please update your address in your account settings."
                        : `We only deliver within ${feeData.deliveryRadiusMiles} miles of our store. Your address is ${feeData.distance.toFixed(1)} miles away. Please update your delivery address in your account settings to place an order.`
                      }
                    </AlertDescription>
                  </Alert>
                )}

                {/* Cart Items */}
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-3" data-testid={`summary-item-${item.id}`}>
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-16 h-16 object-contain bg-muted rounded p-1"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Qty: {item.quantity} × ${item.product.price}
                        </p>
                        <p className="text-sm font-semibold">
                          ${(parseFloat(item.product.price) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Promo Code Section */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Tag className="h-4 w-4" />
                    Promo Code
                  </Label>
                  {promoValidation?.valid ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">
                          {promoCode.toUpperCase()} applied
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemovePromoCode}
                        className="h-8 w-8 p-0 text-green-700 hover:text-red-600"
                        data-testid="button-remove-promo"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter promo code"
                        value={promoCode}
                        onChange={(e) => {
                          setPromoCode(e.target.value);
                          if (promoValidation) setPromoValidation(null);
                        }}
                        className="flex-1"
                        data-testid="input-promo-code"
                      />
                      <Button
                        variant="secondary"
                        onClick={handleValidatePromoCode}
                        disabled={isValidatingPromo || !promoCode.trim()}
                        data-testid="button-apply-promo"
                      >
                        {isValidatingPromo ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Apply"
                        )}
                      </Button>
                    </div>
                  )}
                  {promoValidation && !promoValidation.valid && promoValidation.errorMessage && (
                    <p className="text-sm text-red-600" data-testid="text-promo-error">
                      {promoValidation.errorMessage}
                    </p>
                  )}
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span data-testid="text-checkout-subtotal">${subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        Promo Discount
                      </span>
                      <span data-testid="text-checkout-discount">-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Delivery Fee
                      {deliveryDistance > 0 && (
                        <span className="text-xs ml-1">({deliveryDistance.toFixed(1)} mi)</span>
                      )}
                    </span>
                    <span data-testid="text-checkout-delivery-fee">
                      {deliveryFee === 0 ? (
                        <span className="text-green-600 font-medium">FREE</span>
                      ) : (
                        `$${deliveryFee.toFixed(2)}`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax (8.25%)</span>
                    <span data-testid="text-checkout-tax">${tax.toFixed(2)}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span data-testid="text-checkout-total">${total.toFixed(2)}</span>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePlaceOrder}
                  disabled={!selectedWindowId || isProcessingPayment || placeOrderMutation.isPending}
                  data-testid="button-place-order"
                >
                  {isProcessingPayment || placeOrderMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Place Order
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setLocation('/delivery/cart')}
                  data-testid="button-back-to-cart"
                >
                  Back to Cart
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </div>

      {/* Pre-Checkout Dialog for Delivery Notes and Cash Payment */}
      <Dialog open={showPreCheckoutDialog} onOpenChange={setShowPreCheckoutDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Before You Order
            </DialogTitle>
            <DialogDescription>
              Add any special instructions for your delivery
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Delivery Notes */}
            <div className="space-y-2">
              <Label htmlFor="delivery-notes">Delivery Notes (Optional)</Label>
              <Textarea
                id="delivery-notes"
                placeholder="Gate code, leave at door, call when arriving..."
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                className="min-h-[80px]"
                data-testid="input-delivery-notes"
              />
            </div>

            {/* Cash Payment Options */}
            {selectedPaymentMethod === "cash" && (
              <div className="space-y-4 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <Label className="text-base font-semibold">Cash Payment</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Order Total: <span className="font-bold text-foreground">${total.toFixed(2)}</span>
                </p>
                
                <RadioGroup
                  value={cashPaymentType}
                  onValueChange={(value) => setCashPaymentType(value as "exact" | "specify")}
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 p-3 border rounded-lg bg-background">
                      <RadioGroupItem value="exact" id="cash-exact" data-testid="radio-cash-exact" />
                      <Label htmlFor="cash-exact" className="flex-1 cursor-pointer">
                        I'll pay exact change
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg bg-background">
                      <RadioGroupItem value="specify" id="cash-specify" data-testid="radio-cash-specify" />
                      <Label htmlFor="cash-specify" className="flex-1 cursor-pointer">
                        I'll pay with a different amount
                      </Label>
                    </div>
                  </div>
                </RadioGroup>

                {cashPaymentType === "specify" && (
                  <div className="space-y-2">
                    <Label htmlFor="cash-amount">Amount you'll pay with</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="cash-amount"
                        type="number"
                        min={total}
                        step="0.01"
                        placeholder={total.toFixed(2)}
                        value={cashPaymentAmount}
                        onChange={(e) => setCashPaymentAmount(e.target.value)}
                        className="pl-8"
                        data-testid="input-cash-amount"
                      />
                    </div>
                    {cashPaymentAmount && parseFloat(cashPaymentAmount) >= total && (
                      <p className="text-sm text-green-600">
                        Driver will bring ${(parseFloat(cashPaymentAmount) - total).toFixed(2)} change
                      </p>
                    )}
                    {cashPaymentAmount && parseFloat(cashPaymentAmount) < total && (
                      <p className="text-sm text-destructive">
                        Amount must be at least ${total.toFixed(2)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowPreCheckoutDialog(false)}
              data-testid="button-cancel-checkout"
            >
              Cancel
            </Button>
            <Button 
              onClick={processOrder}
              disabled={
                selectedPaymentMethod === "cash" && 
                cashPaymentType === "specify" && 
                (!cashPaymentAmount || parseFloat(cashPaymentAmount) < total)
              }
              data-testid="button-confirm-order"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Confirm Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <DeliveryFooter />
    </div>
  );
}
