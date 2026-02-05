import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Grid3X3, List, Star, Package, Plus, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeliveryHeader } from "@/components/DeliveryHeader";
import { DeliveryFooter } from "@/components/DeliveryFooter";
import { DeliveryCategoryNav } from "@/components/DeliveryCategoryNav";
import { FloatingCartButton } from "@/components/FloatingCartButton";
import { ProductQuickView } from "@/components/ProductQuickView";
import { useToast } from "@/hooks/use-toast";
import type { DeliveryProduct, DeliveryCategory, DeliveryBrand } from "@shared/schema";

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

export default function DeliveryCategoryPage() {
  const [, params] = useRoute("/delivery/category/:slug");
  const slug = params?.slug;
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [quickViewProduct, setQuickViewProduct] = useState<DeliveryProduct | null>(null);
  const { toast } = useToast();

  const { data: categories = [] } = useQuery<DeliveryCategory[]>({
    queryKey: ["/api/delivery/categories"],
  });

  const { data: brands = [] } = useQuery<DeliveryBrand[]>({
    queryKey: ["/api/delivery/brands"],
  });

  const { data: products = [] } = useQuery<DeliveryProduct[]>({
    queryKey: ["/api/delivery/products"],
  });

  const { data: cartItems = [] } = useQuery<CartItem[]>({
    queryKey: ["/api/delivery/cart"],
    queryFn: async () => {
      const response = await fetch("/api/delivery/cart", { credentials: "include" });
      if (!response.ok) return [];
      return response.json();
    },
  });

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: number; quantity: number }) => {
      const response = await fetch("/api/delivery/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productId, quantity }),
      });
      if (!response.ok) throw new Error("Failed to add to cart");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery/cart"] });
      toast({ title: "Added to cart", description: "Product added to your cart." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add to cart.", variant: "destructive" });
    },
  });

  const category = categories.find((c) => c.slug === slug);
  const featuredIds = (category?.featuredProductIds as number[]) || [];

  const categoryProducts = products
    .filter((p) => {
      if (!p.enabled || !p.category || !category) return false;
      
      const productCat = p.category.toLowerCase().trim();
      const catName = category.name.toLowerCase().trim();
      const catSlug = category.slug.toLowerCase().trim();
      
      // Normalize by removing trailing 's' for singular/plural matching
      const productCatNormalized = productCat.replace(/s$/, '');
      const catNameNormalized = catName.replace(/s$/, '');
      const catSlugNormalized = catSlug.replace(/s$/, '');
      
      // Check multiple matching conditions
      return (
        productCat === catName ||                           // exact match with name
        productCat === catSlug ||                           // exact match with slug
        productCatNormalized === catNameNormalized ||       // singular/plural match
        productCatNormalized === catSlugNormalized ||       // singular/plural match with slug
        productCat.replace(/-/g, '') === catSlug.replace(/-/g, '') // hyphen-normalized match
      );
    })
    .sort((a, b) => {
      const aFeatured = featuredIds.includes(a.id);
      const bFeatured = featuredIds.includes(b.id);
      if (aFeatured && !bFeatured) return -1;
      if (!aFeatured && bFeatured) return 1;
      return (a.displayOrder || 0) - (b.displayOrder || 0);
    });

  const categoryBrands = brands.filter((b) => b.categoryId === category?.id && b.isActive);

  if (!category) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">Category not found</h2>
          <Link href="/delivery/shop">
            <Button variant="outline">Back to Shop</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DeliveryHeader
        cartItemCount={cartItemCount}
        onSearch={() => {}}
        searchQuery=""
        showSearch={false}
        products={products}
        onProductSelect={setQuickViewProduct}
      />
      <DeliveryCategoryNav />

      <main className="container mx-auto px-4 py-8">
        <motion.div 
          className="flex items-center gap-2 text-sm text-muted-foreground mb-6"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Link href="/delivery/shop" className="hover:text-foreground transition-colors">
            Shop
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">{category.name}</span>
        </motion.div>

        <motion.div 
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ x: -4 }}
              transition={{ duration: 0.2 }}
            >
              <Link href="/delivery/shop">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
            >
              <h1 className="text-3xl font-bold">{category.name}</h1>
              <p className="text-muted-foreground">
                {categoryProducts.length} products
              </p>
            </motion.div>
          </div>

          <motion.div 
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className="transition-transform hover:scale-105"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
              className="transition-transform hover:scale-105"
            >
              <List className="w-4 h-4" />
            </Button>
          </motion.div>
        </motion.div>

        {categoryBrands.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Browse by Brand</h3>
            <div className="flex flex-wrap gap-2">
              {categoryBrands.map((brand) => (
                <Link key={brand.id} href={`/delivery/brand/${brand.slug}`}>
                  <Button variant="outline" size="sm">
                    {brand.name}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        )}

        {viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {categoryProducts.map((product, index) => {
              const isFeatured = featuredIds.includes(product.id);
              const stock = product.stockQuantity ? parseInt(product.stockQuantity) : 0;
              const isOutOfStock = stock === 0;
              const isLowStock = stock > 0 && stock <= 2;
              const isInStock = stock >= 3;
              
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-primary/50">
                    <div className="relative aspect-square bg-muted/50">
                      <img
                        src={product.image || "/placeholder-product.png"}
                        alt={product.name}
                        className={`w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300 ${isOutOfStock ? 'opacity-50' : ''}`}
                      />
                      {isFeatured && (
                        <Badge className="absolute top-2 left-2 bg-primary/90">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center backdrop-blur-sm">
                          <Badge variant="destructive" className="text-sm">Out of Stock</Badge>
                        </div>
                      )}
                      {isLowStock && !isOutOfStock && (
                        <Badge className="absolute top-2 right-2 bg-amber-500 text-white text-xs">
                          Low Stock
                        </Badge>
                      )}
                      {isInStock && !isFeatured && (
                        <Badge className="absolute top-2 right-2 bg-green-500 text-white text-xs">
                          In Stock
                        </Badge>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem]">
                        {product.name}
                      </h3>
                      <div className="flex items-center justify-between mt-2">
                        {product.salePrice ? (
                          <div className="flex items-baseline gap-1">
                            <p className="text-lg font-bold text-primary">${product.salePrice}</p>
                            <p className="text-xs text-muted-foreground line-through">${product.price}</p>
                          </div>
                        ) : (
                          <p className="text-lg font-bold text-primary">${product.price}</p>
                        )}
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => setQuickViewProduct(product)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => addToCartMutation.mutate({ productId: product.id, quantity: 1 })}
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
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {categoryProducts.map((product, index) => {
              const isFeatured = featuredIds.includes(product.id);
              const stock = product.stockQuantity ? parseInt(product.stockQuantity) : 0;
              const isOutOfStock = stock === 0;
              const isLowStock = stock > 0 && stock <= 2;
              const isInStock = stock >= 3;
              
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card className={`flex items-center gap-4 p-4 hover:shadow-lg transition-all duration-300 hover:border-primary/50 ${isOutOfStock ? 'opacity-60' : ''}`}>
                    <div className="relative w-20 h-20 bg-muted/50 rounded-lg flex-shrink-0">
                      <img
                        src={product.image || "/placeholder-product.png"}
                        alt={product.name}
                        className="w-full h-full object-contain p-1"
                      />
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                          <Badge variant="destructive" className="text-xs">Out</Badge>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium truncate">{product.name}</h3>
                        {isFeatured && (
                          <Badge className="bg-primary/90 flex-shrink-0">
                            <Star className="w-3 h-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                        {isOutOfStock && (
                          <Badge variant="destructive" className="flex-shrink-0">Out of Stock</Badge>
                        )}
                        {isLowStock && !isOutOfStock && (
                          <Badge className="bg-amber-500 text-white flex-shrink-0">Low Stock</Badge>
                        )}
                        {isInStock && !isFeatured && (
                          <Badge className="bg-green-500 text-white flex-shrink-0">In Stock</Badge>
                        )}
                      </div>
                      {product.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                          {product.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {product.salePrice ? (
                        <div className="text-right">
                          <p className="text-xl font-bold text-primary">${product.salePrice}</p>
                          <p className="text-xs text-muted-foreground line-through">${product.price}</p>
                        </div>
                      ) : (
                        <p className="text-xl font-bold text-primary">${product.price}</p>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setQuickViewProduct(product)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => addToCartMutation.mutate({ productId: product.id, quantity: 1 })}
                        disabled={addToCartMutation.isPending || isOutOfStock}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {categoryProducts.length === 0 && (
          <div className="text-center py-20">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-bold mb-2">No products in this category</h3>
            <Link href="/delivery/shop">
              <Button variant="outline">Back to Shop</Button>
            </Link>
          </div>
        )}
      </main>

      <DeliveryFooter />
      
      <FloatingCartButton 
        cartItems={cartItems} 
        products={products.map(p => ({ id: p.id, price: p.price, name: p.name }))} 
      />

      <ProductQuickView
        product={quickViewProduct}
        open={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={async (productId, quantity) => {
          await addToCartMutation.mutateAsync({ productId, quantity });
        }}
      />
    </div>
  );
}
