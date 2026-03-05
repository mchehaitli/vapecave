import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useInactivityTimeout } from "@/hooks/useInactivityTimeout";
import { DeliveryHeader } from "@/components/DeliveryHeader";
import { DeliveryCategoryNav } from "@/components/DeliveryCategoryNav";
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, Truck, ArrowLeft, AlertTriangle } from "lucide-react";
import { DeliveryFooter } from "@/components/DeliveryFooter";
import { useFulfillment } from "@/contexts/FulfillmentContext";

function ConfirmDialog({ open, onConfirm, onCancel, title, message }: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-card rounded-xl border border-border shadow-2xl p-6 max-w-sm w-full mx-4">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-full bg-destructive/10">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm}>Remove</Button>
        </div>
      </div>
    </div>
  );
}

interface CartItem {
  id: number;
  customerId: number;
  productId: number;
  quantity: number;
  purchaseType?: string;
  createdAt: Date;
  product: {
    id: number;
    name: string;
    price: string;
    salePrice?: string | null;
    image: string;
    description: string;
    category: string;
    stockQuantity?: string;
    allowPackToggle?: boolean;
    packSize?: number;
    packDiscountPercent?: number;
    isPackOnly?: boolean;
  };
}

export default function DeliveryCart() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [updatingItems, setUpdatingItems] = useState<Set<number>>(new Set());
  const [confirmRemoveId, setConfirmRemoveId] = useState<number | null>(null);
  const { fulfillmentMode } = useFulfillment();
  const isPickup = fulfillmentMode === 'pickup';

  useInactivityTimeout({
    timeoutMinutes: 30,
    warningMinutes: 2,
  });


  // Fetch cart items
  const { data: cartItems = [], isLoading } = useQuery<CartItem[]>({
    queryKey: ['/api/delivery/cart'],
    queryFn: async () => {
      const response = await fetch('/api/delivery/cart', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch cart items');
      }
      return response.json();
    },
  });

  // Update cart item quantity mutation
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      const response = await fetch(`/api/delivery/cart/${id}`, {
        method: "PATCH",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to update quantity');
      }
      return response.json();
    },
    onMutate: ({ id }) => {
      setUpdatingItems(prev => new Set(prev).add(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/delivery/cart'] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message || "Failed to update quantity",
      });
    },
    onSettled: (_, __, { id }) => {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    },
  });

  // Remove item mutation
  const removeItemMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/delivery/cart/${id}`, {
        method: "DELETE",
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to remove item');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/delivery/cart'] });
      toast({
        title: "Item removed",
        description: "Item removed from cart successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Remove failed",
        description: error.message || "Failed to remove item",
      });
    },
  });

  const { data: feeData } = useQuery<{
    distance: number;
    feeType: string;
    flatFee: number;
    perMileFee: number;
    perItemFee: number;
    withinDeliveryZone: boolean;
    deliveryRadiusMiles: number;
  }>({
    queryKey: ['/api/delivery/calculate-fee'],
    queryFn: async () => {
      const response = await fetch('/api/delivery/calculate-fee', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch fee data');
      return response.json();
    },
  });

  const { data: siteSettings } = useQuery<{
    freeDeliveryThreshold: string;
  }>({
    queryKey: ['/api/site-settings'],
  });

  const getItemLinePrice = (item: CartItem) => {
    if (item.purchaseType === 'pack' && item.product.allowPackToggle) {
      return Math.round(parseFloat(item.product.price) * (item.product.packSize || 1) * (1 - (item.product.packDiscountPercent || 0) / 100) * 100) / 100;
    }
    return parseFloat(item.product.salePrice || item.product.price);
  };

  const subtotal = cartItems.reduce((sum, item) => {
    return sum + (getItemLinePrice(item) * item.quantity);
  }, 0);

  const freeDeliveryThreshold = parseFloat(siteSettings?.freeDeliveryThreshold || "100");
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const calculateCartDeliveryFee = () => {
    if (!feeData) return 0;
    const distance = feeData.distance;
    switch (feeData.feeType) {
      case 'flat': return feeData.flatFee;
      case 'per_mile': return feeData.perMileFee * distance;
      case 'per_item': return feeData.perItemFee * totalItems;
      case 'combined': return feeData.flatFee + feeData.perMileFee * distance + feeData.perItemFee * totalItems;
      default: return feeData.flatFee;
    }
  };

  const baseFee = calculateCartDeliveryFee();
  const deliveryFee = isPickup ? 0 : (subtotal >= freeDeliveryThreshold ? 0 : baseFee);
  const total = subtotal + deliveryFee;
  const amountUntilFreeDelivery = isPickup ? 0 : Math.max(0, freeDeliveryThreshold - subtotal);
  const freeDeliveryProgress = isPickup ? 100 : Math.min(100, (subtotal / freeDeliveryThreshold) * 100);

  const handleUpdateQuantity = (id: number, currentQuantity: number, change: number) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity < 1) return;
    if (newQuantity > 99) return; // Max quantity limit
    updateQuantityMutation.mutate({ id, quantity: newQuantity });
  };

  const handleRemoveItem = (id: number) => {
    setConfirmRemoveId(id);
  };

  const confirmRemove = () => {
    if (confirmRemoveId !== null) {
      removeItemMutation.mutate(confirmRemoveId);
      setConfirmRemoveId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <DeliveryHeader cartItemCount={0} showSearch={false} showBackButton={true} />
        <DeliveryCategoryNav />
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="text-center py-12 max-w-md w-full">
            <CardContent className="space-y-6">
              <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground" />
              <div>
                <h2 className="text-2xl font-bold mb-2">Your Cart is Empty</h2>
                <p className="text-muted-foreground mb-6">
                  Start adding some products to your cart!
                </p>
                <Link href="/delivery/shop">
                  <Button size="lg" data-testid="button-continue-shopping">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DeliveryHeader cartItemCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)} showSearch={false} showBackButton={true} />
      <DeliveryCategoryNav />
      
      {/* Free Delivery Progress */}
      {amountUntilFreeDelivery > 0 && (
        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b">
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Truck className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-700 dark:text-green-400">
                  ${amountUntilFreeDelivery.toFixed(2)} away from free delivery
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-2 flex-1 max-w-xs">
                <Progress value={freeDeliveryProgress} className="h-2" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 py-4 sm:py-6">
        <div className="container mx-auto px-3 sm:px-4 max-w-4xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Shopping Cart</h1>
            <p className="text-sm text-muted-foreground">
              {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in your cart
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <Card key={item.id} className="overflow-hidden" data-testid={`card-cart-item-${item.id}`}>
                <CardContent className="p-3 sm:p-6">
                  <div className="flex gap-3 sm:gap-4">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-16 sm:w-24 sm:h-24 object-contain bg-muted rounded-lg p-1 flex-shrink-0"
                      data-testid={`img-product-${item.product.id}`}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1 sm:mb-2 gap-1">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm sm:text-lg line-clamp-2" data-testid={`text-product-name-${item.product.id}`}>
                            {item.product.name}
                            {item.purchaseType === 'pack' && item.product.allowPackToggle && (
                              <span className="ml-2 inline-block text-[10px] sm:text-xs font-medium px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-500 border border-green-500/30">
                                Pack of {item.product.packSize}
                              </span>
                            )}
                          </h3>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {item.product.category}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 sm:h-9 sm:w-9 flex-shrink-0"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={removeItemMutation.isPending}
                          data-testid={`button-remove-${item.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
                        </Button>
                      </div>

                      <div className="flex justify-between items-center mt-2 sm:mt-4">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                            disabled={item.quantity <= 1 || updatingItems.has(item.id)}
                            data-testid={`button-decrease-${item.id}`}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 sm:w-12 text-center font-medium text-sm sm:text-base" data-testid={`text-quantity-${item.id}`}>
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                            disabled={item.quantity >= (item.product.stockQuantity ? parseInt(item.product.stockQuantity) : 99) || updatingItems.has(item.id)}
                            data-testid={`button-increase-${item.id}`}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            ${getItemLinePrice(item).toFixed(2)} {item.purchaseType === 'pack' ? 'per pack' : 'each'}
                          </p>
                          <p className="text-sm sm:text-lg font-bold" data-testid={`text-item-total-${item.id}`}>
                            ${(getItemLinePrice(item) * item.quantity).toFixed(2)}
                          </p>
                          {item.purchaseType === 'pack' && (item.product.packDiscountPercent || 0) > 0 && (
                            <p className="text-[10px] sm:text-xs text-green-500 font-medium">
                              Save {item.product.packDiscountPercent}%
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-2xl font-bold">Order Summary</h2>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span data-testid="text-subtotal">${subtotal.toFixed(2)}</span>
                  </div>
                  {!isPickup && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Delivery Fee</span>
                      <span data-testid="text-delivery-fee">
                        {deliveryFee === 0 ? (
                          <span className="text-green-600 font-medium">FREE</span>
                        ) : (
                          `$${deliveryFee.toFixed(2)}`
                        )}
                      </span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span data-testid="text-total">${total.toFixed(2)}</span>
                </div>

                {!isPickup && (
                  <>
                    {amountUntilFreeDelivery > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            ${amountUntilFreeDelivery.toFixed(2)} until free delivery
                          </span>
                          <span className="font-medium">
                            {freeDeliveryProgress.toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${freeDeliveryProgress}%` }}
                            data-testid="progress-free-delivery"
                          />
                        </div>
                        <p className="text-xs text-green-600 font-medium">
                          Add ${amountUntilFreeDelivery.toFixed(2)} more to get FREE delivery!
                        </p>
                      </div>
                    )}

                    {amountUntilFreeDelivery === 0 && (
                      <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
                        <p className="text-green-700 dark:text-green-300 font-medium text-sm text-center">
                          🎉 You qualify for FREE delivery!
                        </p>
                      </div>
                    )}
                  </>
                )}

                {isPickup && (
                  <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <p className="text-yellow-700 dark:text-yellow-300 font-medium text-sm text-center">
                      🏪 Pickup — No delivery fee
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-3 pt-4">
                  <Link href="/delivery/checkout">
                    <Button className="w-full" size="lg" data-testid="button-checkout">
                      Proceed to Checkout
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/delivery/shop">
                    <Button variant="outline" className="w-full mt-2" size="lg" data-testid="button-continue-shopping-bottom">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Continue Shopping
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </div>
      
      <DeliveryFooter />
      <ConfirmDialog
        open={confirmRemoveId !== null}
        onConfirm={confirmRemove}
        onCancel={() => setConfirmRemoveId(null)}
        title="Remove Item"
        message="Are you sure you want to remove this item from your cart?"
      />
    </div>
  );
}
