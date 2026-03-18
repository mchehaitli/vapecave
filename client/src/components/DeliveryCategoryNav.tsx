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
  hideSpecialTabs?: boolean;
  hideBrandsAndSale?: boolean;
  standalone?: boolean;
}

export function DeliveryCategoryNav({ 
  onCategorySelect,
  selectedCategory = null,
  viewMode = 'featured',
  onViewModeChange,
  hideSpecialTabs = false,
  hideBrandsAndSale = false,
  standalone = false,
}: DeliveryCategoryNavProps) {
  const [location, setLocation] = useLocation();

  // Desktop portal dropdown state
  const [expandedCategoryId, setExpandedCategoryId] = useState<number | null>(null);
  const [expandedBrandId, setExpandedBrandId] = useState<number | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const [brandDropdownPos, setBrandDropdownPos] = useState<{ top: number; left: number } | null>(null);

  // Mobile inline accordion state (separate from desktop portal state)
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [mobileExpandedCategoryId, setMobileExpandedCategoryId] = useState<number | null>(null);
  const [mobileExpandedBrandId, setMobileExpandedBrandId] = useState<number | null>(null);

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
    .filter(pl => pl.isActive && !pl.parentId)
    .sort((a, b) => a.name.localeCompare(b.name));

  const closeAll = useCallback(() => {
    setExpandedCategoryId(null);
    setExpandedBrandId(null);
    setDropdownPos(null);
    setBrandDropdownPos(null);
    setMobileCategoriesOpen(false);
    setMobileExpandedCategoryId(null);
    setMobileExpandedBrandId(null);
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
      setBrandDropdownPos({ top: rect.top, left: rect.right + 4 });
    }
    setExpandedBrandId(brandId);
  }, []);

  // Scroll lock while mobile panel is open
  useEffect(() => {
    if (mobileCategoriesOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileCategoriesOpen]);

  // Close desktop dropdowns on scroll (desktop only)
  useEffect(() => {
    if (expandedCategoryId === null) return;
    const handleScroll = () => {
      setExpandedCategoryId(null);
      setExpandedBrandId(null);
      setDropdownPos(null);
      setBrandDropdownPos(null);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [expandedCategoryId]);

  if (activeCategories.length === 0) return null;

  const expandedCategory = expandedCategoryId !== null
    ? activeCategories.find(c => c.id === expandedCategoryId) || null
    : null;

  const categoryBrandsForDropdown = expandedCategory
    ? activeBrands.filter(b => b.categoryId === expandedCategory.id)
    : [];

  const mobileExpandedCategory = mobileExpandedCategoryId !== null
    ? activeCategories.find(c => c.id === mobileExpandedCategoryId) || null
    : null;

  const mobileExpandedCategoryBrands = mobileExpandedCategory
    ? activeBrands.filter(b => b.categoryId === mobileExpandedCategory.id)
    : [];

  const hideBoth = hideSpecialTabs || hideBrandsAndSale;

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

  const getCategoryActive = (category: DeliveryCategory, isOpen: boolean): boolean => {
    if (standalone) {
      return (
        selectedCategory === category.name ||
        location === `/products/category/${category.slug}`
      );
    }
    return isOpen || location === `/delivery/category/${category.slug}`;
  };

  const isMobileOnCategoryPage = standalone
    ? location.startsWith('/products/category/') || location.startsWith('/products/brand/')
    : activeCategories.some(c => location === `/delivery/category/${c.slug}`);

  const getMobileCategoryLabel = (): string => {
    if (standalone) {
      if (location.startsWith('/products/category/')) {
        const slug = location.replace('/products/category/', '');
        const cat = activeCategories.find(c => c.slug === slug);
        return cat?.name ?? 'Categories';
      }
      if (location.startsWith('/products/brand/')) {
        const brandSlug = location.replace('/products/brand/', '');
        const brand = activeBrands.find(b => b.slug === brandSlug);
        if (brand?.categoryId) {
          const cat = activeCategories.find(c => c.id === brand.categoryId);
          return cat?.name ?? 'Categories';
        }
      }
      return selectedCategory ?? 'Categories';
    }
    const cat = activeCategories.find(c => location === `/delivery/category/${c.slug}`);
    return cat?.name ?? 'Categories';
  };

  const featuredTabActive = standalone
    ? (location === '/products' && !selectedCategory && viewMode !== 'category')
    : (location === '/delivery/shop' && viewMode === 'featured');

  const handleFeaturedClick = () => {
    if (standalone) {
      setLocation('/products');
      onCategorySelect?.(null);
      onViewModeChange?.('featured');
    } else {
      onCategorySelect?.(null);
      onViewModeChange?.('featured');
    }
    closeAll();
  };

  // Desktop: portal-based dropdown
  const handleCategoryClick = (category: DeliveryCategory, hasBrands: boolean, isOpen: boolean) => {
    if (standalone) {
      if (hasBrands) {
        if (isOpen) { closeAll(); } else { openCategoryDropdown(category.id); }
      } else {
        setLocation(`/products/category/${category.slug}`);
        onCategorySelect?.(category.name);
        closeAll();
      }
    } else {
      if (hasBrands) {
        if (isOpen) { closeAll(); } else { openCategoryDropdown(category.id); }
      } else {
        setLocation(`/delivery/category/${category.slug}`);
        closeAll();
      }
    }
  };

  // Mobile: inline accordion — never closes the panel
  const handleMobileCategoryClick = (e: React.MouseEvent, category: DeliveryCategory, hasBrands: boolean) => {
    e.stopPropagation();
    if (hasBrands) {
      // Accordion: toggle brand list below grid; keep panel open
      setMobileExpandedCategoryId(prev => prev === category.id ? null : category.id);
      setMobileExpandedBrandId(null);
    } else {
      if (standalone) {
        setLocation(`/products/category/${category.slug}`);
        onCategorySelect?.(category.name);
      } else {
        setLocation(`/delivery/category/${category.slug}`);
      }
      closeAll();
    }
  };

  // Brand tap: toggle product lines if brand has them; navigate if not
  const handleMobileBrandTap = (e: React.MouseEvent, brand: DeliveryBrand, hasProductLines: boolean) => {
    e.stopPropagation();
    if (hasProductLines) {
      setMobileExpandedBrandId(prev => prev === brand.id ? null : brand.id);
    } else {
      const href = standalone ? `/products/brand/${brand.slug}` : `/delivery/brand/${brand.slug}`;
      setLocation(href);
      closeAll();
    }
  };

  return (
    <>
      <section className="bg-card border-b border-border/30 relative z-50">
        <div className="container mx-auto px-2 sm:px-4">
          <nav className="flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 flex-wrap">
            {!hideSpecialTabs && (
              <>
                {standalone ? (
                  <button
                    onClick={handleFeaturedClick}
                    className={tabClass(featuredTabActive)}
                  >
                    <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    Featured
                  </button>
                ) : (
                  <Link href="/delivery/shop">
                    <button
                      onClick={handleFeaturedClick}
                      className={tabClass(featuredTabActive)}
                    >
                      <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      Featured
                    </button>
                  </Link>
                )}

                {!hideBoth && (
                  <>
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
                  </>
                )}
              </>
            )}

            {/* Desktop category pills */}
            <div className="hidden sm:contents">
              {activeCategories.map((category) => {
                const categoryBrands = activeBrands.filter(b => b.categoryId === category.id);
                const hasBrands = categoryBrands.length > 0;
                const isOpen = expandedCategoryId === category.id;
                const isActive = getCategoryActive(category, isOpen);
                
                return (
                  <button
                    key={category.id}
                    ref={(el) => { categoryButtonRefs.current[category.id] = el; }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCategoryClick(category, hasBrands, isOpen);
                    }}
                    className={`flex items-center gap-1 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground/80 hover:text-primary hover:bg-muted/50"
                    }`}
                  >
                    {category.name}
                    {hasBrands && (
                      <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Mobile "Categories" toggle button */}
            <div className="sm:hidden">
              <button
                onClick={() => {
                  if (mobileCategoriesOpen) {
                    closeAll();
                  } else {
                    setMobileCategoriesOpen(true);
                    setMobileExpandedCategoryId(null);
                    setMobileExpandedBrandId(null);
                  }
                }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-all ${
                  mobileCategoriesOpen || isMobileOnCategoryPage
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/80 hover:text-primary hover:bg-muted/50"
                }`}
              >
                <LayoutGrid className="w-3 h-3" />
                {getMobileCategoryLabel()}
                <ChevronDown className={`w-3 h-3 transition-transform ${mobileCategoriesOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </nav>
        </div>

        {/* Mobile categories panel — inline accordion */}
        {mobileCategoriesOpen && (
          <div className="sm:hidden border-t border-border/30 bg-card/95 backdrop-blur-sm relative z-50">
            <div className="container mx-auto px-3 py-2">

              {/* Category grid — always visible */}
              <div className="grid grid-cols-2 gap-1.5">
                {activeCategories.map((category) => {
                  const categoryBrands = activeBrands.filter(b => b.categoryId === category.id);
                  const hasBrands = categoryBrands.length > 0;
                  const isExpanded = mobileExpandedCategoryId === category.id;
                  const isActive = standalone
                    ? (selectedCategory === category.name || location === `/products/category/${category.slug}`)
                    : location === `/delivery/category/${category.slug}`;
                  
                  return (
                    <button
                      key={category.id}
                      onClick={(e) => handleMobileCategoryClick(e, category, hasBrands)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                        isExpanded
                          ? "bg-primary/20 text-primary ring-1 ring-primary/40"
                          : isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground/80 hover:text-primary bg-muted/30 hover:bg-muted/60"
                      }`}
                    >
                      <span className="truncate">{category.name}</span>
                      {hasBrands && (
                        <ChevronDown className={`w-3 h-3 flex-shrink-0 ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Inline brand accordion — appears below grid when a category is expanded */}
              {mobileExpandedCategoryId !== null && mobileExpandedCategory && mobileExpandedCategoryBrands.length > 0 && (
                <div className="mt-2 border-t border-border/30 pt-2">
                  {/* Brand list */}
                  <div className="space-y-0.5">
                    {mobileExpandedCategoryBrands.map((brand) => {
                      const brandProductLines = activeProductLines.filter(pl => pl.brandId === brand.id);
                      const hasProductLines = brandProductLines.length > 0;
                      const isBrandExpanded = mobileExpandedBrandId === brand.id;

                      return (
                        <div key={brand.id}>
                          {/* Brand row — tap toggles product lines if any, else navigates */}
                          <button
                            onClick={(e) => handleMobileBrandTap(e, brand, hasProductLines)}
                            className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-xs text-foreground/80 hover:text-primary hover:bg-muted/40 transition-all text-left"
                          >
                            <span className="truncate">{brand.name}</span>
                            {hasProductLines && (
                              <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 ml-1 transition-transform ${isBrandExpanded ? 'rotate-180' : ''}`} />
                            )}
                          </button>

                          {/* Inline product line list */}
                          {isBrandExpanded && brandProductLines.length > 0 && (
                            <div className="ml-4 border-l border-border/40 pl-2 mb-1 space-y-0.5">
                              {brandProductLines.map((productLine) => {
                                const plHref = standalone
                                  ? `/products/brand/${brand.slug}?line=${productLine.slug}`
                                  : `/delivery/product-line/${productLine.slug}`;
                                return standalone ? (
                                  <button
                                    key={productLine.id}
                                    className="block w-full px-3 py-2 text-xs text-foreground/70 hover:text-primary hover:bg-muted/40 transition-all text-left rounded"
                                    onClick={() => { setLocation(plHref); closeAll(); }}
                                  >
                                    {productLine.name}
                                  </button>
                                ) : (
                                  <Link
                                    key={productLine.id}
                                    href={plHref}
                                    className="block px-3 py-2 text-xs text-foreground/70 hover:text-primary hover:bg-muted/40 transition-all rounded"
                                    onClick={closeAll}
                                  >
                                    {productLine.name}
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* "See All [Category]" link */}
                  <div className="mt-1.5 pt-1.5 border-t border-border/20">
                    {standalone ? (
                      <button
                        onClick={() => {
                          setLocation(`/products/category/${mobileExpandedCategory.slug}`);
                          onCategorySelect?.(mobileExpandedCategory.name);
                          closeAll();
                        }}
                        className="flex items-center justify-center gap-2 w-full px-3 py-2.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-all rounded-lg cursor-pointer"
                      >
                        See All {mobileExpandedCategory.name}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <Link
                        href={`/delivery/category/${mobileExpandedCategory.slug}`}
                        onClick={closeAll}
                        className="flex items-center justify-center gap-2 w-full px-3 py-2.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-all rounded-lg cursor-pointer"
                      >
                        See All {mobileExpandedCategory.name}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Mobile backdrop — closes the panel when tapping outside */}
      {mobileCategoriesOpen && createPortal(
        <div className="fixed inset-0 z-40 sm:hidden" onClick={closeAll} />,
        document.body
      )}

      {/* Desktop portal dropdown (unchanged) */}
      {expandedCategoryId !== null && createPortal(
        <>
          <div 
            className="fixed inset-0 z-[9998]" 
            onClick={closeAll}
          />
          {dropdownPos && categoryBrandsForDropdown.length > 0 && (
            <div
              className="fixed bg-card rounded-xl border border-border/50 shadow-xl min-w-[200px] max-w-[calc(100vw-16px)] z-[9999]"
              style={{ top: dropdownPos.top, left: Math.max(8, Math.min(dropdownPos.left, window.innerWidth - 216)) }}
            >
              <div className="py-2">
                {categoryBrandsForDropdown.map((brand) => {
                  const brandProductLines = activeProductLines.filter(pl => pl.brandId === brand.id);
                  const isBrandOpen = expandedBrandId === brand.id;
                  const brandHref = standalone ? `/products/brand/${brand.slug}` : `/delivery/brand/${brand.slug}`;
                  
                  return (
                    <div
                      key={brand.id}
                      ref={(el) => { brandItemRefs.current[brand.id] = el; }}
                    >
                      <div className="flex items-center">
                        {standalone ? (
                          <button
                            className="flex-1 px-4 py-2.5 text-sm text-foreground/80 hover:text-primary hover:bg-muted/50 transition-all text-left"
                            onClick={() => { setLocation(brandHref); closeAll(); }}
                          >
                            {brand.name}
                          </button>
                        ) : (
                          <Link
                            href={brandHref}
                            className="flex-1 px-4 py-2.5 text-sm text-foreground/80 hover:text-primary hover:bg-muted/50 transition-all"
                            onClick={closeAll}
                          >
                            {brand.name}
                          </Link>
                        )}
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
                    {standalone ? (
                      <button
                        onClick={() => { setLocation(`/products/category/${expandedCategory.slug}`); onCategorySelect?.(expandedCategory.name); closeAll(); }}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10 transition-all rounded-lg mx-2 w-[calc(100%-16px)] cursor-pointer"
                      >
                        See All {expandedCategory.name}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <Link
                        href={`/delivery/category/${expandedCategory.slug}`}
                        onClick={closeAll}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10 transition-all rounded-lg mx-2 cursor-pointer"
                      >
                        See All {expandedCategory.name}
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {expandedBrandId !== null && brandDropdownPos && (() => {
            const brandLines = activeProductLines.filter(pl => pl.brandId === expandedBrandId);
            const parentBrand = activeBrands.find(b => b.id === expandedBrandId);
            
            return brandLines.length > 0 ? (
              <div
                className="fixed bg-card rounded-xl border border-border/50 shadow-xl min-w-[180px] max-w-[calc(100vw-16px)] z-[9999]"
                style={{ top: brandDropdownPos.top, left: brandDropdownPos.left }}
              >
                <div className="py-2">
                  {brandLines.map((productLine) => {
                    const plHref = standalone
                      ? (parentBrand ? `/products/brand/${parentBrand.slug}?line=${productLine.slug}` : '/products')
                      : `/delivery/product-line/${productLine.slug}`;
                    return standalone ? (
                      <button
                        key={productLine.id}
                        className="block w-full px-4 py-2.5 text-sm text-foreground/80 hover:text-primary hover:bg-muted/50 transition-all text-left"
                        onClick={() => { setLocation(plHref); closeAll(); }}
                      >
                        {productLine.name}
                      </button>
                    ) : (
                      <Link
                        key={productLine.id}
                        href={plHref}
                        className="block px-4 py-2.5 text-sm text-foreground/80 hover:text-primary hover:bg-muted/50 transition-all"
                        onClick={closeAll}
                      >
                        {productLine.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : null;
          })()}
        </>,
        document.body
      )}
    </>
  );
}
