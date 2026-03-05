import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, Eye, Plus, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { DeliveryHeader } from "@/components/DeliveryHeader";
import { DeliveryFooter } from "@/components/DeliveryFooter";
import { DeliveryCategoryNav } from "@/components/DeliveryCategoryNav";
import { FloatingCartButton } from "@/components/FloatingCartButton";
import { ProductQuickView } from "@/components/ProductQuickView";
import type { DeliveryProduct, DeliveryBrand } from "@shared/schema";
import {
  groupProductsIntoVariants,
  isVariantGroup,
  getDefaultVariant,
  getVariantByNicLevel,
  sortNicLevels,
  type VariantGroup,
} from "@/lib/productVariants";

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
  const [selectedNicLevels, setSelectedNicLevels] = useState<Record<string, string>>({});
  const [quickViewVariantGroup, setQuickViewVariantGroup] = useState<VariantGroup | null>(null);
  const [quickViewVariantNic, setQuickViewVariantNic] = useState<string>("");

  const { data: brands = [] } = useQuery<DeliveryBrand[]>({
    queryKey: ['/api/delivery/brands'],
  });

  const brandMap = useMemo(() => {
    const map: Record<number, DeliveryBrand> = {};
    brands.forEach(b => { map[b.id] = b; });
    return map;
  }, [brands]);

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

  const cartItemCount = apiCartItems.reduce((sum, item) => sum + item.quantity, 0);

  const saleProducts = useMemo(() => {
    return allProducts.filter(p => {
      if (!p.enabled) return false;
      if (!p.salePrice || p.salePrice === '' || p.salePrice === '0') return false;
      return true;
    }).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }, [allProducts]);

  const { groups: variantGroups, singles: singleProducts } = useMemo(
    () => groupProductsIntoVariants(saleProducts),
    [saleProducts]
  );

  const displayItems = useMemo(() => {
    const usedIds = new Set(variantGroups.flatMap(g => g.variants.map(v => v.productId)));
    return [
      ...variantGroups,
      ...singleProducts.filter(p => !usedIds.has(p.id)),
    ] as Array<VariantGroup | DeliveryProduct>;
  }, [variantGroups, singleProducts]);

  const getSelectedNic = (group: VariantGroup): string => {
    if (selectedNicLevels[group.key]) return selectedNicLevels[group.key];
    return getDefaultVariant(group).nicLevel;
  };

  const setSelectedNic = (groupKey: string, level: string) => {
    setSelectedNicLevels(prev => ({ ...prev, [groupKey]: level }));
  };

  const getVariantData = (group: VariantGroup) => {
    const nic = getSelectedNic(group);
    return getVariantByNicLevel(group, nic) || getDefaultVariant(group);
  };

  const openVariantQuickView = (group: VariantGroup) => {
    setQuickViewVariantGroup(group);
    setQuickViewVariantNic(getSelectedNic(group));
  };

  const closeVariantQuickView = () => {
    setQuickViewVariantGroup(null);
    setQuickViewVariantNic("");
  };

  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: number; quantity: number }) => {
      const response = await fetch("/api/delivery/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productId, quantity }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to add to cart");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery/cart"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddToCart = (productId: number, quantity: number = 1) => {
    addToCartMutation.mutate({ productId, quantity }, {
      onSuccess: () => {
        toast({
          title: "Added to cart",
          description: "Item has been added to your cart.",
        });
      }
    });
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
      <DeliveryHeader cartItemCount={cartItemCount} />
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
                {displayItems.length} {displayItems.length === 1 ? 'product' : 'products'} on sale
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

        {displayItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            <AnimatePresence mode="popLayout">
              {displayItems.map((item, index) => {
                if (isVariantGroup(item)) {
                  const group = item;
                  const selectedNic = getSelectedNic(group);
                  const variant = getVariantData(group);
                  const stock = variant.stockQuantity ? parseInt(variant.stockQuantity) : 0;
                  const isOutOfStock = stock <= 0;
                  const isLowStock = stock > 0 && stock <= 2;
                  const originalPriceNum = parseFloat(variant.price);
                  const salePriceNum = variant.salePrice ? parseFloat(variant.salePrice) : originalPriceNum;
                  const discount = originalPriceNum > 0 ? Math.round(((originalPriceNum - salePriceNum) / originalPriceNum) * 100) : 0;
                  return (
                    <motion.div
                      key={group.key}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3, delay: index * 0.03 }}
                      layout
                    >
                      <Card className="group h-full overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-red-500/50">
                        <div className="relative aspect-square overflow-hidden bg-muted/50">
                          <img
                            src={group.image || (group.brandId ? brandMap[group.brandId]?.logo : null) || '/placeholder-product.svg'}
                            alt={`${group.displayName} - Vape Cave`}
                            loading="lazy"
                            className={`w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300 ${isOutOfStock ? 'opacity-50' : ''}`}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (target.dataset.fallbackAttempted) { target.src = '/placeholder-product.svg'; return; }
                              target.dataset.fallbackAttempted = '1';
                              const brandLogo = group.brandId ? brandMap[group.brandId]?.logo : null;
                              target.src = brandLogo || '/placeholder-product.svg';
                            }}
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
                            <Badge className="absolute bottom-2 right-2 text-[10px] bg-amber-500 text-white">Low Stock</Badge>
                          )}
                        </div>
                        <div className="p-3">
                          {(group.brandLine || group.brand) && (
                            <p className="text-[10px] text-muted-foreground line-clamp-1">{group.brandLine || group.brand}</p>
                          )}
                          <h3 className="font-medium text-sm text-foreground line-clamp-1">
                            {group.displayName}
                          </h3>
                          <p className="text-[10px] text-muted-foreground mb-1">
                            {[group.mlSize, selectedNic].filter(Boolean).join(' · ')}
                          </p>
                          <div className="flex flex-wrap gap-1 my-1.5">
                            {sortNicLevels(group.variants.map(v => v.nicLevel)).map(level => {
                              const v = getVariantByNicLevel(group, level);
                              const vStock = v?.stockQuantity ? parseInt(v.stockQuantity) : 0;
                              return (
                                <button
                                  key={level}
                                  onClick={(e) => { e.stopPropagation(); setSelectedNic(group.key, level); }}
                                  className={`text-[10px] px-1.5 py-0.5 rounded border transition-all ${
                                    vStock <= 0
                                      ? 'border-muted-foreground/20 text-muted-foreground/40 line-through'
                                      : selectedNic === level
                                      ? 'bg-red-500 text-white border-red-500'
                                      : 'border-border text-muted-foreground hover:border-red-500/50 hover:text-foreground'
                                  }`}
                                  title={vStock <= 0 ? `${level} - Out of stock` : level}
                                >
                                  {level}
                                </button>
                              );
                            })}
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <div>
                              <span className="text-xs text-muted-foreground line-through">${originalPriceNum.toFixed(2)}</span>
                              <p className="text-base font-bold text-red-500">${salePriceNum.toFixed(2)}</p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => openVariantQuickView(group)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                className="h-8 w-8 p-0 bg-red-500 hover:bg-red-600 text-white"
                                onClick={() => handleAddToCart(variant.productId)}
                                disabled={addToCartMutation.isPending || isOutOfStock}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                }

                const product = item as DeliveryProduct;
                return (
                  <SaleProductCard
                    key={product.id}
                    product={product}
                    index={index}
                    onAddToCart={handleAddToCart}
                    onQuickView={setQuickViewProduct}
                    brandMap={brandMap}
                  />
                );
              })}
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
        variantGroup={quickViewVariantGroup}
        selectedNicLevel={quickViewVariantNic}
        onNicLevelChange={setQuickViewVariantNic}
        open={!!(quickViewProduct || quickViewVariantGroup)}
        onClose={() => { setQuickViewProduct(null); closeVariantQuickView(); }}
        onAddToCart={async (productId: number, quantity: number) => {
          handleAddToCart(productId, quantity);
          setQuickViewProduct(null);
          closeVariantQuickView();
        }}
      />
    </div>
  );
}

function SaleProductCard({ 
  product, 
  index, 
  onAddToCart, 
  onQuickView,
  brandMap
}: { 
  product: DeliveryProduct;
  index: number;
  onAddToCart: (productId: number) => void;
  onQuickView: (product: DeliveryProduct) => void;
  brandMap: Record<number, DeliveryBrand>;
}) {
  const stock = product.stockQuantity ? parseInt(product.stockQuantity) : 0;
  const isOutOfStock = stock <= 0;
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
      <Card className="group h-full overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-red-500/50">
        <div className="relative aspect-square overflow-hidden bg-muted/50">
          <img
            src={product.image || (product.brandId ? brandMap[product.brandId]?.logo : null) || '/placeholder-product.svg'}
            alt={`${product.name} - Vape Cave Frisco`}
            loading="lazy"
            className={`w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300 ${isOutOfStock ? 'opacity-50' : ''}`}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.dataset.fallbackAttempted) {
                target.src = '/placeholder-product.svg';
                return;
              }
              target.dataset.fallbackAttempted = '1';
              const brandLogo = product.brandId ? brandMap[product.brandId]?.logo : null;
              target.src = brandLogo || '/placeholder-product.svg';
            }}
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
            <Badge className="absolute bottom-2 right-2 text-[10px] bg-amber-500 text-white">
              Low Stock
            </Badge>
          )}

          {isInStock && (
            <Badge className="absolute bottom-2 right-2 text-[10px] bg-green-500 text-white">
              In Stock
            </Badge>
          )}
        </div>

        <div className="p-3">
          <h3 className="font-medium text-sm text-foreground line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>
          
          <div className="flex items-center justify-between mt-2">
            <div>
              <span className="text-xs text-muted-foreground line-through">
                ${originalPrice.toFixed(2)}
              </span>
              <p className="text-base font-bold text-red-500">
                ${salePrice.toFixed(2)}
              </p>
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={() => onQuickView(product)}
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                className="h-8 w-8 p-0 bg-red-500 hover:bg-red-600 text-white"
                onClick={() => onAddToCart(product.id)}
                disabled={isOutOfStock}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
