import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { ChevronDown, Sparkles, Store, Tag, LayoutGrid } from "lucide-react";
import type { DeliveryCategory } from "@shared/schema";

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
  const [location] = useLocation();
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);

  const { data: deliveryCategories = [] } = useQuery<DeliveryCategory[]>({
    queryKey: ["/api/delivery/categories"],
  });

  const activeCategories = deliveryCategories
    .filter(c => c.isActive)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  const closeAll = useCallback(() => {
    setMobileCategoriesOpen(false);
  }, []);

  if (activeCategories.length === 0) return null;

  const isOnCategoryPage = activeCategories.some(c => location === `/delivery/category/${c.slug}`);
  const activeCategoryForPage = activeCategories.find(c => location === `/delivery/category/${c.slug}`);

  const tabClass = (active: boolean, variant?: 'sale') => {
    if (variant === 'sale') {
      return `flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-medium whitespace-nowrap transition-all ${
        active ? "bg-red-500 text-white" : "text-red-500 hover:text-red-400 hover:bg-red-500/10"
      }`;
    }
    return `flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-medium whitespace-nowrap transition-all ${
      active ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:text-primary hover:bg-muted/50"
    }`;
  };

  return (
    <>
      <section className="bg-card border-b border-border/30 relative z-50">
        <div className="container mx-auto px-2 sm:px-4">
          <nav className="flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 flex-wrap">
            <Link href="/delivery/shop">
              <button
                onClick={() => {
                  onCategorySelect?.(null);
                  onViewModeChange?.('featured');
                  closeAll();
                }}
                className={tabClass(location === '/delivery/shop' && viewMode === 'featured')}
              >
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                Featured
              </button>
            </Link>
            
            <Link href="/delivery/brands">
              <button
                onClick={() => closeAll()}
                className={tabClass(location === '/delivery/brands')}
              >
                <Store className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                Brands
              </button>
            </Link>
            
            <Link href="/delivery/sale">
              <button
                onClick={() => closeAll()}
                className={tabClass(location === '/delivery/sale', 'sale')}
              >
                <Tag className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                Sale
              </button>
            </Link>

            <div className="hidden sm:contents">
              {activeCategories.map((category) => {
                const isActive = location === `/delivery/category/${category.slug}`;
                
                return (
                  <Link
                    key={category.id}
                    href={`/delivery/category/${category.slug}`}
                    onClick={() => closeAll()}
                  >
                    <button
                      className={`flex items-center gap-1 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground/80 hover:text-primary hover:bg-muted/50"
                      }`}
                    >
                      {category.name}
                    </button>
                  </Link>
                );
              })}
            </div>

            <div className="sm:hidden">
              <button
                onClick={() => {
                  setMobileCategoriesOpen(!mobileCategoriesOpen);
                }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-all ${
                  mobileCategoriesOpen || isOnCategoryPage
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/80 hover:text-primary hover:bg-muted/50"
                }`}
              >
                <LayoutGrid className="w-3 h-3" />
                {activeCategoryForPage ? activeCategoryForPage.name : "Categories"}
                <ChevronDown className={`w-3 h-3 transition-transform ${mobileCategoriesOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </nav>
        </div>

        {mobileCategoriesOpen && (
          <div className="sm:hidden border-t border-border/30 bg-card/95 backdrop-blur-sm relative z-50">
            <div className="container mx-auto px-3 py-2">
              <div className="grid grid-cols-2 gap-1.5">
                {activeCategories.map((category) => {
                  const isActive = location === `/delivery/category/${category.slug}`;
                  
                  return (
                    <Link
                      key={category.id}
                      href={`/delivery/category/${category.slug}`}
                      onClick={() => closeAll()}
                    >
                      <button
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground/80 hover:text-primary bg-muted/30 hover:bg-muted/60"
                        }`}
                      >
                        <span className="truncate">{category.name}</span>
                      </button>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>

      {mobileCategoriesOpen && createPortal(
        <div className="fixed inset-0 z-40 sm:hidden" onClick={() => setMobileCategoriesOpen(false)} />,
        document.body
      )}
    </>
  );
}
