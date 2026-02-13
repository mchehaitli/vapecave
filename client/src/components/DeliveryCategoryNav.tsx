import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { ChevronDown, ChevronRight, ArrowRight, Sparkles, Store, Tag } from "lucide-react";
import type { DeliveryCategory, DeliveryBrand, DeliveryProductLine } from "@shared/schema";

interface DeliveryCategoryNavProps {
  onCategorySelect?: (category: string | null) => void;
  selectedCategory?: string | null;
  viewMode?: 'featured' | 'category';
  onViewModeChange?: (mode: 'featured' | 'category') => void;
}

export function DeliveryCategoryNav({ 
  onCategorySelect,
  selectedCategory = null,
  viewMode = 'featured',
  onViewModeChange,
}: DeliveryCategoryNavProps) {
  const [location, setLocation] = useLocation();
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [expandedBrands, setExpandedBrands] = useState<Set<number>>(new Set());

  const { data: deliveryCategories = [] } = useQuery<DeliveryCategory[]>({
    queryKey: ["/api/delivery/categories"],
  });

  const { data: deliveryBrands = [] } = useQuery<DeliveryBrand[]>({
    queryKey: ["/api/delivery/brands"],
  });

  const { data: deliveryProductLines = [] } = useQuery<DeliveryProductLine[]>({
    queryKey: ["/api/delivery/product-lines"],
  });

  const activeCategories = deliveryCategories
    .filter(c => c.isActive)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  const activeBrands = deliveryBrands
    .filter(b => b.isActive)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  const activeProductLines = deliveryProductLines
    .filter(pl => pl.isActive)
    .sort((a, b) => a.name.localeCompare(b.name));

  if (activeCategories.length === 0) return null;

  return (
    <section className="bg-card border-b border-border/30 relative z-50">
      <div className="container mx-auto px-2">
        <nav className="flex items-center justify-center gap-0 py-1.5 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <Link href="/delivery/shop">
            <button
              onClick={() => {
                onCategorySelect?.(null);
                onViewModeChange?.('featured');
                setExpandedCategories(new Set());
                setExpandedBrands(new Set());
              }}
              className={`flex items-center gap-1 px-2.5 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                location === '/delivery/shop' && viewMode === 'featured'
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/80 hover:text-primary hover:bg-muted/50"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Featured
            </button>
          </Link>
          
          <Link href="/delivery/brands">
            <button
              onClick={() => {
                setExpandedCategories(new Set());
                setExpandedBrands(new Set());
              }}
              className={`flex items-center gap-1 px-2.5 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                location === '/delivery/brands'
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/80 hover:text-primary hover:bg-muted/50"
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              Brands
            </button>
          </Link>
          
          <Link href="/delivery/sale">
            <button
              onClick={() => {
                setExpandedCategories(new Set());
                setExpandedBrands(new Set());
              }}
              className={`flex items-center gap-1 px-2.5 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                location === '/delivery/sale'
                  ? "bg-red-500 text-white"
                  : "text-red-500 hover:text-red-400 hover:bg-red-500/10"
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              Sale
            </button>
          </Link>
          
          {activeCategories.map((category) => {
            const categoryBrands = activeBrands.filter(b => b.categoryId === category.id);
            const isOpen = expandedCategories.has(category.id);
            
            return (
              <div key={category.id} className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (categoryBrands.length === 0) {
                      setLocation(`/delivery/category/${category.slug}`);
                      setExpandedCategories(new Set());
                      setExpandedBrands(new Set());
                    } else {
                      setExpandedCategories(prev => {
                        const newSet = new Set<number>();
                        if (!prev.has(category.id)) {
                          newSet.add(category.id);
                        }
                        return newSet;
                      });
                      setExpandedBrands(new Set());
                    }
                  }}
                  className={`flex items-center gap-1 px-2.5 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                    isOpen || location === `/delivery/category/${category.slug}`
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground/80 hover:text-primary hover:bg-muted/50"
                  }`}
                >
                  {category.name}
                  {categoryBrands.length > 0 && (
                    <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  )}
                </button>
                
                {isOpen && categoryBrands.length > 0 && (
                  <div className="absolute top-full left-0 mt-1 bg-card rounded-xl border border-border/50 shadow-xl min-w-[200px] z-[9999]">
                    <div className="py-2">
                      {categoryBrands.map((brand) => {
                        const brandProductLines = activeProductLines.filter(pl => pl.brandId === brand.id);
                        const isBrandOpen = expandedBrands.has(brand.id);
                        
                        return (
                          <div key={brand.id} className="relative">
                            <div className="flex items-center">
                              <Link
                                href={`/delivery/brand/${brand.slug}`}
                                className="flex-1 px-4 py-2.5 text-sm text-foreground/80 hover:text-primary hover:bg-muted/50 transition-all"
                                onClick={() => {
                                  setExpandedCategories(new Set());
                                  setExpandedBrands(new Set());
                                }}
                              >
                                {brand.name}
                              </Link>
                              {brandProductLines.length > 0 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedBrands(prev => {
                                      const newSet = new Set(prev);
                                      if (newSet.has(brand.id)) {
                                        newSet.delete(brand.id);
                                      } else {
                                        newSet.clear();
                                        newSet.add(brand.id);
                                      }
                                      return newSet;
                                    });
                                  }}
                                  className="px-3 py-2.5 text-muted-foreground hover:text-primary transition-all"
                                >
                                  <ChevronRight className={`w-4 h-4 transition-transform ${isBrandOpen ? 'rotate-90' : ''}`} />
                                </button>
                              )}
                            </div>
                            
                            {isBrandOpen && brandProductLines.length > 0 && (
                              <div className="absolute left-full top-0 ml-1 bg-card rounded-xl border border-border/50 shadow-xl min-w-[180px] z-[9999]">
                                <div className="py-2">
                                  {brandProductLines.map((productLine) => (
                                    <Link
                                      key={productLine.id}
                                      href={`/delivery/product-line/${productLine.slug}`}
                                      className="block px-4 py-2.5 text-sm text-foreground/80 hover:text-primary hover:bg-muted/50 transition-all"
                                      onClick={() => {
                                        setExpandedCategories(new Set());
                                        setExpandedBrands(new Set());
                                      }}
                                    >
                                      {productLine.name}
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      
                      <div className="border-t border-border/30 mt-2 pt-2">
                        <Link
                          href={`/delivery/category/${category.slug}`}
                          onClick={() => {
                            setExpandedCategories(new Set());
                            setExpandedBrands(new Set());
                          }}
                          className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10 transition-all rounded-lg mx-2 cursor-pointer"
                        >
                          See All {category.name}
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
      
      {expandedCategories.size > 0 && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => {
            setExpandedCategories(new Set());
            setExpandedBrands(new Set());
          }}
        />
      )}
    </section>
  );
}
