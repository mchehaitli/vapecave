import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Star, Save, Loader2, Package } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { DeliveryCategory, DeliveryProduct } from "@shared/schema";

export function FeaturedProductsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [featuredIds, setFeaturedIds] = useState<number[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<DeliveryCategory[]>({
    queryKey: ["/api/delivery/categories"],
  });

  // Fetch all products
  const { data: products = [], isLoading: productsLoading } = useQuery<DeliveryProduct[]>({
    queryKey: ["/api/delivery/products"],
  });
  
  const isLoading = categoriesLoading || productsLoading;

  // Get active categories sorted by display order
  const activeCategories = categories
    .filter(c => c.isActive)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  // Get products for selected category
  const categoryProducts = products.filter(p => {
    if (!selectedCategory) return false;
    const category = categories.find(c => c.id === selectedCategory);
    if (!category) return false;
    return p.category === category.slug || p.category === category.name;
  }).filter(p => p.enabled);

  // Load featured products when category changes
  const handleCategorySelect = (categoryId: number) => {
    setSelectedCategory(categoryId);
    const category = categories.find(c => c.id === categoryId);
    const ids = (category?.featuredProductIds as number[]) || [];
    setFeaturedIds(ids);
    setHasChanges(false);
  };

  // Toggle product featured status
  const toggleFeatured = (productId: number) => {
    setFeaturedIds(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
    setHasChanges(true);
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCategory) throw new Error("No category selected");
      const response = await apiRequest("PATCH", `/api/admin/delivery/categories/${selectedCategory}`, {
        featuredProductIds: featuredIds,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery/categories"] });
      toast({
        title: "Saved",
        description: "Featured products updated successfully",
      });
      setHasChanges(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save featured products",
        variant: "destructive",
      });
    },
  });

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          Featured Products by Category
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Select which products to feature in each category carousel on the delivery portal home page.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Category Selection */}
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading categories...
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {activeCategories.map((category) => {
              const categoryFeaturedCount = ((category.featuredProductIds as number[]) || []).length;
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCategorySelect(category.id)}
                  className="relative"
                  disabled={isLoading}
                >
                  {category.name}
                  {categoryFeaturedCount > 0 && (
                    <Badge className="ml-2 bg-yellow-500 text-black text-xs">
                      {categoryFeaturedCount}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        )}

        {/* Products List */}
        {selectedCategory && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                {categories.find(c => c.id === selectedCategory)?.name} Products
              </h3>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {featuredIds.length} featured
                </span>
                <Button
                  onClick={() => saveMutation.mutate()}
                  disabled={!hasChanges || saveMutation.isPending || isLoading}
                  size="sm"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>

            {categoryProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No enabled products in this category</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto">
                {categoryProducts.map((product) => {
                  const isFeatured = featuredIds.includes(product.id);
                  const stock = parseInt(product.stockQuantity || '0');
                  const isOutOfStock = stock === 0;
                  const isLowStock = stock > 0 && stock <= 2;

                  return (
                    <div
                      key={product.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                        isFeatured
                          ? "bg-yellow-500/10 border-yellow-500/50"
                          : "bg-gray-900/50 border-gray-700 hover:border-gray-600"
                      } ${isOutOfStock ? "opacity-50" : ""}`}
                      onClick={() => toggleFeatured(product.id)}
                    >
                      <Checkbox
                        checked={isFeatured}
                        className="data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500 pointer-events-none"
                      />
                      
                      <img
                        src={product.image || '/placeholder-product.png'}
                        alt={product.name}
                        className="w-12 h-12 object-contain rounded"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{product.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-primary font-semibold">${product.price}</span>
                          {isOutOfStock && (
                            <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                          )}
                          {isLowStock && (
                            <Badge className="bg-amber-500 text-white text-xs">Low Stock</Badge>
                          )}
                        </div>
                      </div>
                      
                      {isFeatured && (
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {!selectedCategory && (
          <div className="text-center py-12 text-muted-foreground">
            <Star className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Select a category above to manage its featured products</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
