import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Star, Loader2, Search, ImagePlay } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { DeliveryCategory } from "@shared/schema";

interface SpotlightProduct {
  id: number;
  name: string;
  image: string | null;
  price: string | null;
  stockQuantity: string | null;
  enabled: boolean | null;
  category: string | null;
  isFeaturedSlideshow: boolean;
  isHeroSlideshow: boolean;
}

function matchesCategory(product: SpotlightProduct, category: DeliveryCategory): boolean {
  if (!product.category) return false;
  const productCat = product.category.toLowerCase().trim();
  const matchNames = new Set<string>();
  const mapped = category.mappedCategories as string[] | undefined;
  if (mapped && mapped.length > 0) {
    mapped.forEach(m => matchNames.add(m.toLowerCase().trim()));
  }
  matchNames.add(category.name.toLowerCase().trim());
  matchNames.add(category.slug.toLowerCase().trim());
  if (matchNames.has(productCat)) return true;
  const norm = productCat.replace(/s$/, "");
  for (const name of matchNames) {
    if (norm === name.replace(/s$/, "")) return true;
    if (productCat.replace(/-/g, "") === name.replace(/-/g, "")) return true;
  }
  return false;
}

function ProductList({
  products,
  flagKey,
  search,
  onToggle,
  pendingIds,
  activeColor,
  activeIcon,
}: {
  products: SpotlightProduct[];
  flagKey: "isFeaturedSlideshow" | "isHeroSlideshow";
  search: string;
  onToggle: (id: number, current: boolean) => void;
  pendingIds: Set<number>;
  activeColor: string;
  activeIcon: React.ReactNode;
}) {
  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const active = filtered.filter(p => p[flagKey]);
  const inactive = filtered.filter(p => !p[flagKey]);

  const renderRow = (product: SpotlightProduct) => {
    const isActive = product[flagKey];
    const stock = parseInt(product.stockQuantity || "0");
    const isOutOfStock = stock <= 0;
    const isLowStock = stock > 0 && stock <= 2;
    const isPending = pendingIds.has(product.id);

    return (
      <div
        key={product.id}
        className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
          isActive
            ? `${activeColor} border-opacity-50`
            : "bg-gray-900/50 border-gray-700"
        } ${!product.enabled ? "opacity-60" : ""}`}
      >
        <img
          src={product.image || "/placeholder-product.png"}
          alt={product.name}
          className="w-10 h-10 object-contain rounded flex-shrink-0"
        />

        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{product.name}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {product.price && (
              <span className="text-xs text-primary font-semibold">${product.price}</span>
            )}
            {product.category && (
              <span className="text-xs text-gray-500">{product.category}</span>
            )}
            {isOutOfStock && (
              <Badge variant="destructive" className="text-xs px-1 py-0">Out of Stock</Badge>
            )}
            {isLowStock && (
              <Badge className="bg-amber-500 text-white text-xs px-1 py-0">Low Stock</Badge>
            )}
            {!product.enabled && (
              <Badge variant="outline" className="text-xs px-1 py-0 text-gray-500">Disabled</Badge>
            )}
          </div>
        </div>

        <Button
          size="sm"
          variant={isActive ? "default" : "outline"}
          className={`flex-shrink-0 gap-1.5 text-xs ${
            isActive
              ? flagKey === "isFeaturedSlideshow"
                ? "bg-yellow-500 hover:bg-yellow-600 text-black border-yellow-500"
                : "bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
              : "border-gray-600 text-gray-400 hover:text-white"
          }`}
          onClick={() => onToggle(product.id, isActive)}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            activeIcon
          )}
          {isActive ? "Remove" : "Add"}
        </Button>
      </div>
    );
  };

  if (filtered.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No products match your search.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {active.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
            Currently Active ({active.length})
          </p>
          <div className="space-y-2">{active.map(renderRow)}</div>
        </div>
      )}
      {inactive.length > 0 && (
        <div className="space-y-2">
          {active.length > 0 && (
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 pt-2">
              All Other Products ({inactive.length})
            </p>
          )}
          <div className="space-y-2">{inactive.map(renderRow)}</div>
        </div>
      )}
    </div>
  );
}

function CategoryFilterBar({
  categories,
  products,
  flagKey,
  selectedCategoryId,
  onSelect,
}: {
  categories: DeliveryCategory[];
  products: SpotlightProduct[];
  flagKey: "isFeaturedSlideshow" | "isHeroSlideshow";
  selectedCategoryId: number | "all";
  onSelect: (id: number | "all") => void;
}) {
  const totalActive = products.filter(p => p[flagKey]).length;

  return (
    <div className="flex gap-2 flex-wrap">
      <Button
        size="sm"
        variant={selectedCategoryId === "all" ? "default" : "outline"}
        onClick={() => onSelect("all")}
        className={`text-xs h-7 px-3 ${selectedCategoryId === "all" ? "" : "border-gray-600 text-gray-400 hover:text-white"}`}
      >
        All
        {totalActive > 0 && (
          <Badge className={`ml-1.5 text-xs px-1.5 py-0 ${selectedCategoryId === "all" ? "bg-white/20 text-white" : "bg-gray-700 text-gray-300"}`}>
            {totalActive}
          </Badge>
        )}
      </Button>

      {categories.map(cat => {
        const catProducts = products.filter(p => matchesCategory(p, cat));
        const catActive = catProducts.filter(p => p[flagKey]).length;
        const isSelected = selectedCategoryId === cat.id;

        return (
          <Button
            key={cat.id}
            size="sm"
            variant={isSelected ? "default" : "outline"}
            onClick={() => onSelect(cat.id)}
            className={`text-xs h-7 px-3 ${isSelected ? "" : "border-gray-600 text-gray-400 hover:text-white"}`}
          >
            {cat.name}
            {catActive > 0 && (
              <Badge className={`ml-1.5 text-xs px-1.5 py-0 ${isSelected ? "bg-white/20 text-white" : flagKey === "isFeaturedSlideshow" ? "bg-yellow-500/80 text-black" : "bg-blue-600/80 text-white"}`}>
                {catActive}
              </Badge>
            )}
          </Button>
        );
      })}
    </div>
  );
}

export function FeaturedProductsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [featuredSearch, setFeaturedSearch] = useState("");
  const [heroSearch, setHeroSearch] = useState("");
  const [featuredCategoryId, setFeaturedCategoryId] = useState<number | "all">("all");
  const [heroCategoryId, setHeroCategoryId] = useState<number | "all">("all");
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());

  const { data: products = [], isLoading: productsLoading } = useQuery<SpotlightProduct[]>({
    queryKey: ["/api/admin/delivery/products/spotlight"],
  });

  const { data: allCategories = [], isLoading: categoriesLoading } = useQuery<DeliveryCategory[]>({
    queryKey: ["/api/delivery/categories"],
  });

  const isLoading = productsLoading || categoriesLoading;

  const activeCategories = useMemo(
    () => allCategories.filter(c => c.isActive).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)),
    [allCategories]
  );

  const featuredCount = products.filter(p => p.isFeaturedSlideshow).length;
  const heroCount = products.filter(p => p.isHeroSlideshow).length;

  const getFilteredProducts = (flagKey: "isFeaturedSlideshow" | "isHeroSlideshow", categoryId: number | "all") => {
    if (categoryId === "all") return products;
    const cat = allCategories.find(c => c.id === categoryId);
    if (!cat) return products;
    return products.filter(p => matchesCategory(p, cat));
  };

  const featuredProducts = useMemo(
    () => getFilteredProducts("isFeaturedSlideshow", featuredCategoryId),
    [products, featuredCategoryId, allCategories]
  );

  const heroProducts = useMemo(
    () => getFilteredProducts("isHeroSlideshow", heroCategoryId),
    [products, heroCategoryId, allCategories]
  );

  const toggleMutation = useMutation({
    mutationFn: async ({
      id,
      field,
      value,
    }: {
      id: number;
      field: "isFeaturedSlideshow" | "isHeroSlideshow";
      value: boolean;
    }) => {
      const response = await apiRequest("PATCH", `/api/admin/delivery/products/${id}`, {
        [field]: value,
      });
      return response.json();
    },
    onMutate: ({ id }) => {
      setPendingIds(prev => new Set(prev).add(id));
    },
    onSettled: (_, __, { id }) => {
      setPendingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    onSuccess: (_, { field, value }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/delivery/products/spotlight"] });
      const label = field === "isFeaturedSlideshow" ? "Featured Products" : "Hero Section";
      toast({
        title: value ? "Added" : "Removed",
        description: `Product ${value ? "added to" : "removed from"} ${label}.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update product. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleToggle = (
    id: number,
    current: boolean,
    field: "isFeaturedSlideshow" | "isHeroSlideshow"
  ) => {
    toggleMutation.mutate({ id, field, value: !current });
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          Featured &amp; Hero Management
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Control which products appear in the featured carousel and hero slideshow on the delivery portal.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading products...
          </div>
        ) : (
          <Tabs defaultValue="featured">
            <TabsList className="mb-4 bg-gray-900">
              <TabsTrigger value="featured" className="gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                Featured Products
                {featuredCount > 0 && (
                  <Badge className="ml-1 bg-yellow-500 text-black text-xs px-1.5 py-0">
                    {featuredCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="hero" className="gap-2">
                <ImagePlay className="w-4 h-4 text-blue-400" />
                Hero Section
                {heroCount > 0 && (
                  <Badge className="ml-1 bg-blue-600 text-white text-xs px-1.5 py-0">
                    {heroCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="featured" className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Featured products appear in the highlighted carousel on the delivery portal home page.
              </p>

              <CategoryFilterBar
                categories={activeCategories}
                products={products}
                flagKey="isFeaturedSlideshow"
                selectedCategoryId={featuredCategoryId}
                onSelect={id => { setFeaturedCategoryId(id); setFeaturedSearch(""); }}
              />

              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={featuredSearch}
                    onChange={e => setFeaturedSearch(e.target.value)}
                    className="pl-9 bg-gray-900 border-gray-700"
                  />
                </div>
                <p className="text-sm text-muted-foreground whitespace-nowrap">
                  {featuredProducts.filter(p => p.isFeaturedSlideshow).length} featured
                  {featuredCategoryId !== "all" && ` in category`}
                  {" / "}{featuredProducts.length} shown
                </p>
              </div>

              <div className="max-h-[520px] overflow-y-auto pr-1">
                <ProductList
                  products={featuredProducts}
                  flagKey="isFeaturedSlideshow"
                  search={featuredSearch}
                  onToggle={(id, current) => handleToggle(id, current, "isFeaturedSlideshow")}
                  pendingIds={pendingIds}
                  activeColor="bg-yellow-500/10 border-yellow-500/40"
                  activeIcon={<Star className="w-3.5 h-3.5" fill="currentColor" />}
                />
              </div>
            </TabsContent>

            <TabsContent value="hero" className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Hero section products appear in the large slideshow at the top of the delivery portal home page.
              </p>

              <CategoryFilterBar
                categories={activeCategories}
                products={products}
                flagKey="isHeroSlideshow"
                selectedCategoryId={heroCategoryId}
                onSelect={id => { setHeroCategoryId(id); setHeroSearch(""); }}
              />

              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={heroSearch}
                    onChange={e => setHeroSearch(e.target.value)}
                    className="pl-9 bg-gray-900 border-gray-700"
                  />
                </div>
                <p className="text-sm text-muted-foreground whitespace-nowrap">
                  {heroProducts.filter(p => p.isHeroSlideshow).length} in hero
                  {heroCategoryId !== "all" && ` in category`}
                  {" / "}{heroProducts.length} shown
                </p>
              </div>

              <div className="max-h-[520px] overflow-y-auto pr-1">
                <ProductList
                  products={heroProducts}
                  flagKey="isHeroSlideshow"
                  search={heroSearch}
                  onToggle={(id, current) => handleToggle(id, current, "isHeroSlideshow")}
                  pendingIds={pendingIds}
                  activeColor="bg-blue-600/10 border-blue-600/40"
                  activeIcon={<ImagePlay className="w-3.5 h-3.5" />}
                />
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
