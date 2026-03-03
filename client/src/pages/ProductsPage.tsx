import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "wouter";
import MainLayout from "@/layouts/MainLayout";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Package, ShoppingBag, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { DeliveryCategoryNav } from "@/components/DeliveryCategoryNav";
import { Button } from "@/components/ui/button";
import type { DeliveryProduct, DeliveryBrand, DeliveryCategory } from "@shared/schema";

const badgeColors: Record<string, string> = {
  popular: "bg-orange-500 text-white",
  new: "bg-green-500 text-white",
  sale: "bg-red-500 text-white",
};

function ProductCard({ product, brandName }: { product: DeliveryProduct; brandName?: string }) {
  const badge = product.badge;
  const imageUrl = product.image || (product.images && product.images.length > 0 ? product.images[0] : null);
  const [imgError, setImgError] = useState(false);

  return (
    <div className="bg-card border border-border/50 rounded-xl overflow-hidden flex flex-col hover:border-primary/50 hover:shadow-[0_0_20px_rgba(255,113,0,0.15)] transition-all duration-300 flex-shrink-0 w-[160px] sm:w-[190px] md:w-[210px]">
      <div className="relative aspect-square bg-muted/30 overflow-hidden">
        {badge && badgeColors[badge] && (
          <span className={`absolute top-2 left-2 z-10 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${badgeColors[badge]}`}>
            {badge}
          </span>
        )}
        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-contain p-3"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-10 h-10 text-muted-foreground/30" />
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col flex-1">
        {brandName && (
          <p className="text-[10px] font-medium text-primary/80 uppercase tracking-wide mb-0.5 truncate">{brandName}</p>
        )}
        <h3 className="font-semibold text-xs sm:text-sm text-foreground leading-tight mb-1 line-clamp-2">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2 flex-1">{product.description}</p>
        )}
        <div className="mt-auto pt-1">
          <Link href="/delivery/register">
            <span className="block w-full text-center bg-primary hover:bg-primary/90 text-black text-[11px] sm:text-xs font-semibold py-1.5 px-2 rounded-lg transition-colors cursor-pointer">
              Sign In to Order
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function ProductGridCard({ product, brandName }: { product: DeliveryProduct; brandName?: string }) {
  const badge = product.badge;
  const imageUrl = product.image || (product.images && product.images.length > 0 ? product.images[0] : null);
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-card border border-border/50 rounded-xl overflow-hidden flex flex-col hover:border-primary/50 hover:shadow-[0_0_20px_rgba(255,113,0,0.15)] transition-all duration-300"
    >
      <div className="relative aspect-square bg-muted/30 overflow-hidden">
        {badge && badgeColors[badge] && (
          <span className={`absolute top-2 left-2 z-10 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${badgeColors[badge]}`}>
            {badge}
          </span>
        )}
        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-contain p-3"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-muted-foreground/30" />
          </div>
        )}
      </div>
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        {brandName && (
          <p className="text-[10px] sm:text-xs font-medium text-primary/80 uppercase tracking-wide mb-0.5">{brandName}</p>
        )}
        <h3 className="font-semibold text-sm sm:text-base text-foreground leading-tight mb-1 line-clamp-2">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1">{product.description}</p>
        )}
        <div className="mt-auto pt-2">
          <Link href="/delivery/register">
            <span className="block w-full text-center bg-primary hover:bg-primary/90 text-black text-xs sm:text-sm font-semibold py-2 px-3 rounded-lg transition-colors cursor-pointer">
              Sign In to Order
            </span>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function ProductCarousel({
  title,
  products,
  brandMap,
}: {
  title: string;
  products: DeliveryProduct[];
  brandMap: Record<number, DeliveryBrand>;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isTouching, setIsTouching] = useState(false);
  const isPausedRef = useRef(false);
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      isPausedRef.current = true;
      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = setTimeout(() => { isPausedRef.current = false; }, 5000);
      const scrollAmount = Math.max(scrollRef.current.clientWidth * 0.75, 300);
      scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
      setTimeout(checkScroll, 350);
    }
  };

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', checkScroll);
      return () => ref.removeEventListener('scroll', checkScroll);
    }
  }, [products]);

  useEffect(() => {
    if (isHovered || isTouching || products.length === 0) return;
    let animationFrameId: number;
    let lastTime = 0;
    const scrollSpeed = 0.6;

    const smoothScroll = (currentTime: number) => {
      if (!scrollRef.current) { animationFrameId = requestAnimationFrame(smoothScroll); return; }
      if (isPausedRef.current) { lastTime = 0; animationFrameId = requestAnimationFrame(smoothScroll); return; }
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      if (scrollWidth <= clientWidth + 10) { animationFrameId = requestAnimationFrame(smoothScroll); return; }
      if (lastTime === 0) lastTime = currentTime;
      const delta = currentTime - lastTime;
      lastTime = currentTime;
      if (scrollLeft >= scrollWidth - clientWidth - 5) {
        scrollRef.current.scrollLeft = 0;
      } else {
        scrollRef.current.scrollLeft += scrollSpeed * (delta / 16);
      }
      animationFrameId = requestAnimationFrame(smoothScroll);
    };
    animationFrameId = requestAnimationFrame(smoothScroll);
    return () => cancelAnimationFrame(animationFrameId);
  }, [products.length, isHovered, isTouching]);

  if (products.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className="py-3"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-foreground">{title}</h2>
        <div className="hidden md:flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="h-9 w-9 rounded-full border-border/50 bg-card/80 backdrop-blur-sm hover:bg-card disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="h-9 w-9 rounded-full border-border/50 bg-card/80 backdrop-blur-sm hover:bg-card disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-3 -mx-2 px-2 sm:-mx-4 sm:px-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={() => setIsTouching(true)}
        onTouchEnd={() => setIsTouching(false)}
      >
        {products.map((product) => {
          const brandName = product.brandId ? brandMap[product.brandId]?.name : (product.brand || undefined);
          return <ProductCard key={product.id} product={product} brandName={brandName} />;
        })}
      </div>
    </motion.section>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="bg-card border border-border/50 rounded-xl overflow-hidden">
          <Skeleton className="aspect-square w-full bg-muted" />
          <div className="p-3 sm:p-4 space-y-2">
            <Skeleton className="h-3 w-16 bg-muted" />
            <Skeleton className="h-4 w-full bg-muted" />
            <Skeleton className="h-4 w-3/4 bg-muted" />
            <Skeleton className="h-8 w-full bg-muted rounded-lg mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CarouselSkeleton() {
  return (
    <div className="py-3 space-y-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i}>
          <Skeleton className="h-7 w-48 bg-muted mb-4" />
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="flex-shrink-0 w-[160px] sm:w-[190px] bg-card border border-border/50 rounded-xl overflow-hidden">
                <Skeleton className="aspect-square w-full bg-muted" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-3 w-12 bg-muted" />
                  <Skeleton className="h-4 w-full bg-muted" />
                  <Skeleton className="h-6 w-full bg-muted rounded-lg mt-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const ProductsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'featured' | 'category'>('featured');

  const { data: products = [], isLoading, error } = useQuery<DeliveryProduct[]>({
    queryKey: ["/api/delivery/products"],
    staleTime: 5 * 60 * 1000,
  });

  const { data: deliveryBrands = [] } = useQuery<DeliveryBrand[]>({
    queryKey: ["/api/delivery/brands"],
    staleTime: 5 * 60 * 1000,
  });

  const { data: deliveryCategories = [] } = useQuery<DeliveryCategory[]>({
    queryKey: ["/api/delivery/categories"],
    staleTime: 5 * 60 * 1000,
  });

  const brandMap = useMemo(() => {
    const map: Record<number, DeliveryBrand> = {};
    deliveryBrands.forEach(b => { map[b.id] = b; });
    return map;
  }, [deliveryBrands]);

  const activeCategories = useMemo(() =>
    deliveryCategories
      .filter(c => c.isActive)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)),
    [deliveryCategories]
  );

  const enabledProducts = useMemo(() =>
    products.filter(p => p.enabled !== false),
    [products]
  );

  const getProductsByCategory = useMemo(() => (category: DeliveryCategory) => {
    const featuredIds = (category.featuredProductIds as number[]) || [];

    const categoryProducts = enabledProducts.filter(p => {
      if (!p.category) return false;
      const productCat = p.category.toLowerCase().trim();
      const matchNames = new Set<string>();
      const mapped = category.mappedCategories as string[] | undefined;
      if (mapped && mapped.length > 0) mapped.forEach(m => matchNames.add(m.toLowerCase().trim()));
      matchNames.add(category.name.toLowerCase().trim());
      matchNames.add(category.slug.toLowerCase().trim());
      if (matchNames.has(productCat)) return true;
      const productCatNorm = productCat.replace(/s$/, '');
      for (const name of matchNames) {
        if (productCatNorm === name.replace(/s$/, '')) return true;
        if (productCat.replace(/-/g, '') === name.replace(/-/g, '')) return true;
      }
      return false;
    });

    if (featuredIds.length > 0) {
      return categoryProducts
        .filter(p => featuredIds.includes(p.id))
        .sort((a, b) => featuredIds.indexOf(a.id) - featuredIds.indexOf(b.id))
        .slice(0, 12);
    }

    return categoryProducts.slice(0, 12);
  }, [enabledProducts]);

  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return enabledProducts;
    return enabledProducts.filter(p => {
      if (!p.category) return false;
      const cat = activeCategories.find(c => c.name === selectedCategory);
      if (!cat) return p.category.toLowerCase() === selectedCategory.toLowerCase();
      const productCat = p.category.toLowerCase().trim();
      const matchNames = new Set<string>();
      const mapped = cat.mappedCategories as string[] | undefined;
      if (mapped && mapped.length > 0) mapped.forEach(m => matchNames.add(m.toLowerCase().trim()));
      matchNames.add(cat.name.toLowerCase().trim());
      matchNames.add(cat.slug.toLowerCase().trim());
      if (matchNames.has(productCat)) return true;
      const productCatNorm = productCat.replace(/s$/, '');
      for (const name of matchNames) {
        if (productCatNorm === name.replace(/s$/, '')) return true;
        if (productCat.replace(/-/g, '') === name.replace(/-/g, '')) return true;
      }
      return false;
    });
  }, [enabledProducts, selectedCategory, activeCategories]);

  useEffect(() => {
    if (products.length === 0) return;
    const existingScript = document.getElementById("products-jsonld");
    if (existingScript) existingScript.remove();
    const script = document.createElement("script");
    script.id = "products-jsonld";
    script.type = "application/ld+json";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Vape Cave Smoke & Stuff - Product Catalog",
      "description": `Browse ${products.length} premium vape and smoke shop products at Vape Cave in Frisco, TX`,
      "numberOfItems": products.length,
      "itemListElement": products.slice(0, 50).map((p, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "item": {
          "@type": "Product",
          "name": p.name,
          "description": p.description || undefined,
          "image": p.image || undefined,
        }
      }))
    });
    document.head.appendChild(script);
    return () => { document.getElementById("products-jsonld")?.remove(); };
  }, [products]);

  const handleCategorySelect = (cat: string | null) => {
    setSelectedCategory(cat);
    if (cat) setViewMode('category');
  };

  const handleViewModeChange = (mode: 'featured' | 'category') => {
    setViewMode(mode);
    if (mode === 'featured') setSelectedCategory(null);
  };

  const productCount = filteredProducts.length;

  return (
    <MainLayout
      title="Products - Vape Cave Smoke & Stuff"
      description={`Browse our live inventory of ${products.length}+ premium vaping devices, e-liquids, disposables, THC-A, hookah, and accessories at Vape Cave Smoke & Stuff in Frisco, TX.`}
    >
      <section className="bg-background py-10 text-foreground border-b border-border/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
          >
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Our Products</h1>
              <p className="text-muted-foreground max-w-xl">
                Browse our full inventory. Sign in to the delivery portal to see pricing and place an order.
              </p>
            </div>
            <Link href="/delivery/register">
              <span className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-black font-semibold px-5 py-2.5 rounded-lg transition-colors cursor-pointer text-sm whitespace-nowrap">
                <ShoppingBag className="w-4 h-4" />
                Sign In / Register
              </span>
            </Link>
          </motion.div>
        </div>
      </section>

      <div className="sticky top-0 z-40">
        <DeliveryCategoryNav
          standalone={true}
          hideSpecialTabs={false}
          hideBrandsAndSale={true}
          selectedCategory={selectedCategory}
          viewMode={viewMode}
          onCategorySelect={handleCategorySelect}
          onViewModeChange={handleViewModeChange}
        />
      </div>

      <section className="py-8 bg-background min-h-[60vh]">
        <div className="container mx-auto px-4">
          {isLoading ? (
            viewMode === 'featured' ? <CarouselSkeleton /> : <GridSkeleton />
          ) : error ? (
            <div className="text-center py-20">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <p className="text-xl font-medium text-red-500">Error loading products. Please try again later.</p>
            </div>
          ) : viewMode === 'featured' ? (
            (() => {
              const categoryCarousels = activeCategories
                .map(cat => ({ cat, products: getProductsByCategory(cat) }))
                .filter(({ products }) => products.length > 0);

              if (categoryCarousels.length === 0) {
                return (
                  <div className="text-center py-20">
                    <Sparkles className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">No featured products yet</h3>
                    <p className="text-muted-foreground">Check back soon for our featured selections.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-8">
                  {categoryCarousels.map(({ cat, products: catProducts }) => (
                    <ProductCarousel
                      key={cat.id}
                      title={cat.name}
                      products={catProducts}
                      brandMap={brandMap}
                    />
                  ))}
                </div>
              );
            })()
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">{selectedCategory}</h2>
                <button
                  onClick={() => { setViewMode('featured'); setSelectedCategory(null); }}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back to Featured
                </button>
              </div>

              {filteredProducts.length > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground mb-5">{productCount} product{productCount !== 1 ? "s" : ""}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                    {filteredProducts.map((product) => {
                      const brandName = product.brandId ? brandMap[product.brandId]?.name : (product.brand || undefined);
                      return <ProductGridCard key={product.id} product={product} brandName={brandName} />;
                    })}
                  </div>
                </>
              ) : (
                <div className="text-center py-20">
                  <Package className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No products found</h3>
                  <p className="text-muted-foreground mb-6">Try selecting a different category.</p>
                  <button
                    onClick={() => { setViewMode('featured'); setSelectedCategory(null); }}
                    className="text-primary hover:underline text-sm font-medium"
                  >
                    Back to Featured
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <section className="py-14 bg-background text-foreground border-t border-border/30">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            className="max-w-2xl mx-auto p-8 rounded-xl bg-card border border-primary/30 shadow-[0_0_30px_rgba(255,113,0,0.12)]"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <AlertCircle className="mx-auto h-9 w-9 text-primary mb-3" />
            <h2 className="text-xl font-bold mb-2">Age Verification Required</h2>
            <p className="text-muted-foreground text-sm">
              Our products are intended for adult smokers aged 21 and over. Proof of age is required upon purchase.
              Sign up to the delivery portal to browse pricing and place an order.
            </p>
            <Link href="/delivery/register">
              <span className="inline-block mt-5 bg-primary hover:bg-primary/90 text-black font-semibold px-6 py-2.5 rounded-lg transition-colors cursor-pointer text-sm">
                Create an Account
              </span>
            </Link>
          </motion.div>
        </div>
      </section>
    </MainLayout>
  );
};

export default ProductsPage;
