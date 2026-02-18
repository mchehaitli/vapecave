import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Eye, Plus, Minus, ShoppingCart, TrendingUp, Sparkles, Grid3X3, List } from "lucide-react";
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
  const [selectedNicotine, setSelectedNicotine] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">(window.innerWidth < 640 ? "list" : "grid");
  const [quickViewProduct, setQuickViewProduct] = useState<DeliveryProduct | null>(null);

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

  const { data: categories = [] } = useQuery<{ id: number; name: string; slug: string }[]>({
    queryKey: ['/api/delivery/categories'],
  });

  const brandMap = useMemo(() => {
    const map: Record<number, DeliveryBrand> = {};
    allBrandsForLookup.forEach(b => { map[b.id] = b; });
    return map;
  }, [allBrandsForLookup]);

  const isNicotineCategory = useMemo(() => {
    if (!brand?.categoryId) return false;
    const cat = categories.find(c => c.id === brand.categoryId);
    if (!cat) return false;
    const slug = cat.slug.toLowerCase();
    return slug === 'e-liquids' || slug === 'salts';
  }, [brand?.categoryId, categories]);

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
    addToCartMutation.mutate({ productId, quantity }, {
      onSuccess: () => {
        toast({
          title: "Added to cart",
          description: "Item has been added to your cart.",
        });
      }
    });
  };

  const handleUpdateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      addToCartMutation.mutate({ productId, quantity: 0 });
    } else {
      addToCartMutation.mutate({ productId, quantity });
    }
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

  const parseNicotine = (name: string): string | null => {
    const match = name.match(/(\d+)\s*mg/i);
    if (match) return `${match[1]}mg`;
    const pctMatch = name.match(/(\d+)\s*%/i);
    if (pctMatch) return `${pctMatch[1]}%`;
    if (/0[°˚]/.test(name)) return '0mg';
    return null;
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
      if (selectedNicotine !== null && isNicotineCategory) {
        const nic = parseNicotine(p.name);
        if (nic !== selectedNicotine) return false;
      }
      return true;
    }).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }, [allProducts, brand?.id, selectedRootLineId, selectedChildLineId, activeProductLines, selectedNicotine, isNicotineCategory]);

  const availableNicotineStrengths = useMemo(() => {
    if (!isNicotineCategory || !brand?.id) return [];
    const strengths = new Set<string>();
    allProducts.forEach(p => {
      if (!p.enabled || p.brandId !== brand.id) return;
      const nic = parseNicotine(p.name);
      if (nic) strengths.add(nic);
    });
    return Array.from(strengths).sort((a, b) => {
      const numA = parseInt(a);
      const numB = parseInt(b);
      return numA - numB;
    });
  }, [allProducts, brand?.id, isNicotineCategory]);

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
        <DeliveryHeader />
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
      <DeliveryHeader />
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
                  {brandProducts.length} {brandProducts.length === 1 ? 'product' : 'products'} available
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
                onClick={() => { setSelectedRootLineId(null); setSelectedChildLineId(null); setSelectedNicotine(null); }}
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
                  onClick={() => { setSelectedRootLineId(pl.id); setSelectedChildLineId(null); setSelectedNicotine(null); }}
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
                onClick={() => { setSelectedChildLineId(null); setSelectedNicotine(null); }}
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
                    onClick={() => { setSelectedChildLineId(pl.id); setSelectedNicotine(null); }}
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

        {isNicotineCategory && availableNicotineStrengths.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-muted-foreground mr-1">Nicotine:</span>
              <Button
                size="sm"
                variant={selectedNicotine === null ? "default" : "outline"}
                onClick={() => setSelectedNicotine(null)}
                className={`rounded-full text-xs h-7 px-3 ${
                  selectedNicotine === null 
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                    : 'border-border/50 hover:border-emerald-500/50'
                }`}
              >
                All
              </Button>
              {availableNicotineStrengths.map((strength) => (
                <Button
                  key={strength}
                  size="sm"
                  variant={selectedNicotine === strength ? "default" : "outline"}
                  onClick={() => setSelectedNicotine(strength)}
                  className={`rounded-full text-xs h-7 px-3 ${
                    selectedNicotine === strength 
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                      : 'border-border/50 hover:border-emerald-500/50'
                  }`}
                >
                  {strength}
                </Button>
              ))}
            </div>
          </motion.div>
        )}

        {brandProducts.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
              <AnimatePresence mode="popLayout">
                {brandProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    index={index}
                    inCart={cartItems[product.id]}
                    onAddToCart={handleAddToCart}
                    onUpdateQuantity={handleUpdateQuantity}
                    onQuickView={setQuickViewProduct}
                    brandMap={brandMap}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="space-y-3">
              {brandProducts.map((product, index) => {
                const stock = product.stockQuantity ? parseInt(product.stockQuantity) : 0;
                const isOutOfStock = stock <= 0;
                const isLowStock = stock > 0 && stock <= 2;
                const isInStock = stock >= 3;
                const quantity = cartItems[product.id] || 0;

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
                            if (target.dataset.fallbackAttempted) {
                              target.src = '/placeholder-product.svg';
                              return;
                            }
                            target.dataset.fallbackAttempted = '1';
                            const brandLogo = product.brandId ? brandMap[product.brandId]?.logo : null;
                            if (brandLogo) {
                              target.src = brandLogo;
                            } else {
                              target.src = '/placeholder-product.svg';
                            }
                          }}
                        />
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-background/60 flex items-center justify-center rounded-lg">
                            <Badge variant="destructive" className="text-[10px]">Out</Badge>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-1 flex-wrap">
                          <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          {isOutOfStock ? (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Out of Stock</Badge>
                          ) : isLowStock ? (
                            <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0">Low Stock</Badge>
                          ) : (
                            <Badge className="bg-green-500 text-white text-[10px] px-1.5 py-0">In Stock</Badge>
                          )}
                          {product.badge && (
                            <Badge variant={product.badge === 'sale' ? 'destructive' : 'secondary'} className="text-[10px] px-1.5 py-0">
                              {product.badge}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-right">
                          {product.salePrice ? (
                            <>
                              <p className="text-base font-bold text-primary">${product.salePrice}</p>
                              <p className="text-[10px] text-muted-foreground line-through">${product.price}</p>
                            </>
                          ) : (
                            <p className="text-base font-bold text-primary">${product.price}</p>
                          )}
                        </div>
                        {!isOutOfStock && (
                          quantity > 0 ? (
                            <div className="flex items-center gap-1">
                              <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => handleUpdateQuantity(product.id, quantity - 1)}>
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="text-sm font-medium w-5 text-center">{quantity}</span>
                              <Button size="icon" className="h-7 w-7" onClick={() => handleUpdateQuantity(product.id, quantity + 1)}>
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button size="sm" className="h-8" onClick={() => handleAddToCart(product.id)}>
                              <Plus className="w-3 h-3 mr-1" />
                              Add
                            </Button>
                          )
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

function ProductCard({ 
  product, 
  index, 
  inCart, 
  onAddToCart, 
  onUpdateQuantity, 
  onQuickView,
  brandMap
}: { 
  product: DeliveryProduct;
  index: number;
  inCart?: number;
  onAddToCart: (productId: number) => void;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onQuickView: (product: DeliveryProduct) => void;
  brandMap: Record<number, DeliveryBrand>;
}) {
  const stock = product.stockQuantity ? parseInt(product.stockQuantity) : 0;
  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= 2;
  const isInStock = stock >= 3;

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
        <Card className="group h-full overflow-hidden bg-card border-border/50 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(255,113,0,0.15)] transition-all duration-300">
          <div className="relative aspect-square overflow-hidden bg-gradient-to-b from-muted/50 to-muted">
            <img
              src={product.image || (product.brandId ? brandMap[product.brandId]?.logo : null) || '/placeholder-product.svg'}
              alt={product.name}
              className={`w-full h-full object-contain transition-transform duration-500 group-hover:scale-110 ${isOutOfStock ? 'blur-sm opacity-70' : ''}`}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.dataset.fallbackAttempted) {
                  target.src = '/placeholder-product.svg';
                  return;
                }
                target.dataset.fallbackAttempted = '1';
                const brandLogo = product.brandId ? brandMap[product.brandId]?.logo : null;
                if (brandLogo) {
                  target.src = brandLogo;
                } else {
                  target.src = '/placeholder-product.svg';
                }
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

            {isLowStock && !isOutOfStock && (
              <Badge 
                className="absolute top-2 right-2 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-amber-500 text-white"
              >
                Low Stock
              </Badge>
            )}

            {isInStock && !product.badge && (
              <Badge 
                className="absolute top-2 right-2 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 bg-green-500 text-white"
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
                <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span className="hidden sm:inline">Quick View</span>
                <span className="sm:hidden">View</span>
              </Button>
              {!isOutOfStock && !inCart && (
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-xs sm:text-sm h-7 sm:h-9 px-2 sm:px-3"
                  onClick={() => onAddToCart(product.id)}
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  Add
                </Button>
              )}
              {!isOutOfStock && inCart && (
                <div className="flex items-center gap-0.5 sm:gap-1 bg-card/90 backdrop-blur-sm rounded-lg p-0.5 sm:p-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                    onClick={() => onUpdateQuantity(product.id, inCart - 1)}
                  >
                    <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                  <span className="w-6 sm:w-8 text-center font-bold text-xs sm:text-sm">{inCart}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                    onClick={() => onUpdateQuantity(product.id, inCart + 1)}
                    disabled={inCart >= stock}
                  >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="p-2 sm:p-3 md:p-4">
            <h3 className="font-semibold text-foreground text-xs sm:text-sm md:text-base line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem] mb-1 sm:mb-2">
              {product.name}
            </h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-1 sm:gap-2">
                {product.salePrice ? (
                  <>
                    <span className="text-base sm:text-xl font-bold text-primary">
                      ${product.salePrice}
                    </span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground line-through">
                      ${product.price}
                    </span>
                  </>
                ) : (
                  <span className="text-base sm:text-xl font-bold text-primary">
                    ${product.price}
                  </span>
                )}
              </div>
              
              {inCart && (
                <Badge variant="secondary" className="bg-primary/20 text-primary text-[10px] sm:text-xs px-1.5 sm:px-2">
                  <ShoppingCart className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                  {inCart}
                </Badge>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
