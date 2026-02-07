import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, Eye, Plus, Minus, ShoppingCart, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { DeliveryHeader } from "@/components/DeliveryHeader";
import { DeliveryFooter } from "@/components/DeliveryFooter";
import { DeliveryCategoryNav } from "@/components/DeliveryCategoryNav";
import { FloatingCartButton } from "@/components/FloatingCartButton";
import { ProductQuickView } from "@/components/ProductQuickView";
import type { DeliveryProduct } from "@shared/schema";

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
  };
}

export default function DeliverySalePage() {
  const { toast } = useToast();
  const [quickViewProduct, setQuickViewProduct] = useState<DeliveryProduct | null>(null);

  const { data: allProducts = [], isLoading } = useQuery<DeliveryProduct[]>({
    queryKey: ['/api/delivery/products'],
  });

  const { data: apiCartItems = [] } = useQuery<CartItem[]>({
    queryKey: ["/api/delivery/cart"],
    queryFn: async () => {
      const response = await fetch("/api/delivery/cart", {
        credentials: "include",
      });
      if (!response.ok) {
        return [];
      }
      return response.json();
    },
  });

  const cartItems = useMemo(() => {
    const items: Record<number, number> = {};
    apiCartItems.forEach(item => {
      items[item.productId] = item.quantity;
    });
    return items;
  }, [apiCartItems]);

  const saleProducts = useMemo(() => {
    return allProducts.filter(p => {
      if (!p.enabled) return false;
      if (!p.salePrice || p.salePrice === '' || p.salePrice === '0') return false;
      return true;
    }).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }, [allProducts]);

  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: number; quantity: number }) => {
      const response = await fetch("/api/delivery/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productId, quantity }),
      });
      if (!response.ok) {
        throw new Error("Failed to add to cart");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery/cart"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update cart. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddToCart = (productId: number, quantity: number = 1) => {
    addToCartMutation.mutate({ productId, quantity });
    toast({
      title: "Added to cart",
      description: "Item has been added to your cart.",
    });
  };

  const handleUpdateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      addToCartMutation.mutate({ productId, quantity: 0 });
    } else {
      addToCartMutation.mutate({ productId, quantity });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DeliveryHeader />
      <DeliveryCategoryNav />
      
      <main className="container mx-auto px-4 py-8 relative">
        <motion.div
          className="absolute top-0 left-0 w-40 h-40 bg-red-500/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-20 right-10 w-32 h-32 bg-red-500/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.15, 0.3],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-8 relative z-10"
        >
          <div className="flex items-center gap-4 mb-2">
            <motion.div 
              className="w-14 h-14 bg-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30"
              animate={{ 
                rotate: [0, -5, 5, 0],
                scale: [1, 1.05, 1],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Tag className="w-7 h-7 text-white" />
            </motion.div>
            <div>
              <motion.h1 
                className="text-4xl font-bold text-foreground"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                On Sale
              </motion.h1>
              <motion.p 
                className="text-muted-foreground mt-1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                {saleProducts.length} {saleProducts.length === 1 ? 'product' : 'products'} on sale
              </motion.p>
            </div>
          </div>
          
          <motion.div 
            className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl overflow-hidden relative"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/10 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />
            <div className="flex items-center gap-2 text-red-500 relative z-10">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              >
                <Percent className="w-5 h-5" />
              </motion.div>
              <span className="font-semibold">Limited Time Savings!</span>
            </div>
          </motion.div>
        </motion.div>

        {saleProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            <AnimatePresence mode="popLayout">
              {saleProducts.map((product, index) => (
                <SaleProductCard
                  key={product.id}
                  product={product}
                  index={index}
                  inCart={cartItems[product.id]}
                  onAddToCart={handleAddToCart}
                  onUpdateQuantity={handleUpdateQuantity}
                  onQuickView={setQuickViewProduct}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-16 bg-card/50 rounded-2xl border border-border/30">
            <Tag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">
              No products on sale right now
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              Check back soon for new deals!
            </p>
          </div>
        )}
      </main>

      <DeliveryFooter />
      <FloatingCartButton 
        cartItems={apiCartItems}
        products={saleProducts.map(p => ({ id: p.id, price: p.salePrice || p.price, name: p.name }))}
      />
      
      <ProductQuickView
        product={quickViewProduct}
        open={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={async (productId: number, quantity: number) => {
          handleAddToCart(productId, quantity);
          setQuickViewProduct(null);
        }}
      />
    </div>
  );
}

function SaleProductCard({ 
  product, 
  index, 
  inCart, 
  onAddToCart, 
  onUpdateQuantity, 
  onQuickView 
}: { 
  product: DeliveryProduct;
  index: number;
  inCart?: number;
  onAddToCart: (productId: number) => void;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onQuickView: (product: DeliveryProduct) => void;
}) {
  const stock = product.stockQuantity ? parseInt(product.stockQuantity) : 0;
  const isOutOfStock = stock === 0;
  const isLowStock = stock > 0 && stock <= 2;
  const isInStock = stock >= 3;

  const originalPrice = parseFloat(product.price);
  const salePrice = parseFloat(product.salePrice || '0');
  const discount = originalPrice > 0 ? Math.round(((originalPrice - salePrice) / originalPrice) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      layout
    >
      <motion.div
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="h-full"
      >
        <Card className="group h-full overflow-hidden bg-card border-red-500/30 hover:border-red-500/60 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] transition-all duration-300">
          <div className="relative aspect-square overflow-hidden bg-gradient-to-b from-muted/50 to-muted">
            <img
              src={product.image || '/placeholder-product.png'}
              alt={`${product.name} - Vape Cave Frisco`}
              loading="lazy"
              className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
            />
            
            <Badge className="absolute top-2 left-2 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-red-500 text-white font-bold">
              <Tag className="w-2.5 h-2.5 mr-0.5" />
              SALE
            </Badge>

            {discount > 0 && (
              <Badge className="absolute top-2 right-2 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-red-600 text-white font-bold">
                -{discount}%
              </Badge>
            )}

            {isOutOfStock && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center backdrop-blur-sm">
                <Badge variant="destructive" className="text-sm">Out of Stock</Badge>
              </div>
            )}

            {isLowStock && !isOutOfStock && (
              <Badge 
                className="absolute bottom-2 right-2 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-amber-500 text-white"
              >
                Low Stock
              </Badge>
            )}

            {isInStock && (
              <Badge 
                className="absolute bottom-2 right-2 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-green-500 text-white"
              >
                In Stock
              </Badge>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-2 sm:pb-4 gap-1 sm:gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="bg-card/90 backdrop-blur-sm hover:bg-card text-xs sm:text-sm h-7 sm:h-9 px-2 sm:px-3"
                onClick={() => onQuickView(product)}
              >
                <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Quick View</span>
                <span className="sm:hidden">View</span>
              </Button>
              {!isOutOfStock && !inCart && (
                <Button
                  size="sm"
                  className="bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm h-7 sm:h-9 px-2 sm:px-3"
                  onClick={() => onAddToCart(product.id)}
                >
                  <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Add</span>
                  <span className="sm:hidden">+</span>
                </Button>
              )}
            </div>
          </div>

          <div className="p-2 sm:p-4">
            <h3 className="font-semibold text-xs sm:text-sm text-foreground line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem] group-hover:text-red-500 transition-colors">
              {product.name}
            </h3>
            
            <div className="mt-2 sm:mt-3 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm text-muted-foreground line-through">
                  ${originalPrice.toFixed(2)}
                </span>
              </div>
              <span className="text-lg sm:text-xl font-bold text-red-500">
                ${salePrice.toFixed(2)}
              </span>
            </div>

            <div className="mt-2 sm:mt-3">
              {inCart ? (
                <div className="flex items-center justify-between bg-red-500/10 rounded-lg p-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-red-500/20 text-red-500"
                    onClick={() => onUpdateQuantity(product.id, inCart - 1)}
                  >
                    <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                  <span className="text-xs sm:text-sm font-semibold text-foreground">{inCart}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-red-500/20 text-red-500"
                    onClick={() => onUpdateQuantity(product.id, inCart + 1)}
                    disabled={inCart >= stock}
                  >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  className="w-full bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm h-8 sm:h-9"
                  onClick={() => onAddToCart(product.id)}
                  disabled={isOutOfStock}
                >
                  {isOutOfStock ? (
                    "Out of Stock"
                  ) : (
                    <>
                      <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Add to Cart
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
