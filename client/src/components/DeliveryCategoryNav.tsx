import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { ChevronDown, ChevronRight, ArrowRight, Sparkles, Store, Tag, LayoutGrid } from "lucide-react";
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
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
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
    setMobileCategoriesOpen(false);
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
    if (expandedCategoryId === null && !mobileCategoriesOpen) return;
    const isMobile = window.innerWidth < 640;
    if (isMobile) return;
    const handleScroll = () => closeAll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [expandedCategoryId, mobileCategoriesOpen, closeAll]);

  if (activeCategories.length === 0) return null;

  const expandedCategory = expandedCategoryId !== null
    ? activeCategories.find(c => c.id === expandedCategoryId) || null
    : null;

  const categoryBrandsForDropdown = expandedCategory
    ? activeBrands.filter(b => b.categoryId === expandedCategory.id)
    : [];

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
                const categoryBrands = activeBrands.filter(b => b.categoryId === category.id);
                const isOpen = expandedCategoryId === category.id;
                const isActive = isOpen || location === `/delivery/category/${category.slug}`;
                
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
                    className={`flex items-center gap-1 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                      isActive
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
            </div>

            <div className="sm:hidden">
              <button
                onClick={() => {
                  setMobileCategoriesOpen(!mobileCategoriesOpen);
                  setExpandedCategoryId(null);
                  setExpandedBrandId(null);
                  setDropdownPos(null);
                  setBrandDropdownPos(null);
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
                  const categoryBrands = activeBrands.filter(b => b.categoryId === category.id);
                  const isActive = location === `/delivery/category/${category.slug}`;
                  
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
                          setMobileCategoriesOpen(false);
                          openCategoryDropdown(category.id);
                        }
                      }}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground/80 hover:text-primary bg-muted/30 hover:bg-muted/60"
                      }`}
                    >
                      <span className="truncate">{category.name}</span>
                      {categoryBrands.length > 0 && (
                        <ChevronRight className="w-3 h-3 flex-shrink-0 ml-1" />
                      )}
                    </button>
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

      {expandedCategoryId !== null && createPortal(
        <>
          <div 
            className="fixed inset-0 z-[9998]" 
            onClick={closeAll}
          />
          {dropdownPos && categoryBrandsForDropdown.length > 0 && (
            <div
              className="fixed bg-card rounded-xl border border-border/50 shadow-xl min-w-[200px] max-w-[calc(100vw-16px)] z-[9999] max-h-[60vh] overflow-y-auto overscroll-contain"
              style={{ top: dropdownPos.top, left: Math.max(8, Math.min(dropdownPos.left, window.innerWidth - 216)) }}
              onTouchMove={(e) => e.stopPropagation()}
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
              className="fixed bg-card rounded-xl border border-border/50 shadow-xl min-w-[180px] max-w-[calc(100vw-16px)] z-[9999] max-h-[50vh] overflow-y-auto overscroll-contain"
              style={{ top: brandDropdownPos.top, left: brandDropdownPos.left }}
              onTouchMove={(e) => e.stopPropagation()}
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
