import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
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
  const [expandedCategoryId, setExpandedCategoryId] = useState<number | null>(null);
  const [expandedBrandId, setExpandedBrandId] = useState<number | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const [brandDropdownPos, setBrandDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const categoryButtonRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const brandItemRefs = useRef<Record<number, HTMLDivElement | null>>({});

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

  const closeAll = useCallback(() => {
    setExpandedCategoryId(null);
    setExpandedBrandId(null);
    setDropdownPos(null);
    setBrandDropdownPos(null);
  }, []);

  const openCategoryDropdown = useCallback((categoryId: number) => {
    const btn = categoryButtonRefs.current[categoryId];
    if (btn) {
      const rect = btn.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left });
    }
    setExpandedCategoryId(categoryId);
    setExpandedBrandId(null);
    setBrandDropdownPos(null);
  }, []);

  const openBrandDropdown = useCallback((brandId: number) => {
    const el = brandItemRefs.current[brandId];
    if (el) {
      const rect = el.getBoundingClientRect();
      const isMobile = window.innerWidth < 640;
      if (isMobile) {
        setBrandDropdownPos({ top: rect.bottom + 4, left: Math.max(8, rect.left) });
      } else {
        setBrandDropdownPos({ top: rect.top, left: rect.right + 4 });
      }
    }
    setExpandedBrandId(brandId);
  }, []);

  useEffect(() => {
    if (expandedCategoryId === null) return;
    const handleScroll = () => closeAll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [expandedCategoryId, closeAll]);

  if (activeCategories.length === 0) return null;

  const expandedCategory = expandedCategoryId !== null
    ? activeCategories.find(c => c.id === expandedCategoryId) || null
    : null;

  const categoryBrandsForDropdown = expandedCategory
    ? activeBrands.filter(b => b.categoryId === expandedCategory.id)
    : [];

  return (
    <>
      <section className="bg-card border-b border-border/30 relative z-50">
        <div className="container mx-auto px-2">
          <nav className="flex items-center justify-center gap-0 py-1.5 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <Link href="/delivery/shop">
              <button
                onClick={() => {
                  onCategorySelect?.(null);
                  onViewModeChange?.('featured');
                  closeAll();
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
                onClick={() => closeAll()}
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
                onClick={() => closeAll()}
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
              const isOpen = expandedCategoryId === category.id;
              
              return (
                <button
                  key={category.id}
                  ref={(el) => { categoryButtonRefs.current[category.id] = el; }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (categoryBrands.length === 0) {
                      setLocation(`/delivery/category/${category.slug}`);
                      closeAll();
                    } else {
                      if (isOpen) {
                        closeAll();
                      } else {
                        openCategoryDropdown(category.id);
                      }
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
              );
            })}
          </nav>
        </div>
      </section>

      {expandedCategoryId !== null && createPortal(
        <>
          <div 
            className="fixed inset-0 z-[9998]" 
            onClick={closeAll}
          />
          {dropdownPos && categoryBrandsForDropdown.length > 0 && (
            <div
              className="fixed bg-card rounded-xl border border-border/50 shadow-xl min-w-[200px] z-[9999]"
              style={{ top: dropdownPos.top, left: dropdownPos.left }}
            >
              <div className="py-2">
                {categoryBrandsForDropdown.map((brand) => {
                  const brandProductLines = activeProductLines.filter(pl => pl.brandId === brand.id);
                  const isBrandOpen = expandedBrandId === brand.id;
                  
                  return (
                    <div
                      key={brand.id}
                      ref={(el) => { brandItemRefs.current[brand.id] = el; }}
                    >
                      <div className="flex items-center">
                        <Link
                          href={`/delivery/brand/${brand.slug}`}
                          className="flex-1 px-4 py-2.5 text-sm text-foreground/80 hover:text-primary hover:bg-muted/50 transition-all"
                          onClick={closeAll}
                        >
                          {brand.name}
                        </Link>
                        {brandProductLines.length > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isBrandOpen) {
                                setExpandedBrandId(null);
                                setBrandDropdownPos(null);
                              } else {
                                openBrandDropdown(brand.id);
                              }
                            }}
                            className="px-3 py-2.5 text-muted-foreground hover:text-primary transition-all"
                          >
                            <ChevronRight className={`w-4 h-4 transition-transform ${isBrandOpen ? 'rotate-90' : ''}`} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {expandedCategory && (
                  <div className="border-t border-border/30 mt-2 pt-2">
                    <Link
                      href={`/delivery/category/${expandedCategory.slug}`}
                      onClick={closeAll}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10 transition-all rounded-lg mx-2 cursor-pointer"
                    >
                      See All {expandedCategory.name}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {expandedBrandId !== null && brandDropdownPos && (
            <div
              className="fixed bg-card rounded-xl border border-border/50 shadow-xl min-w-[180px] max-w-[calc(100vw-16px)] z-[9999]"
              style={{ top: brandDropdownPos.top, left: brandDropdownPos.left }}
            >
              <div className="py-2">
                {activeProductLines
                  .filter(pl => pl.brandId === expandedBrandId)
                  .map((productLine) => (
                    <Link
                      key={productLine.id}
                      href={`/delivery/product-line/${productLine.slug}`}
                      className="block px-4 py-2.5 text-sm text-foreground/80 hover:text-primary hover:bg-muted/50 transition-all"
                      onClick={closeAll}
                    >
                      {productLine.name}
                    </Link>
                  ))}
              </div>
            </div>
          )}
        </>,
        document.body
      )}
    </>
  );
}
