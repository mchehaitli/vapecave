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
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, Truck, ArrowLeft } from "lucide-react";
import { DeliveryFooter } from "@/components/DeliveryFooter";

interface CartItem {
  id: number;
  customerId: number;
  productId: number;
  quantity: number;
  createdAt: Date;
  product: {
    id: number;
    name: string;
    price: string;
    image: string;
    description: string;
    category: string;
    stockQuantity?: string;
  };
}

export default function DeliveryCart() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [updatingItems, setUpdatingItems] = useState<Set<number>>(new Set());

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

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => {
    return sum + (parseFloat(item.product.price) * item.quantity);
  }, 0);

  const DELIVERY_FEE = 10;
  const FREE_DELIVERY_THRESHOLD = 99;
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = subtotal + deliveryFee;
  const amountUntilFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const freeDeliveryProgress = Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100);

  const handleUpdateQuantity = (id: number, currentQuantity: number, change: number) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity < 1) return;
    if (newQuantity > 99) return; // Max quantity limit
    updateQuantityMutation.mutate({ id, quantity: newQuantity });
  };

  const handleRemoveItem = (id: number) => {
    if (confirm("Are you sure you want to remove this item from your cart?")) {
      removeItemMutation.mutate(id);
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
      <DeliveryHeader cartItemCount={cartItems.length} showSearch={false} showBackButton={true} />
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

      <div className="flex-1 py-6">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Shopping Cart</h1>
            <p className="text-sm text-muted-foreground">
              {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in your cart
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <Card key={item.id} className="overflow-hidden" data-testid={`card-cart-item-${item.id}`}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-24 h-24 object-contain bg-muted rounded-lg p-1"
                      data-testid={`img-product-${item.product.id}`}
                    />

                    {/* Product Details */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-lg" data-testid={`text-product-name-${item.product.id}`}>
                            {item.product.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {item.product.category}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={removeItemMutation.isPending}
                          data-testid={`button-remove-${item.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>

                      <div className="flex justify-between items-center mt-4">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                            disabled={item.quantity <= 1 || updatingItems.has(item.id)}
                            data-testid={`button-decrease-${item.id}`}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-12 text-center font-medium" data-testid={`text-quantity-${item.id}`}>
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                            disabled={item.quantity >= (item.product.stockQuantity ? parseInt(item.product.stockQuantity) : 99) || updatingItems.has(item.id)}
                            data-testid={`button-increase-${item.id}`}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            ${item.product.price} each
                          </p>
                          <p className="text-lg font-bold" data-testid={`text-item-total-${item.id}`}>
                            ${(parseFloat(item.product.price) * item.quantity).toFixed(2)}
                          </p>
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
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span data-testid="text-total">${total.toFixed(2)}</span>
                </div>

                {/* Free Delivery Progress */}
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

                <div className="space-y-3 pt-4">
                  <Link href="/delivery/checkout">
                    <Button className="w-full" size="lg" data-testid="button-checkout">
                      Proceed to Checkout
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/delivery/shop">
                    <Button variant="outline" className="w-full" data-testid="button-continue-shopping-bottom">
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
    </div>
  );
}
