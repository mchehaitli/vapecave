import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useRoute, Link, useSearch } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Grid3X3, List, Star, Package, Plus, Eye, Sparkles, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeliveryHeader } from "@/components/DeliveryHeader";
import { DeliveryFooter } from "@/components/DeliveryFooter";
import { DeliveryCategoryNav } from "@/components/DeliveryCategoryNav";
import { FloatingCartButton } from "@/components/FloatingCartButton";
import { ProductQuickView } from "@/components/ProductQuickView";
import { useToast } from "@/hooks/use-toast";
import {
  groupProductsIntoVariants,
  isVariantGroup,
  getDefaultVariant,
  getVariantByNicLevel,
  sortNicLevels,
  type VariantGroup,
} from "@/lib/productVariants";
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
  const searchString = useSearch();
  const urlViewParam = new URLSearchParams(searchString).get("view");
  const [activeTab, setActiveTab] = useState<"featured" | "all">(urlViewParam === "featured" ? "featured" : "all");
  const [viewMode, setViewMode] = useState<"grid" | "list">(window.innerWidth < 640 ? "list" : "grid");
  const [quickViewProduct, setQuickViewProduct] = useState<DeliveryProduct | null>(null);
  const [quickViewVariantGroup, setQuickViewVariantGroup] = useState<VariantGroup | null>(null);
  const [quickViewVariantNic, setQuickViewVariantNic] = useState<string>("");
  const [selectedNicLevels, setSelectedNicLevels] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    setActiveTab(urlViewParam === "featured" ? "featured" : "all");
  }, [urlViewParam]);

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<DeliveryCategory[]>({
    queryKey: ["/api/delivery/categories"],
  });

  const { data: brands = [] } = useQuery<DeliveryBrand[]>({
    queryKey: ["/api/delivery/brands"],
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<DeliveryProduct[]>({
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

  const brandMap = useMemo(() => {
    const map: Record<number, DeliveryBrand> = {};
    brands.forEach(b => { map[b.id] = b; });
    return map;
  }, [brands]);

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

  const mappedCategoryNames = useMemo(() => {
    if (!category) return new Set<string>();
    const mapped = category.mappedCategories as string[] | undefined;
    const names = new Set<string>();
    if (mapped && mapped.length > 0) {
      mapped.forEach(m => names.add(m.toLowerCase().trim()));
    }
    names.add(category.name.toLowerCase().trim());
    names.add(category.slug.toLowerCase().trim());
    return names;
  }, [category]);

  const categoryProducts = products
    .filter((p) => {
      if (!p.enabled || !p.category || !category) return false;
      const productCat = p.category.toLowerCase().trim();
      if (mappedCategoryNames.has(productCat)) return true;
      const productCatNormalized = productCat.replace(/s$/, '');
      for (const name of Array.from(mappedCategoryNames)) {
        const nameNormalized = name.replace(/s$/, '');
        if (productCatNormalized === nameNormalized) return true;
        if (productCat.replace(/-/g, '') === name.replace(/-/g, '')) return true;
      }
      return false;
    })
    .sort((a, b) => {
      const aFeatured = featuredIds.includes(a.id);
      const bFeatured = featuredIds.includes(b.id);
      if (aFeatured && !bFeatured) return -1;
      if (!aFeatured && bFeatured) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });

  const featuredProducts = categoryProducts.filter(p => featuredIds.includes(p.id));
  const displayProducts = activeTab === "featured" ? featuredProducts : categoryProducts;

  const { groups: variantGroups, singles: singleProducts } = useMemo(
    () => groupProductsIntoVariants(displayProducts),
    [displayProducts]
  );

  const displayItems = useMemo(() => {
    const items: Array<VariantGroup | DeliveryProduct> = [];
    const usedProductIds = new Set<number>();

    for (const group of variantGroups) {
      items.push(group);
      for (const v of group.variants) usedProductIds.add(v.productId);
    }
    for (const p of singleProducts) {
      if (!usedProductIds.has(p.id)) items.push(p);
    }

    return items.sort((a, b) => {
      const aName = isVariantGroup(a) ? a.displayName : a.name;
      const bName = isVariantGroup(b) ? b.displayName : b.name;
      const aFeatured = isVariantGroup(a)
        ? a.variants.some(v => featuredIds.includes(v.productId))
        : featuredIds.includes(a.id);
      const bFeatured = isVariantGroup(b)
        ? b.variants.some(v => featuredIds.includes(v.productId))
        : featuredIds.includes(b.id);
      if (aFeatured && !bFeatured) return -1;
      if (!aFeatured && bFeatured) return 1;
      return aName.localeCompare(bName);
    });
  }, [variantGroups, singleProducts, featuredIds]);

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

  const categoryBrands = brands.filter((b) => b.categoryId === category?.id && b.isActive);

  const openVariantQuickView = (group: VariantGroup) => {
    setQuickViewVariantGroup(group);
    setQuickViewVariantNic(getSelectedNic(group));
    setQuickViewProduct(null);
  };

  const closeQuickView = () => {
    setQuickViewProduct(null);
    setQuickViewVariantGroup(null);
    setQuickViewVariantNic("");
  };

  const renderStockBadge = (stockQuantity: string | null, position: "grid" | "list" = "grid") => {
    const stock = stockQuantity ? parseInt(stockQuantity) : 0;
    const isOutOfStock = stock <= 0;
    const isLowStock = stock > 0 && stock <= 2;
    const isInStock = stock >= 3;

    if (position === "grid") {
      if (isLowStock) return (
        <Badge className="absolute top-2 right-2 bg-amber-500 text-white text-xs">Low Stock</Badge>
      );
      if (isInStock) return (
        <Badge className="absolute top-2 right-2 bg-green-500 text-white text-xs">In Stock</Badge>
      );
    } else {
      if (isOutOfStock) return (
        <Badge variant="destructive" className="flex-shrink-0 text-[10px] sm:text-xs px-1.5 py-0">Out of Stock</Badge>
      );
      if (isLowStock) return (
        <Badge className="bg-amber-500 text-white flex-shrink-0 text-[10px] sm:text-xs px-1.5 py-0">Low Stock</Badge>
      );
      if (isInStock) return (
        <Badge className="bg-green-500 text-white flex-shrink-0 text-[10px] sm:text-xs px-1.5 py-0">In Stock</Badge>
      );
    }
    return null;
  };

  if (categoriesLoading || productsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

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

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
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
          className="flex items-center justify-between mb-4 sm:mb-8"
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="flex items-center gap-4">
            <motion.div whileHover={{ x: -4 }} transition={{ duration: 0.2 }}>
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
              <h1 className="text-xl sm:text-3xl font-bold">{category.name}</h1>
              <p className="text-muted-foreground">
                {displayItems.length} {displayItems.length !== 1 ? 'items' : 'item'}
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

        {(featuredProducts.length > 0 || activeTab === "featured") && (
          <motion.div
            className="flex items-center gap-2 mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
          >
            <Button
              variant={activeTab === "featured" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("featured")}
              className="gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Featured ({featuredProducts.length})
            </Button>
            <Button
              variant={activeTab === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("all")}
              className="gap-1.5"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              All Products ({categoryProducts.length})
            </Button>
          </motion.div>
        )}

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
            {displayItems.map((item, index) => {
              if (isVariantGroup(item)) {
                const group = item;
                const selectedNic = getSelectedNic(group);
                const variant = getVariantData(group);
                const stock = variant.stockQuantity ? parseInt(variant.stockQuantity) : 0;
                const isOutOfStock = stock <= 0;
                const isFeatured = group.variants.some(v => featuredIds.includes(v.productId));

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
                          alt={`${group.displayName} - Vape Cave Frisco`}
                          loading="lazy"
                          className={`w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300 ${isOutOfStock ? 'opacity-50' : ''}`}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.dataset.fallbackAttempted) {
                              target.src = '/placeholder-product.svg';
                              return;
                            }
                            target.dataset.fallbackAttempted = '1';
                            const brandLogo = group.brandId ? brandMap[group.brandId]?.logo : null;
                            target.src = brandLogo || '/placeholder-product.svg';
                          }}
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
                        {!isOutOfStock && renderStockBadge(variant.stockQuantity, "grid")}
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-sm line-clamp-1 min-h-[1.25rem]">
                          {group.displayName}
                        </h3>
                        {group.brand && (
                          <p className="text-[10px] text-muted-foreground line-clamp-1 mb-1">{group.brand}</p>
                        )}
                        <div className="flex flex-wrap gap-1 my-1.5">
                          {sortNicLevels(group.variants.map(v => v.nicLevel)).map(level => {
                            const v = getVariantByNicLevel(group, level);
                            const vStock = v?.stockQuantity ? parseInt(v.stockQuantity) : 0;
                            return (
                              <button
                                key={level}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedNic(group.key, level);
                                }}
                                className={`text-[10px] px-1.5 py-0.5 rounded border transition-all ${
                                  selectedNic === level
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : vStock <= 0
                                    ? 'border-muted-foreground/20 text-muted-foreground/40 line-through'
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
                              className="h-8 w-8 p-0"
                              onClick={() => addToCartMutation.mutate({ productId: variant.productId, quantity: 1 })}
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
              const isFeatured = featuredIds.includes(product.id);
              const stock = product.stockQuantity ? parseInt(product.stockQuantity) : 0;
              const isOutOfStock = stock <= 0;
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
                        src={product.image || (product.brandId ? brandMap[product.brandId]?.logo : null) || "/placeholder-product.svg"}
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
            {displayItems.map((item, index) => {
              if (isVariantGroup(item)) {
                const group = item;
                const selectedNic = getSelectedNic(group);
                const variant = getVariantData(group);
                const stock = variant.stockQuantity ? parseInt(variant.stockQuantity) : 0;
                const isOutOfStock = stock <= 0;
                const isFeatured = group.variants.some(v => featuredIds.includes(v.productId));

                return (
                  <motion.div
                    key={group.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:shadow-lg transition-all duration-300 hover:border-primary/50 ${isOutOfStock ? 'opacity-60' : ''}`}>
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-muted/50 rounded-lg flex-shrink-0">
                        <img
                          src={group.image || (group.brandId ? brandMap[group.brandId]?.logo : null) || "/placeholder-product.svg"}
                          alt={`${group.displayName} - Vape Cave Frisco`}
                          loading="lazy"
                          className="w-full h-full object-contain p-1"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.dataset.fallbackAttempted) {
                              target.src = '/placeholder-product.svg';
                              return;
                            }
                            target.dataset.fallbackAttempted = '1';
                            const brandLogo = group.brandId ? brandMap[group.brandId]?.logo : null;
                            target.src = brandLogo || '/placeholder-product.svg';
                          }}
                        />
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                            <Badge variant="destructive" className="text-xs">Out</Badge>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm sm:text-base line-clamp-1">
                          {group.displayName}
                          {group.brand && <span className="text-muted-foreground font-normal"> · {group.brand}</span>}
                        </h3>
                        <div className="flex flex-wrap gap-1 mt-1 mb-1">
                          {isFeatured && (
                            <Badge className="bg-primary/90 flex-shrink-0 text-[10px] sm:text-xs px-1.5 py-0">
                              <Star className="w-2.5 h-2.5 mr-0.5" />
                              Featured
                            </Badge>
                          )}
                          {renderStockBadge(variant.stockQuantity, "list")}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {sortNicLevels(group.variants.map(v => v.nicLevel)).map(level => {
                            const v = getVariantByNicLevel(group, level);
                            const vStock = v?.stockQuantity ? parseInt(v.stockQuantity) : 0;
                            return (
                              <button
                                key={level}
                                onClick={() => setSelectedNic(group.key, level)}
                                className={`text-[10px] px-1.5 py-0.5 rounded border transition-all ${
                                  selectedNic === level
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : vStock <= 0
                                    ? 'border-muted-foreground/20 text-muted-foreground/40 line-through'
                                    : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                                }`}
                              >
                                {level}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        {variant.salePrice ? (
                          <div className="text-right">
                            <p className="text-base sm:text-xl font-bold text-primary">${variant.salePrice}</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground line-through">${variant.price}</p>
                          </div>
                        ) : (
                          <p className="text-base sm:text-xl font-bold text-primary">${variant.price}</p>
                        )}
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
                          className="h-8 px-2 sm:px-3"
                          onClick={() => addToCartMutation.mutate({ productId: variant.productId, quantity: 1 })}
                          disabled={addToCartMutation.isPending || isOutOfStock}
                        >
                          <Plus className="w-4 h-4 sm:mr-1" />
                          <span className="hidden sm:inline">Add</span>
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                );
              }

              const product = item as DeliveryProduct;
              const isFeatured = featuredIds.includes(product.id);
              const stock = product.stockQuantity ? parseInt(product.stockQuantity) : 0;
              const isOutOfStock = stock <= 0;
              const isLowStock = stock > 0 && stock <= 2;
              const isInStock = stock >= 3;

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:shadow-lg transition-all duration-300 hover:border-primary/50 ${isOutOfStock ? 'opacity-60' : ''}`}>
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-muted/50 rounded-lg flex-shrink-0">
                      <img
                        src={product.image || (product.brandId ? brandMap[product.brandId]?.logo : null) || "/placeholder-product.svg"}
                        alt={`${product.name} - Vape Cave Frisco`}
                        loading="lazy"
                        className="w-full h-full object-contain p-1"
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
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                          <Badge variant="destructive" className="text-xs">Out</Badge>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm sm:text-base line-clamp-2">{product.name}</h3>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {isFeatured && (
                          <Badge className="bg-primary/90 flex-shrink-0 text-[10px] sm:text-xs px-1.5 py-0">
                            <Star className="w-2.5 h-2.5 mr-0.5" />
                            Featured
                          </Badge>
                        )}
                        {isOutOfStock && (
                          <Badge variant="destructive" className="flex-shrink-0 text-[10px] sm:text-xs px-1.5 py-0">Out of Stock</Badge>
                        )}
                        {isLowStock && !isOutOfStock && (
                          <Badge className="bg-amber-500 text-white flex-shrink-0 text-[10px] sm:text-xs px-1.5 py-0">Low Stock</Badge>
                        )}
                        {isInStock && !isFeatured && (
                          <Badge className="bg-green-500 text-white flex-shrink-0 text-[10px] sm:text-xs px-1.5 py-0">In Stock</Badge>
                        )}
                      </div>
                      {product.description && (
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 mt-1 hidden sm:block">
                          {product.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      {product.salePrice ? (
                        <div className="text-right">
                          <p className="text-base sm:text-xl font-bold text-primary">${product.salePrice}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground line-through">${product.price}</p>
                        </div>
                      ) : (
                        <p className="text-base sm:text-xl font-bold text-primary">${product.price}</p>
                      )}
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
                        className="h-8 px-2 sm:px-3"
                        onClick={() => addToCartMutation.mutate({ productId: product.id, quantity: 1 })}
                        disabled={addToCartMutation.isPending || isOutOfStock}
                      >
                        <Plus className="w-4 h-4 sm:mr-1" />
                        <span className="hidden sm:inline">Add</span>
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {displayItems.length === 0 && (
          <div className="text-center py-20">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-bold mb-2">
              {activeTab === "featured" ? "No featured products yet" : "No products in this category"}
            </h3>
            {activeTab === "featured" ? (
              <Button variant="outline" onClick={() => setActiveTab("all")}>
                View All Products
              </Button>
            ) : (
              <Link href="/delivery/shop">
                <Button variant="outline">Back to Shop</Button>
              </Link>
            )}
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
        open={!!(quickViewProduct || quickViewVariantGroup)}
        onClose={closeQuickView}
        onAddToCart={async (productId, quantity) => {
          await addToCartMutation.mutateAsync({ productId, quantity });
        }}
        variantGroup={quickViewVariantGroup}
        selectedNicLevel={quickViewVariantNic}
        onNicLevelChange={setQuickViewVariantNic}
      />
    </div>
  );
}
