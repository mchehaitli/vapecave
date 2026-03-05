import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Eye, Plus, Minus, TrendingUp, Sparkles, Grid3X3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { DeliveryHeader } from "@/components/DeliveryHeader";
import { DeliveryFooter } from "@/components/DeliveryFooter";
import { DeliveryCategoryNav } from "@/components/DeliveryCategoryNav";
import { FloatingCartButton } from "@/components/FloatingCartButton";
import { ProductQuickView } from "@/components/ProductQuickView";
import type { DeliveryBrand, DeliveryProductLine, DeliveryProduct } from "@shared/schema";
import {
  extractNicLevel,
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

export default function DeliveryBrandPage({ params }: { params: { slug: string } }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedRootLineId, setSelectedRootLineId] = useState<number | null>(null);
  const [selectedChildLineId, setSelectedChildLineId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">(window.innerWidth < 640 ? "list" : "grid");
  const [quickViewProduct, setQuickViewProduct] = useState<DeliveryProduct | null>(null);
  const [selectedNicLevels, setSelectedNicLevels] = useState<Record<string, string>>({});
  const [quickViewVariantGroup, setQuickViewVariantGroup] = useState<VariantGroup | null>(null);
  const [quickViewVariantNic, setQuickViewVariantNic] = useState<string>("");
  const [packToggleMap, setPackToggleMap] = useState<Record<number, 'single' | 'pack'>>({});

  const { data: allBrandsForLookup = [] } = useQuery<DeliveryBrand[]>({
    queryKey: ['/api/delivery/brands'],
  });

  const brand = useMemo(() => 
    allBrandsForLookup.find((b: DeliveryBrand) => b.slug === params.slug),
    [allBrandsForLookup, params.slug]
  );
  const brandLoading = !allBrandsForLookup.length;

  const { data: productLines = [] } = useQuery<DeliveryProductLine[]>({
    queryKey: ['/api/delivery/product-lines', brand?.id],
    queryFn: async () => {
      if (!brand?.id) return [];
      return fetch(`/api/delivery/product-lines?brandId=${brand.id}`).then(r => r.json());
    },
    enabled: !!brand?.id
  });


  const brandMap = useMemo(() => {
    const map: Record<number, DeliveryBrand> = {};
    allBrandsForLookup.forEach(b => { map[b.id] = b; });
    return map;
  }, [allBrandsForLookup]);


  const { data: allProducts = [] } = useQuery<DeliveryProduct[]>({
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

  const cartItemCount = apiCartItems.reduce((sum, item) => sum + item.quantity, 0);

  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity, purchaseType }: { productId: number; quantity: number; purchaseType?: string }) => {
      const response = await fetch("/api/delivery/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productId, quantity, purchaseType: purchaseType || 'single' }),
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

  const updateCartMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: number; quantity: number }) => {
      const cartItem = apiCartItems.find(item => item.productId === productId);
      if (!cartItem) throw new Error("Item not in cart");

      if (quantity <= 0) {
        const response = await fetch(`/api/delivery/cart/${cartItem.id}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || "Failed to remove item");
        }
        return response.json();
      }

      const response = await fetch(`/api/delivery/cart/${cartItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ quantity }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update quantity");
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

  const handleAddToCart = (productId: number, quantity: number = 1, purchaseType?: string) => {
    addToCartMutation.mutate({ productId, quantity, purchaseType }, {
      onSuccess: () => {
        toast({
          title: "Added to cart",
          description: "Item has been added to your cart.",
        });
      }
    });
  };

  const handleUpdateQuantity = (productId: number, quantity: number) => {
    updateCartMutation.mutate({ productId, quantity });
  };

  const activeProductLines = useMemo(() => 
    [...productLines].filter(pl => pl.isActive).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)),
    [productLines]
  );

  const rootProductLines = useMemo(() => 
    activeProductLines.filter(pl => !pl.parentId),
    [activeProductLines]
  );

  const getChildLines = (parentId: number) => 
    activeProductLines.filter(pl => pl.parentId === parentId);

  const childProductLines = useMemo(() => 
    selectedRootLineId ? getChildLines(selectedRootLineId) : [],
    [selectedRootLineId, activeProductLines]
  );

  const getDescendantIds = (parentId: number): number[] => {
    const visited = new Set<number>();
    const collect = (id: number) => {
      if (visited.has(id)) return;
      visited.add(id);
      activeProductLines.filter(pl => pl.parentId === id).forEach(child => collect(child.id));
    };
    collect(parentId);
    return Array.from(visited);
  };


  const brandProducts = useMemo(() => {
    if (!brand?.id) return [];
    
    let allowedLineIds: number[] | null = null;
    
    if (selectedChildLineId !== null) {
      allowedLineIds = getDescendantIds(selectedChildLineId);
    } else if (selectedRootLineId !== null) {
      allowedLineIds = getDescendantIds(selectedRootLineId);
    }
    
    return allProducts.filter(p => {
      if (!p.enabled) return false;
      if (p.brandId !== brand.id) return false;
      if (allowedLineIds !== null) {
        if (!p.productLineId || !allowedLineIds.includes(p.productLineId)) return false;
      }
      return true;
    }).sort((a, b) => {
      const aBrand = (a.brandId ? brandMap[a.brandId]?.name : '') || '';
      const bBrand = (b.brandId ? brandMap[b.brandId]?.name : '') || '';
      const brandCmp = aBrand.localeCompare(bBrand);
      if (brandCmp !== 0) return brandCmp;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [allProducts, brand?.id, selectedRootLineId, selectedChildLineId, activeProductLines, brandMap]);

  const { groups: variantGroups, singles: singleProducts } = useMemo(
    () => groupProductsIntoVariants(brandProducts),
    [brandProducts]
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

  if (brandLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="min-h-screen bg-background">
        <DeliveryHeader cartItemCount={cartItemCount} />
        <DeliveryCategoryNav />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Brand Not Found</h1>
          <Link href="/delivery/shop">
            <Button>Back to Shop</Button>
          </Link>
        </div>
        <DeliveryFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DeliveryHeader cartItemCount={cartItemCount} />
      <DeliveryCategoryNav />
      
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mb-8"
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <Button variant="ghost" className="mb-4 gap-2 hover:translate-x-[-4px] transition-transform" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </motion.div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 sm:gap-6 min-w-0">
              {brand.logo && (
                <motion.div 
                  className="w-16 h-16 sm:w-24 sm:h-24 bg-white rounded-xl p-2 sm:p-3 flex items-center justify-center shadow-lg flex-shrink-0"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
                  whileHover={{ scale: 1.05, rotate: 2 }}
                >
                  <img src={brand.logo} alt={`${brand.name} - Vape Cave Frisco`} loading="lazy" className="w-full h-full object-contain" />
                </motion.div>
              )}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="min-w-0"
              >
                <h1 className="text-2xl sm:text-4xl font-bold text-foreground">{brand.name}</h1>
                <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                  {displayItems.length} {displayItems.length === 1 ? 'product' : 'products'} available
                </p>
              </motion.div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
                className="h-8 w-8 sm:h-10 sm:w-10"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
                className="h-8 w-8 sm:h-10 sm:w-10"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        {rootProductLines.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedRootLineId === null ? "default" : "outline"}
                onClick={() => { setSelectedRootLineId(null); setSelectedChildLineId(null); }}
                className={`rounded-full ${
                  selectedRootLineId === null 
                    ? 'bg-primary text-primary-foreground' 
                    : 'border-border/50 hover:border-primary/50'
                }`}
              >
                All Products
              </Button>
              {rootProductLines.map((pl) => (
                <Button
                  key={pl.id}
                  variant={selectedRootLineId === pl.id ? "default" : "outline"}
                  onClick={() => { setSelectedRootLineId(pl.id); setSelectedChildLineId(null); }}
                  className={`rounded-full ${
                    selectedRootLineId === pl.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'border-border/50 hover:border-primary/50'
                  }`}
                >
                  {pl.name}
                </Button>
              ))}
            </div>
          </motion.div>
        )}

        {childProductLines.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-wrap gap-2 pl-2 border-l-2 border-primary/30">
              <Button
                size="sm"
                variant={selectedChildLineId === null ? "default" : "outline"}
                onClick={() => { setSelectedChildLineId(null); }}
                className={`rounded-full text-sm ${
                  selectedChildLineId === null 
                    ? 'bg-primary/80 text-primary-foreground' 
                    : 'border-border/50 hover:border-primary/50'
                }`}
              >
                All {rootProductLines.find(pl => pl.id === selectedRootLineId)?.name}
              </Button>
              {childProductLines.map((pl) => {
                const grandChildren = getChildLines(pl.id);
                return (
                  <Button
                    key={pl.id}
                    size="sm"
                    variant={selectedChildLineId === pl.id ? "default" : "outline"}
                    onClick={() => { setSelectedChildLineId(pl.id); }}
                    className={`rounded-full text-sm ${
                      selectedChildLineId === pl.id 
                        ? 'bg-primary/80 text-primary-foreground' 
                        : 'border-border/50 hover:border-primary/50'
                    }`}
                  >
                    {pl.name}
                    {grandChildren.length > 0 && (
                      <span className="ml-1 text-xs opacity-70">({grandChildren.length})</span>
                    )}
                  </Button>
                );
              })}
            </div>
          </motion.div>
        )}

        {displayItems.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              <AnimatePresence mode="popLayout">
                {displayItems.map((item, index) => {
                  if (isVariantGroup(item)) {
                    const group = item;
                    const selectedNic = getSelectedNic(group);
                    const variant = getVariantData(group);
                    const stock = variant.stockQuantity ? parseInt(variant.stockQuantity) : 0;
                    const isOutOfStock = stock <= 0;
                    return (
                      <motion.div
                        key={group.key}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-primary/50">
                          <div className="relative aspect-square bg-muted/50">
                            <img
                              src={group.image || (group.brandId ? brandMap[group.brandId]?.logo : null) || "/placeholder-product.svg"}
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
                            {isOutOfStock && (
                              <div className="absolute inset-0 bg-background/80 flex items-center justify-center backdrop-blur-sm">
                                <Badge variant="destructive" className="text-sm">Out of Stock</Badge>
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            {(group.brandLine || group.brand) && (
                              <p className="font-semibold text-xs line-clamp-1 text-foreground">{group.brandLine || group.brand}</p>
                            )}
                            <h3 className="font-medium text-sm line-clamp-1">{group.displayName}</h3>
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
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                                    }`}
                                    title={vStock <= 0 ? `${level} - Out of stock` : level}
                                  >
                                    {level}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              {variant.salePrice ? (
                                <div className="flex items-baseline gap-1">
                                  <p className="text-base font-bold text-primary">${variant.salePrice}</p>
                                  <p className="text-[10px] text-muted-foreground line-through">${variant.price}</p>
                                </div>
                              ) : (
                                <p className="text-base font-bold text-primary">${variant.price}</p>
                              )}
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openVariantQuickView(group)}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {(() => {
                                  const qty = cartItems[variant.productId] || 0;
                                  return qty > 0 ? (
                                    <div className="flex items-center gap-0.5">
                                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleUpdateQuantity(variant.productId, qty - 1)} disabled={updateCartMutation.isPending}>
                                        <Minus className="w-4 h-4" />
                                      </Button>
                                      <span className="text-xs font-semibold w-5 text-center">{qty}</span>
                                      <Button size="sm" className="h-8 w-8 p-0" onClick={() => handleAddToCart(variant.productId, 1)} disabled={addToCartMutation.isPending}>
                                        <Plus className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button size="sm" className="h-8 w-8 p-0" onClick={() => handleAddToCart(variant.productId, 1)} disabled={addToCartMutation.isPending || isOutOfStock}>
                                      <Plus className="w-4 h-4" />
                                    </Button>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  }

                  const product = item as DeliveryProduct;
                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      index={index}
                      onAddToCart={handleAddToCart}
                      onUpdateQuantity={handleUpdateQuantity}
                      onQuickView={setQuickViewProduct}
                      brandMap={brandMap}
                      cartQty={cartItems[product.id] || 0}
                      addPending={addToCartMutation.isPending}
                      updatePending={updateCartMutation.isPending}
                      packMode={packToggleMap[product.id] || 'single'}
                      onPackToggle={(id, mode) => setPackToggleMap(prev => ({ ...prev, [id]: mode }))}
                    />
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <div className="space-y-3">
              {displayItems.map((item, index) => {
                if (isVariantGroup(item)) {
                  const group = item;
                  const selectedNic = getSelectedNic(group);
                  const variant = getVariantData(group);
                  const stock = variant.stockQuantity ? parseInt(variant.stockQuantity) : 0;
                  const isOutOfStock = stock <= 0;
                  return (
                    <motion.div
                      key={group.key}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <Card className={`flex items-center gap-3 p-3 hover:shadow-lg transition-all duration-300 hover:border-primary/50 ${isOutOfStock ? 'opacity-60' : ''}`}>
                        <div className="relative w-20 h-20 bg-muted/50 rounded-lg flex-shrink-0 overflow-hidden">
                          <img
                            src={group.image || (group.brandId ? brandMap[group.brandId]?.logo : null) || '/placeholder-product.svg'}
                            alt={group.displayName}
                            loading="lazy"
                            className={`w-full h-full object-contain p-1 ${isOutOfStock ? 'opacity-50' : ''}`}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (target.dataset.fallbackAttempted) { target.src = '/placeholder-product.svg'; return; }
                              target.dataset.fallbackAttempted = '1';
                              const brandLogo = group.brandId ? brandMap[group.brandId]?.logo : null;
                              target.src = brandLogo || '/placeholder-product.svg';
                            }}
                          />
                          {isOutOfStock && (
                            <div className="absolute inset-0 bg-background/60 flex items-center justify-center rounded-lg">
                              <Badge variant="destructive" className="text-[10px]">Out</Badge>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm line-clamp-1">{group.displayName}</h3>
                          <p className="text-[10px] text-muted-foreground">
                            {[group.mlSize, selectedNic].filter(Boolean).join(' · ')}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {sortNicLevels(group.variants.map(v => v.nicLevel)).map(level => {
                              const v = getVariantByNicLevel(group, level);
                              const vStock = v?.stockQuantity ? parseInt(v.stockQuantity) : 0;
                              return (
                                <button
                                  key={level}
                                  onClick={() => setSelectedNic(group.key, level)}
                                  className={`text-[10px] px-1.5 py-0.5 rounded border transition-all ${
                                    vStock <= 0
                                      ? 'border-muted-foreground/20 text-muted-foreground/40 line-through'
                                      : selectedNic === level
                                      ? 'bg-primary text-primary-foreground border-primary'
                                      : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                                  }`}
                                  title={vStock <= 0 ? `${level} - Out of stock` : level}
                                >
                                  {level}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="text-right">
                            {variant.salePrice ? (
                              <>
                                <p className="text-base font-bold text-primary">${variant.salePrice}</p>
                                <p className="text-[10px] text-muted-foreground line-through">${variant.price}</p>
                              </>
                            ) : (
                              <p className="text-base font-bold text-primary">${variant.price}</p>
                            )}
                          </div>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openVariantQuickView(group)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          {(() => {
                            const qty = cartItems[variant.productId] || 0;
                            return qty > 0 ? (
                              <div className="flex items-center gap-0.5">
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleUpdateQuantity(variant.productId, qty - 1)} disabled={updateCartMutation.isPending}>
                                  <Minus className="w-4 h-4" />
                                </Button>
                                <span className="text-xs font-semibold w-5 text-center">{qty}</span>
                                <Button size="sm" className="h-8 w-8 p-0" onClick={() => handleAddToCart(variant.productId, 1)} disabled={addToCartMutation.isPending}>
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : !isOutOfStock ? (
                              <Button size="sm" className="h-8" onClick={() => handleAddToCart(variant.productId, 1)} disabled={addToCartMutation.isPending}>
                                <Plus className="w-3 h-3 mr-1" />
                                Add
                              </Button>
                            ) : null;
                          })()}
                        </div>
                      </Card>
                    </motion.div>
                  );
                }

                const product = item as DeliveryProduct;
                const stock = product.stockQuantity ? parseInt(product.stockQuantity) : 0;
                const isOutOfStock = stock <= 0;
                const lQty = cartItems[product.id] || 0;
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card className={`flex items-center gap-3 p-3 hover:shadow-lg transition-all duration-300 hover:border-primary/50 ${isOutOfStock ? 'opacity-60' : ''}`}>
                      <div className="relative w-20 h-20 bg-muted/50 rounded-lg flex-shrink-0 overflow-hidden">
                        <img
                          src={product.image || (product.brandId ? brandMap[product.brandId]?.logo : null) || '/placeholder-product.svg'}
                          alt={product.name}
                          loading="lazy"
                          className={`w-full h-full object-contain p-1 ${isOutOfStock ? 'blur-sm opacity-70' : ''}`}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.dataset.fallbackAttempted) { target.src = '/placeholder-product.svg'; return; }
                            target.dataset.fallbackAttempted = '1';
                            const brandLogo = product.brandId ? brandMap[product.brandId]?.logo : null;
                            target.src = brandLogo || '/placeholder-product.svg';
                          }}
                        />
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-background/60 flex items-center justify-center rounded-lg">
                            <Badge variant="destructive" className="text-[10px]">Out</Badge>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          {isOutOfStock && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Out of Stock</Badge>
                          )}
                          {product.badge && (
                            <Badge variant={product.badge === 'sale' ? 'destructive' : 'secondary'} className="text-[10px] px-1.5 py-0">
                              {product.badge}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        {product.salePrice ? (
                          <div className="text-right">
                            <p className="text-base sm:text-xl font-bold text-primary">${product.salePrice}{product.allowPackToggle ? <span className="text-[10px] font-normal text-muted-foreground"> each</span> : null}</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground line-through">${product.price}</p>
                          </div>
                        ) : (
                          <p className="text-base sm:text-xl font-bold text-primary">${product.price}{product.allowPackToggle ? <span className="text-[10px] font-normal text-muted-foreground"> each</span> : null}</p>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => setQuickViewProduct(product)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {lQty > 0 ? (
                          <div className="flex items-center gap-0.5">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleUpdateQuantity(product.id, lQty - 1)} disabled={updateCartMutation.isPending}>
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="text-xs font-semibold w-5 text-center">{lQty}</span>
                            <Button size="sm" className="h-8 w-8 p-0" onClick={() => handleAddToCart(product.id, 1, product.isPackOnly ? 'pack' : 'single')} disabled={addToCartMutation.isPending}>
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" className="h-8 px-2 sm:px-3" onClick={() => handleAddToCart(product.id, 1, product.isPackOnly ? 'pack' : 'single')} disabled={addToCartMutation.isPending || isOutOfStock}>
                            <Plus className="w-4 h-4 sm:mr-1" />
                            <span className="hidden sm:inline">Add</span>
                          </Button>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )
        ) : (
          <div className="text-center py-16 bg-card/50 rounded-2xl border border-border/30">
            <p className="text-muted-foreground text-lg">
              {(selectedRootLineId !== null || selectedChildLineId !== null)
                ? "No products in this product line" 
                : "Products coming soon"}
            </p>
          </div>
        )}
      </main>

      <DeliveryFooter />
      <FloatingCartButton 
        cartItems={apiCartItems}
        products={brandProducts.map(p => ({ id: p.id, price: p.salePrice || p.price, name: p.name }))}
      />
      
      <ProductQuickView
        product={quickViewProduct}
        variantGroup={quickViewVariantGroup}
        selectedNicLevel={quickViewVariantNic}
        onNicLevelChange={setQuickViewVariantNic}
        open={!!(quickViewProduct || quickViewVariantGroup)}
        onClose={() => { setQuickViewProduct(null); closeVariantQuickView(); }}
        onAddToCart={async (productId: number, quantity: number, purchaseType?: string) => {
          handleAddToCart(productId, quantity, purchaseType);
          setQuickViewProduct(null);
          closeVariantQuickView();
        }}
      />
    </div>
  );
}

function ProductCard({ 
  product, 
  index, 
  onAddToCart,
  onUpdateQuantity,
  onQuickView,
  brandMap,
  cartQty,
  addPending,
  updatePending,
  packMode,
  onPackToggle
}: { 
  product: DeliveryProduct;
  index: number;
  onAddToCart: (productId: number, quantity?: number, purchaseType?: string) => void;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onQuickView: (product: DeliveryProduct) => void;
  brandMap: Record<number, DeliveryBrand>;
  cartQty: number;
  addPending: boolean;
  updatePending: boolean;
  packMode: 'single' | 'pack';
  onPackToggle: (productId: number, mode: 'single' | 'pack') => void;
}) {
  const stock = product.stockQuantity ? parseInt(product.stockQuantity) : 0;
  const isOutOfStock = stock <= 0;
  const packSize = product.packSize || 1;
  const packDiscountPercent = product.packDiscountPercent || 0;
  const canPack = product.allowPackToggle && stock >= packSize;
  const isPackMode = packMode === 'pack' && canPack;
  const displayPrice = isPackMode
    ? (parseFloat(product.salePrice || product.price) * packSize * (1 - packDiscountPercent / 100)).toFixed(2)
    : (product.salePrice || product.price);
  const purchaseType = product.isPackOnly ? 'pack' : (isPackMode ? 'pack' : 'single');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      layout
      className="h-full"
    >
      <Card className="group h-full flex flex-col overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-primary/50">
        <div className="relative aspect-square bg-muted/50">
          <img
            src={product.image || (product.brandId ? brandMap[product.brandId]?.logo : null) || '/placeholder-product.svg'}
            alt={`${product.name} - Vape Cave`}
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
          {product.badge && (
            <Badge
              className={`absolute top-2 left-2 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 ${
                product.badge === 'popular' ? 'bg-primary text-primary-foreground' :
                product.badge === 'new' ? 'bg-green-500 text-white' :
                product.badge === 'sale' ? 'bg-red-500 text-white' :
                'bg-secondary text-secondary-foreground'
              }`}
            >
              {product.badge === 'popular' && <TrendingUp className="w-2.5 h-2.5 mr-0.5" />}
              {product.badge === 'new' && <Sparkles className="w-2.5 h-2.5 mr-0.5" />}
              {product.badge.toUpperCase()}
            </Badge>
          )}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center backdrop-blur-sm">
              <Badge variant="destructive" className="text-sm">Out of Stock</Badge>
            </div>
          )}
        </div>
        <div className="p-3 flex flex-col flex-1">
          <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>
          {(() => { const nic = (product as any).nicotineOverride || extractNicLevel(product.name); return nic ? (
            <span className="inline-block text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-semibold mt-0.5 mb-1">{nic}</span>
          ) : null; })()}
          <div className="mt-auto pt-2">
          <div className="flex items-center justify-between">
            {isPackMode ? (
              <div>
                <p className="text-lg font-bold text-primary">${displayPrice}</p>
                <p className="text-[10px] text-muted-foreground">pack of {packSize}</p>
              </div>
            ) : product.salePrice ? (
              <div className="flex items-baseline gap-1">
                <p className="text-lg font-bold text-primary">${product.salePrice}{product.allowPackToggle ? <span className="text-xs font-normal text-muted-foreground"> each</span> : null}</p>
                <p className="text-xs text-muted-foreground line-through">${product.price}</p>
              </div>
            ) : (
              <p className="text-lg font-bold text-primary">${product.price}{product.allowPackToggle ? <span className="text-xs font-normal text-muted-foreground"> each</span> : null}</p>
            )}
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={() => onQuickView(product)}
              >
                <Eye className="w-4 h-4" />
              </Button>
              {cartQty > 0 ? (
                <div className="flex items-center gap-0.5">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => onUpdateQuantity(product.id, cartQty - 1)} disabled={updatePending}>
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-xs font-semibold w-5 text-center">{cartQty}</span>
                  <Button size="sm" className="h-8 w-8 p-0" onClick={() => onAddToCart(product.id, 1, purchaseType)} disabled={addPending}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button size="sm" className="h-8 w-8 p-0" onClick={() => onAddToCart(product.id, 1, purchaseType)} disabled={addPending || isOutOfStock}>
                  <Plus className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
          {product.allowPackToggle && !product.isPackOnly && (
            <div className="flex items-start gap-1 mt-2">
              <button
                onClick={() => onPackToggle(product.id, 'single')}
                className={`flex-1 text-[10px] py-1 rounded border transition-all ${
                  packMode === 'single'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                Single
              </button>
              <div className="flex-1 flex flex-col items-center gap-0.5">
                <button
                  onClick={() => canPack && onPackToggle(product.id, 'pack')}
                  disabled={!canPack}
                  className={`w-full text-[10px] py-1 rounded border transition-all ${
                    !canPack
                      ? 'border-muted-foreground/20 text-muted-foreground/40 cursor-not-allowed'
                      : packMode === 'pack'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  }`}
                  title={!canPack ? 'Not enough stock for a pack' : `Pack of ${packSize}`}
                >
                  Pack ({packSize})
                </button>
                <span className={`text-[9px] font-semibold ${packDiscountPercent > 0 ? 'text-green-500' : 'invisible'}`}>Save {packDiscountPercent}%</span>
              </div>
            </div>
          )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
