import { useState, useMemo, useEffect } from "react";
import { Link, useRoute, useLocation } from "wouter";
import MainLayout from "@/layouts/MainLayout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Package, ChevronLeft, Bell } from "lucide-react";
import { motion } from "framer-motion";
import { DeliveryCategoryNav } from "@/components/DeliveryCategoryNav";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const stockQty = product.stockQuantity ? parseFloat(product.stockQuantity as string) : 0;
  const isOutOfStock = stockQty <= 0;

  const notifyMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/restock-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
        credentials: 'include',
      });
      if (res.status === 401) throw Object.assign(new Error('Unauthorized'), { status: 401 });
      if (res.status === 409) throw Object.assign(new Error('Duplicate'), { status: 409 });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "You're on the list!", description: "We'll email you when it's back in stock." });
    },
    onError: (error: any) => {
      if (error.status === 401) {
        navigate('/register');
      } else if (error.status === 409) {
        toast({ title: "Already on the list!", description: "You'll be notified when this is back in stock." });
      } else {
        toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
      }
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-card border border-border/50 rounded-xl overflow-hidden flex flex-col hover:border-primary/50 hover:shadow-[0_0_20px_rgba(255,113,0,0.15)] transition-all duration-300"
    >
      <div className="relative aspect-square bg-muted/30 overflow-hidden">
        {badge && badgeColors[badge] && (
          <span className={`absolute top-2 left-2 z-10 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${badgeColors[badge]}`}>
            {badge}
          </span>
        )}
        {isOutOfStock && (
          <span className="absolute top-2 right-2 z-10 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
            Out of Stock
          </span>
        )}
        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt={product.name}
            className={`w-full h-full object-contain p-3 ${isOutOfStock ? 'opacity-60' : ''}`}
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
          {isOutOfStock ? (
            <button
              onClick={() => notifyMutation.mutate()}
              disabled={notifyMutation.isPending}
              className="flex items-center justify-center gap-1.5 w-full text-center bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-200 text-xs sm:text-sm font-semibold py-2 px-3 rounded-lg transition-colors cursor-pointer disabled:opacity-60"
            >
              <Bell className="w-3.5 h-3.5" />
              {notifyMutation.isPending ? 'Saving...' : 'Notify Me When Available'}
            </button>
          ) : (
            <Link href="/register">
              <span className="block w-full text-center bg-primary hover:bg-primary/90 text-black text-xs sm:text-sm font-semibold py-2 px-3 rounded-lg transition-colors cursor-pointer">
                Sign In to Order
              </span>
            </Link>
          )}
        </div>
      </div>
    </motion.div>
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

function matchesCategory(product: DeliveryProduct, category: DeliveryCategory): boolean {
  if (!product.category) return false;
  const productCat = product.category.toLowerCase().trim();
  const matchNames = new Set<string>();
  const mapped = category.mappedCategories as string[] | undefined;
  if (mapped && mapped.length > 0) mapped.forEach(m => matchNames.add(m.toLowerCase().trim()));
  matchNames.add(category.name.toLowerCase().trim());
  matchNames.add(category.slug.toLowerCase().trim());
  if (matchNames.has(productCat)) return true;
  const norm = productCat.replace(/s$/, '');
  for (const name of matchNames) {
    if (norm === name.replace(/s$/, '')) return true;
    if (productCat.replace(/-/g, '') === name.replace(/-/g, '')) return true;
  }
  return false;
}

export default function ProductsCategoryPage() {
  const [, params] = useRoute("/products/category/:slug");
  const slug = params?.slug;

  const { data: products = [], isLoading: productsLoading } = useQuery<DeliveryProduct[]>({
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

  const category = useMemo(
    () => deliveryCategories.find(c => c.slug === slug) || null,
    [deliveryCategories, slug]
  );

  const brandMap = useMemo(() => {
    const map: Record<number, DeliveryBrand> = {};
    deliveryBrands.forEach(b => { map[b.id] = b; });
    return map;
  }, [deliveryBrands]);

  const filteredProducts = useMemo(() => {
    if (!category) return [];
    return products.filter(p => p.enabled !== false && matchesCategory(p, category));
  }, [products, category]);

  useEffect(() => {
    if (!category || filteredProducts.length === 0) return;
    const existing = document.getElementById("category-jsonld");
    if (existing) existing.remove();
    const script = document.createElement("script");
    script.id = "category-jsonld";
    script.type = "application/ld+json";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": `${category.name} - Vape Cave Smoke & Stuff`,
      "description": `Browse ${filteredProducts.length} ${category.name} products at Vape Cave in Frisco, TX`,
      "numberOfItems": filteredProducts.length,
      "itemListElement": filteredProducts.slice(0, 50).map((p, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "item": { "@type": "Product", "name": p.name, "description": p.description || undefined, "image": p.image || undefined }
      }))
    });
    document.head.appendChild(script);
    return () => { document.getElementById("category-jsonld")?.remove(); };
  }, [category, filteredProducts]);

  const pageTitle = category ? `${category.name} - Vape Cave Smoke & Stuff` : "Products - Vape Cave Smoke & Stuff";
  const pageDesc = category
    ? `Shop ${filteredProducts.length} ${category.name} products at Vape Cave Smoke & Stuff in Frisco, TX. No prices shown — sign in to the delivery portal to order.`
    : "Browse products at Vape Cave Smoke & Stuff.";

  return (
    <MainLayout title={pageTitle} description={pageDesc}>
      <section className="bg-background py-10 text-foreground border-b border-border/30">
        <div className="container mx-auto px-4">
          <Link href="/products">
            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer mb-4">
              <ChevronLeft className="w-4 h-4" />
              All Products
            </span>
          </Link>
          <motion.h1
            className="text-3xl md:text-4xl font-bold mb-2"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {category ? category.name : "Category"}
          </motion.h1>
          <p className="text-muted-foreground">
            {productsLoading ? "Loading products…" : `${filteredProducts.length} product${filteredProducts.length !== 1 ? "s" : ""} available`}
          </p>
        </div>
      </section>

      <div className="sticky top-0 z-40">
        <DeliveryCategoryNav
          standalone={true}
          hideSpecialTabs={false}
          hideBrandsAndSale={true}
          selectedCategory={category?.name ?? null}
        />
      </div>

      <section className="py-8 bg-background min-h-[60vh]">
        <div className="container mx-auto px-4">
          {productsLoading ? (
            <GridSkeleton />
          ) : !category ? (
            <div className="text-center py-20">
              <Package className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Category not found</h2>
              <Link href="/products">
                <span className="text-primary hover:underline text-sm cursor-pointer">← Back to Products</span>
              </Link>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <h2 className="text-xl font-semibold mb-2">No products in this category yet</h2>
              <Link href="/products">
                <span className="text-primary hover:underline text-sm cursor-pointer">← Back to Products</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {filteredProducts.map(product => {
                const brandName = product.brandId ? brandMap[product.brandId]?.name : (product.brand || undefined);
                return <ProductCard key={product.id} product={product} brandName={brandName} />;
              })}
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
              Our products are intended for adult smokers aged 21 and over. Sign up to see pricing and place an order.
            </p>
            <Link href="/register">
              <span className="inline-block mt-5 bg-primary hover:bg-primary/90 text-black font-semibold px-6 py-2.5 rounded-lg transition-colors cursor-pointer text-sm">
                Create an Account
              </span>
            </Link>
          </motion.div>
        </div>
      </section>
    </MainLayout>
  );
}
