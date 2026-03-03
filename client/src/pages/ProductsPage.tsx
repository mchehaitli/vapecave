import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import MainLayout from "@/layouts/MainLayout";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Package, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { DeliveryCategoryNav } from "@/components/DeliveryCategoryNav";
import type { DeliveryProduct, DeliveryBrand, DeliveryCategory } from "@shared/schema";

const badgeColors: Record<string, string> = {
  popular: "bg-orange-500 text-white",
  new: "bg-green-500 text-white",
  sale: "bg-red-500 text-white",
};

function ProductCard({ product, brandName }: { product: DeliveryProduct; brandName?: string }) {
  const badge = product.badge;
  const imageUrl = product.image || (product.images && product.images.length > 0 ? product.images[0] : null);

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
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-contain p-3"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
              const parent = (e.target as HTMLImageElement).parentElement;
              if (parent) {
                const icon = parent.querySelector(".fallback-icon") as HTMLElement;
                if (icon) icon.style.display = "flex";
              }
            }}
          />
        ) : null}
        <div
          className={`fallback-icon w-full h-full items-center justify-center ${imageUrl ? "hidden" : "flex"}`}
        >
          <Package className="w-12 h-12 text-muted-foreground/30" />
        </div>
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

function ProductGridSkeleton() {
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

const ProductsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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

  const categoryMap = useMemo(() => {
    const map: Record<string, DeliveryCategory> = {};
    deliveryCategories.forEach(c => {
      map[c.name] = c;
      if (c.slug) map[c.slug] = c;
    });
    return map;
  }, [deliveryCategories]);

  const filteredProducts = useMemo(() => {
    const enabled = products.filter(p => p.enabled !== false);
    if (!selectedCategory) return enabled;
    return enabled.filter(p => {
      if (!p.category) return false;
      const cat = categoryMap[selectedCategory];
      if (!cat) return p.category.toLowerCase() === selectedCategory.toLowerCase();
      return p.category === cat.name || p.category === cat.slug || p.category.toLowerCase() === selectedCategory.toLowerCase();
    });
  }, [products, selectedCategory, categoryMap]);

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

    return () => {
      const s = document.getElementById("products-jsonld");
      if (s) s.remove();
    };
  }, [products]);

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
          hideSpecialTabs={true}
          selectedCategory={selectedCategory}
          onCategorySelect={(cat) => setSelectedCategory(cat)}
        />
      </div>

      <section className="py-8 bg-background min-h-[60vh]">
        <div className="container mx-auto px-4">
          {selectedCategory && (
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground capitalize">{selectedCategory}</h2>
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                View all
              </button>
            </div>
          )}

          {isLoading ? (
            <ProductGridSkeleton />
          ) : error ? (
            <div className="text-center py-20">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <p className="text-xl font-medium text-red-500">Error loading products. Please try again later.</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground mb-5">{productCount} product{productCount !== 1 ? "s" : ""}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                {filteredProducts.map((product) => {
                  const brandName = product.brandId ? brandMap[product.brandId]?.name : (product.brand || undefined);
                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      brandName={brandName}
                    />
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <Package className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No products found</h3>
              <p className="text-muted-foreground mb-6">Try selecting a different category.</p>
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-primary hover:underline text-sm font-medium"
              >
                View all products
              </button>
            </div>
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
