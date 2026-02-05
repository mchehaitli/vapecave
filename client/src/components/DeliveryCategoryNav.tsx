import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { ChevronDown, ChevronRight, ArrowRight, Sparkles, Store, Tag } from "lucide-react";
import type { DeliveryCategory, DeliveryBrand, DeliveryProductLine } from "@shared/schema";

interface DeliveryCategoryNavProps {
  onCategorySelect?: (category: string | null) => void;
  selectedCategory?: string | null;
}

export function DeliveryCategoryNav({ 
  onCategorySelect,
  selectedCategory = null
}: DeliveryCategoryNavProps) {
  const [location] = useLocation();
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
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-center gap-1 py-2 flex-wrap">
          <Link href="/delivery/shop">
            <button
              onClick={() => {
                onCategorySelect?.(null);
                setExpandedCategories(new Set());
                setExpandedBrands(new Set());
              }}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                location === '/delivery/shop' && selectedCategory === null
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/80 hover:text-primary hover:bg-muted/50"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Featured
            </button>
          </Link>
          
          <Link href="/delivery/brands">
            <button
              onClick={() => {
                setExpandedCategories(new Set());
                setExpandedBrands(new Set());
              }}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                location === '/delivery/brands'
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/80 hover:text-primary hover:bg-muted/50"
              }`}
            >
              <Store className="w-4 h-4" />
              Shop by Brand
            </button>
          </Link>
          
          <Link href="/delivery/sale">
            <button
              onClick={() => {
                setExpandedCategories(new Set());
                setExpandedBrands(new Set());
              }}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                location === '/delivery/sale'
                  ? "bg-red-500 text-white"
                  : "text-red-500 hover:text-red-400 hover:bg-red-500/10"
              }`}
            >
              <Tag className="w-4 h-4" />
              On Sale
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
                    setExpandedCategories(prev => {
                      const newSet = new Set<number>();
                      if (!prev.has(category.id)) {
                        newSet.add(category.id);
                      }
                      return newSet;
                    });
                    setExpandedBrands(new Set());
                  }}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    isOpen
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground/80 hover:text-primary hover:bg-muted/50"
                  }`}
                >
                  {category.name}
                  {categoryBrands.length > 0 && (
                    <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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
