import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, X, ChevronUp, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";

interface CartItem {
  id: number;
  customerId: number;
  productId: number;
  quantity: number;
  createdAt?: Date;
  product?: {
    id: number;
    name: string;
    price: string;
    image?: string;
    description?: string;
    category?: string;
  };
}

interface FloatingCartButtonProps {
  cartItems: CartItem[];
  products: Array<{ id: number; price: string; name: string }>;
  deliveryMethod?: "pickup" | "delivery";
  freeDeliveryThreshold?: number;
  deliveryFee?: number;
}

export function FloatingCartButton({
  cartItems,
  products,
  deliveryMethod = "delivery",
  freeDeliveryThreshold = 99,
  deliveryFee: baseFee = 5.99,
}: FloatingCartButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [, setLocation] = useLocation();

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const cartTotal = cartItems.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId);
    return sum + (product ? parseFloat(product.price) * item.quantity : 0);
  }, 0);

  const deliveryFee = cartTotal >= freeDeliveryThreshold ? 0 : baseFee;

  if (cartItemCount === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50" data-testid="floating-cart">
      <AnimatePresence mode="wait">
        {isExpanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-card border rounded-lg shadow-2xl p-4 w-80"
            data-testid="cart-summary-expanded"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Cart Summary
              </h3>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{cartItemCount} items</Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setIsExpanded(false)}
                  data-testid="button-collapse-cart"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Separator className="mb-3" />
            
            <div className="max-h-40 overflow-y-auto space-y-2 mb-3">
              {cartItems.slice(0, 5).map((item) => {
                const product = item.product || products.find((p) => p.id === item.productId);
                const productName = product?.name || "Unknown Product";
                return (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="truncate flex-1 mr-2">{productName}</span>
                    <span className="text-muted-foreground">x{item.quantity}</span>
                  </div>
                );
              })}
              {cartItems.length > 5 && (
                <p className="text-xs text-muted-foreground">
                  +{cartItems.length - 5} more items...
                </p>
              )}
            </div>
            
            {deliveryMethod === "delivery" && cartTotal < freeDeliveryThreshold && (
              <div className="mb-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium">
                    ${(freeDeliveryThreshold - cartTotal).toFixed(2)} away from FREE delivery!
                  </span>
                </div>
                <Progress 
                  value={(cartTotal / freeDeliveryThreshold) * 100} 
                  className="h-2"
                />
              </div>
            )}
            
            {deliveryMethod === "delivery" && cartTotal >= freeDeliveryThreshold && (
              <div className="mb-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-green-500" />
                  <span className="text-xs font-medium text-green-500">
                    You qualify for FREE delivery!
                  </span>
                </div>
              </div>
            )}
            
            <Separator className="mb-3" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span data-testid="cart-subtotal">${cartTotal.toFixed(2)}</span>
              </div>
              {deliveryMethod === "delivery" && (
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span data-testid="cart-delivery-fee">
                    {deliveryFee === 0 ? "FREE" : `$${deliveryFee.toFixed(2)}`}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span data-testid="cart-total">
                  ${(cartTotal + deliveryFee).toFixed(2)}
                </span>
              </div>
            </div>
            <Button
              className="w-full mt-4"
              size="lg"
              onClick={() => setLocation("/delivery/cart")}
              data-testid="button-view-cart"
            >
              View Cart
            </Button>
            <Button
              className="w-full mt-2"
              variant="outline"
              onClick={() => setLocation("/delivery/checkout")}
              data-testid="button-checkout"
            >
              Proceed to Checkout
            </Button>
          </motion.div>
        ) : (
          <motion.button
            key="collapsed"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
            onClick={() => setIsExpanded(true)}
            data-testid="button-expand-cart"
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {cartItemCount > 99 ? "99+" : cartItemCount}
            </span>
            <ChevronUp className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-4 opacity-60" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
