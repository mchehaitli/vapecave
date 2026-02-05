import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Plus, Minus, Eye, ArrowLeft, Grid3X3, LayoutList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { DeliveryHeader } from "@/components/DeliveryHeader";
import { DeliveryFooter } from "@/components/DeliveryFooter";
import { DeliveryCategoryNav } from "@/components/DeliveryCategoryNav";
import { FloatingCartButton } from "@/components/FloatingCartButton";
import { ProductQuickView } from "@/components/ProductQuickView";
import type { DeliveryProduct, DeliveryBrand, DeliveryProductLine } from "@shared/schema";

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

export default function DeliveryProductLinePage({ params }: { params: { slug: string } }) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [quickViewProduct, setQuickViewProduct] = useState<DeliveryProduct | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  // Track user's manual selection - persists until user clicks a different tab
  const [userSelection, setUserSelection] = useState<{ slug: string; lineId: number | 'all' } | null>(null);

  const { data: productLine, isLoading: lineLoading } = useQuery<DeliveryProductLine>({
    queryKey: ['/api/delivery/product-lines/slug', params.slug],
    queryFn: async () => {
      const lines = await fetch('/api/delivery/product-lines').then(r => r.json());
      return lines.find((pl: DeliveryProductLine) => pl.slug === params.slug);
    }
  });

  const { data: brand } = useQuery<DeliveryBrand>({
    queryKey: ['/api/delivery/brands', productLine?.brandId],
    queryFn: async () => {
      if (!productLine?.brandId) return null;
      const brands = await fetch('/api/delivery/brands').then(r => r.json());
      return brands.find((b: DeliveryBrand) => b.id === productLine.brandId);
    },
    enabled: !!productLine?.brandId
  });

  // Fetch all product lines for this brand to show tabs
  const { data: brandProductLines = [] } = useQuery<DeliveryProductLine[]>({
    queryKey: ['/api/delivery/product-lines/brand', productLine?.brandId],
    queryFn: async () => {
      if (!productLine?.brandId) return [];
      const lines = await fetch('/api/delivery/product-lines').then(r => r.json());
      return lines.filter((pl: DeliveryProductLine) => pl.brandId === productLine.brandId && pl.isActive);
    },
    enabled: !!productLine?.brandId
  });

  // Determine effective selected product line (no useEffect needed)
  // If user made a selection for current slug, use it; otherwise default to URL's product line
  const selectedProductLineId = 
    userSelection?.slug === params.slug && userSelection.lineId === 'all' 
      ? null 
      : userSelection?.slug === params.slug && userSelection.lineId !== 'all'
        ? userSelection.lineId
        : productLine?.id ?? null;
  
  // Handler for tab clicks
  const handleSelectLine = (lineId: number | 'all') => {
    setUserSelection({ slug: params.slug, lineId });
  };

  const { data: allProducts = [] } = useQuery<DeliveryProduct[]>({
    queryKey: ['/api/delivery/products'],
  });

  // Filter products based on selected product line (or all if null)
  const products = allProducts.filter(p => {
    if (!p.enabled) return false;
    if (selectedProductLineId === null) {
      // Show all products from this brand's product lines
      return brandProductLines.some(pl => pl.id === p.productLineId);
    }
    return p.productLineId === selectedProductLineId;
  });

  const featuredIds = (productLine?.featuredProductIds as number[]) || [];
  const sortedProducts = [...products].sort((a, b) => {
    const aFeatured = featuredIds.includes(a.id);
    const bFeatured = featuredIds.includes(b.id);
    if (aFeatured && !bFeatured) return -1;
    if (!aFeatured && bFeatured) return 1;
    return (a.displayOrder || 0) - (b.displayOrder || 0);
  });

  const { data: cart = [] } = useQuery<CartItem[]>({
    queryKey: ['/api/delivery/cart'],
  });

  // Use useMemo instead of useEffect to avoid infinite loops
  const derivedCartQuantities = useMemo(() => {
    const quantities: Record<number, number> = {};
    cart.forEach(item => {
      quantities[item.productId] = item.quantity;
    });
    return quantities;
  }, [cart]);

  const addToCart = useMutation({
    mutationFn: async (productId: number) => {
      const response = await fetch('/api/delivery/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      if (!response.ok) throw new Error('Failed to add to cart');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/delivery/cart'] });
      toast({ title: "Added to cart!" });
    },
    onError: () => {
      toast({ title: "Please sign in to add items", variant: "destructive" });
    }
  });

  const updateQuantity = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: number; quantity: number }) => {
      if (quantity <= 0) {
        const cartItem = cart.find(item => item.productId === productId);
        if (cartItem) {
          const response = await fetch(`/api/delivery/cart/${cartItem.id}`, {
            method: 'DELETE',
            credentials: 'include',
          });
          if (!response.ok) throw new Error('Failed to remove from cart');
          return response.json();
        }
        return;
      }
      const response = await fetch('/api/delivery/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productId, quantity }),
      });
      if (!response.ok) throw new Error('Failed to update cart');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/delivery/cart'] });
    }
  });

  const handleUpdateQuantity = (productId: number, quantity: number) => {
    updateQuantity.mutate({ productId, quantity });
  };

  if (lineLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!productLine) {
    return (
      <div className="min-h-screen bg-background">
        <DeliveryHeader />
        <DeliveryCategoryNav />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Product Line Not Found</h1>
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
      
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mb-8"
        >
          <motion.div 
            className="flex items-center gap-2 text-sm text-muted-foreground mb-4"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <Link href="/delivery/shop">
              <span className="hover:text-primary cursor-pointer transition-colors">Home</span>
            </Link>
            <span>/</span>
            {brand && (
              <>
                <Link href={`/delivery/brand/${brand.slug}`}>
                  <span className="hover:text-primary cursor-pointer transition-colors">{brand.name}</span>
                </Link>
                <span>/</span>
              </>
            )}
            <span className="text-foreground">{productLine.name}</span>
          </motion.div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {productLine.logo && (
                <motion.img 
                  src={productLine.logo} 
                  alt={productLine.name} 
                  className="w-16 h-16 object-contain rounded-lg bg-muted p-2 shadow-md"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.4, type: 'spring' }}
                  whileHover={{ scale: 1.05 }}
                />
              )}
              <motion.div
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25, duration: 0.4 }}
              >
                <h1 className="text-4xl font-bold text-foreground">{productLine.name}</h1>
                <p className="text-muted-foreground">
                  {sortedProducts.length} {sortedProducts.length === 1 ? 'product' : 'products'} available
                </p>
              </motion.div>
            </div>
            
            <motion.div 
              className="flex gap-2"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
                className="transition-transform hover:scale-105"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
                className="transition-transform hover:scale-105"
              >
                <LayoutList className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Product Line Tabs */}
        {brandProductLines.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedProductLineId === null ? "default" : "outline"}
                onClick={() => handleSelectLine('all')}
                className={`rounded-full ${
                  selectedProductLineId === null 
                    ? 'bg-primary text-primary-foreground' 
                    : 'border-border/50 hover:border-primary/50'
                }`}
              >
                All Products
              </Button>
              {brandProductLines.map((pl) => (
                <Button
                  key={pl.id}
                  variant={selectedProductLineId === pl.id ? "default" : "outline"}
                  onClick={() => handleSelectLine(pl.id)}
                  className={`rounded-full ${
                    selectedProductLineId === pl.id 
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

        {sortedProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No products available in this line yet.</p>
            <Link href="/delivery/shop">
              <Button className="mt-4">Browse All Products</Button>
            </Link>
          </div>
        ) : viewMode === 'grid' ? (
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.05 }}
          >
            {sortedProducts.map((product, index) => {
              const quantity = derivedCartQuantities[product.id] || 0;
              const isFeatured = featuredIds.includes(product.id);
              
              const stock = product.stockQuantity ? parseInt(product.stockQuantity) : 0;
              const isOutOfStock = stock === 0;
              const isLowStock = stock > 0 && stock <= 2;

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card className={`group relative overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 ${isFeatured ? 'ring-2 ring-primary/50' : ''}`}>
                    {isFeatured && (
                      <div className="absolute top-2 left-2 z-10">
                        <Badge className="bg-primary text-primary-foreground text-xs">Featured</Badge>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 items-end">
                      {product.badge && (
                        <Badge variant={product.badge === 'sale' ? 'destructive' : 'secondary'} className="text-xs">
                          {product.badge}
                        </Badge>
                      )}
                      {isOutOfStock ? (
                        <Badge className="bg-red-500/90 text-white text-xs">Out of Stock</Badge>
                      ) : isLowStock ? (
                        <Badge className="bg-amber-500/90 text-white text-xs">Low Stock</Badge>
                      ) : (
                        <Badge className="bg-green-500/90 text-white text-xs">In Stock</Badge>
                      )}
                    </div>
                    
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      <img
                        src={product.image || '/placeholder-product.png'}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0"
                        onClick={() => setQuickViewProduct(product)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="p-4 space-y-3">
                      <h3 className="font-semibold text-foreground line-clamp-2 min-h-[3rem]">
                        {product.name}
                      </h3>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {product.salePrice ? (
                            <>
                              <span className="text-lg font-bold text-primary">${product.salePrice}</span>
                              <span className="text-sm text-muted-foreground line-through">${product.price}</span>
                            </>
                          ) : (
                            <span className="text-lg font-bold text-primary">${product.price}</span>
                          )}
                        </div>
                        
                        {quantity > 0 ? (
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7"
                              onClick={() => handleUpdateQuantity(product.id, quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-6 text-center font-semibold text-sm">{quantity}</span>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7"
                              onClick={() => handleUpdateQuantity(product.id, quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => addToCart.mutate(product.id)}
                            className="gap-1"
                          >
                            <ShoppingCart className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {sortedProducts.map((product, index) => {
              const quantity = derivedCartQuantities[product.id] || 0;
              const isFeatured = featuredIds.includes(product.id);
              const stock = product.stockQuantity ? parseInt(product.stockQuantity) : 0;
              const isOutOfStock = stock === 0;
              const isLowStock = stock > 0 && stock <= 2;
              
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card className={`flex overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-300 ${isFeatured ? 'ring-2 ring-primary/50' : ''}`}>
                    <div className="relative w-32 h-32 flex-shrink-0 overflow-hidden bg-muted">
                      <img
                        src={product.image || '/placeholder-product.png'}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      {isFeatured && (
                        <div className="absolute top-1 left-1">
                          <Badge className="bg-primary text-primary-foreground text-xs">Featured</Badge>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{product.name}</h3>
                        {product.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{product.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {product.badge && (
                            <Badge variant={product.badge === 'sale' ? 'destructive' : 'secondary'} className="text-xs">
                              {product.badge}
                            </Badge>
                          )}
                          {isOutOfStock ? (
                            <Badge className="bg-red-500/90 text-white text-xs">Out of Stock</Badge>
                          ) : isLowStock ? (
                            <Badge className="bg-amber-500/90 text-white text-xs">Low Stock</Badge>
                          ) : (
                            <Badge className="bg-green-500/90 text-white text-xs">In Stock</Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          {product.salePrice ? (
                            <>
                              <span className="text-xl font-bold text-primary">${product.salePrice}</span>
                              <span className="text-sm text-muted-foreground line-through ml-2">${product.price}</span>
                            </>
                          ) : (
                            <span className="text-xl font-bold text-primary">${product.price}</span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setQuickViewProduct(product)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {quantity > 0 ? (
                            <div className="flex items-center gap-2">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8"
                                onClick={() => handleUpdateQuantity(product.id, quantity - 1)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center font-semibold">{quantity}</span>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8"
                                onClick={() => handleUpdateQuantity(product.id, quantity + 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button onClick={() => addToCart.mutate(product.id)} className="gap-2">
                              <ShoppingCart className="h-4 w-4" />
                              Add to Cart
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </main>

      <DeliveryFooter />
      <FloatingCartButton
        cartItems={cart}
        products={sortedProducts.map(p => ({ id: p.id, price: p.salePrice || p.price, name: p.name }))}
      />
      
      <ProductQuickView
        product={quickViewProduct}
        open={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={async (productId: number, quantity: number) => {
          addToCart.mutate(productId);
          setQuickViewProduct(null);
        }}
      />
    </div>
  );
}
