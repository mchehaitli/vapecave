import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { Package, TrendingUp, Sparkles, ChevronLeft, ChevronRight, Eye, ShoppingCart, Plus, Minus, Truck, ChevronDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { DeliveryHeader } from "@/components/DeliveryHeader";
import { DeliveryFooter } from "@/components/DeliveryFooter";
import { DeliveryCategoryNav } from "@/components/DeliveryCategoryNav";
import { useFulfillment } from "@/contexts/FulfillmentContext";
import { FloatingCartButton } from "@/components/FloatingCartButton";
import { ProductQuickView } from "@/components/ProductQuickView";
import { useInactivityTimeout } from "@/hooks/useInactivityTimeout";
import WelcomeLaunchModal from "@/components/WelcomeLaunchModal";
import type { DeliveryProduct, DeliveryCategory, DeliveryBrand, DeliveryProductLine } from "@shared/schema";
import { extractNicLevel } from "@/lib/productVariants";

function BrandCarousel({ 
  title, 
  brands,
  seeAllLink 
}: { 
  title: string;
  brands: DeliveryBrand[];
  seeAllLink?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isTouching, setIsTouching] = useState(false);
  const isPausedRef = useRef(false);
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      isPausedRef.current = true;
      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = setTimeout(() => {
        isPausedRef.current = false;
      }, 5000);

      const containerWidth = scrollRef.current.clientWidth;
      const scrollAmount = Math.max(containerWidth * 0.75, 300);
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(checkScroll, 350);
    }
  };

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', checkScroll);
      return () => ref.removeEventListener('scroll', checkScroll);
    }
  }, [brands]);

  useEffect(() => {
    if (isHovered || isTouching || brands.length === 0) return;
    
    let animationFrameId: number;
    let lastTime = 0;
    const scrollSpeed = 0.8;
    
    const smoothScroll = (currentTime: number) => {
      if (!scrollRef.current) {
        animationFrameId = requestAnimationFrame(smoothScroll);
        return;
      }

      if (isPausedRef.current) {
        lastTime = 0;
        animationFrameId = requestAnimationFrame(smoothScroll);
        return;
      }
      
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const canScroll = scrollWidth > clientWidth + 10;
      
      if (!canScroll) {
        animationFrameId = requestAnimationFrame(smoothScroll);
        return;
      }
      
      if (lastTime === 0) lastTime = currentTime;
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      
      const isAtEnd = scrollLeft >= scrollWidth - clientWidth - 5;
      
      if (isAtEnd) {
        scrollRef.current.scrollLeft = 0;
      } else {
        scrollRef.current.scrollLeft += scrollSpeed * (deltaTime / 16);
      }
      
      animationFrameId = requestAnimationFrame(smoothScroll);
    };
    
    animationFrameId = requestAnimationFrame(smoothScroll);
    
    return () => cancelAnimationFrame(animationFrameId);
  }, [brands.length, isHovered, isTouching]);

  if (brands.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
      className="py-4"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">{title}</h2>
        <div className="flex items-center gap-3">
          {seeAllLink && (
            <Link href={seeAllLink}>
              <Button variant="link" className="text-primary font-semibold">
                See All
              </Button>
            </Link>
          )}
          <div className="hidden md:flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="h-10 w-10 rounded-full border-border/50 bg-card/80 backdrop-blur-sm hover:bg-card disabled:opacity-30"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="h-10 w-10 rounded-full border-border/50 bg-card/80 backdrop-blur-sm hover:bg-card disabled:opacity-30"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-4 -mx-2 px-2 sm:-mx-4 sm:px-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={() => setIsTouching(true)}
        onTouchEnd={() => setIsTouching(false)}
      >
        {brands.map((brand) => (
          <Link key={brand.id} href={`/delivery/brand/${brand.slug}`}>
            <motion.div
              className="flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px] cursor-pointer"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="group h-full overflow-hidden bg-card border-border/50 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(255,113,0,0.15)] transition-all duration-300 p-4">
                <div className="aspect-square flex items-center justify-center bg-gradient-to-b from-muted/30 to-muted/10 rounded-lg mb-3">
                  {brand.logo ? (
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="text-3xl font-bold text-primary/60">
                      {brand.name.charAt(0)}
                    </div>
                  )}
                </div>
                <h3 className="text-sm md:text-base font-semibold text-center text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {brand.name}
                </h3>
              </Card>
            </motion.div>
          </Link>
        ))}
      </div>
    </motion.section>
  );
}

interface CartItem {
  id: number;
  customerId: number;
  productId: number;
  quantity: number;
  createdAt: Date;
  product: {
    id: number;
    name: string;
    price: string;
    image: string;
    description: string;
    category: string;
  };
}

function ProductCarousel({ 
  title, 
  products, 
  onAddToCart, 
  onQuickView,
  cartItems,
  seeAllLink,
  onUpdateQuantity,
  brandMap,
  featuredMode,
  productLineMap,
}: { 
  title: string;
  products: DeliveryProduct[];
  onAddToCart: (productId: number, purchaseType?: string) => void;
  onQuickView: (product: DeliveryProduct) => void;
  cartItems: Record<number, number>;
  seeAllLink?: string;
  brandMap?: Record<number, DeliveryBrand>;
  onUpdateQuantity?: (productId: number, quantity: number) => void;
  featuredMode?: boolean;
  productLineMap?: Record<number, { slug: string; name: string }>;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isTouching, setIsTouching] = useState(false);
  const isPausedRef = useRef(false);
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [packToggleMap, setPackToggleMap] = useState<Record<number, 'single' | 'pack'>>({});

  useEffect(() => {
    const updates: Record<number, 'single'> = {};
    products.forEach(p => {
      const s = p.stockQuantity ? parseInt(p.stockQuantity) : 0;
      if (p.allowPackToggle && !p.isPackOnly && s < (p.packSize || 1) && packToggleMap[p.id] === 'pack') {
        updates[p.id] = 'single';
      }
    });
    if (Object.keys(updates).length > 0) {
      setPackToggleMap(prev => ({ ...prev, ...updates }));
    }
  }, [products, packToggleMap]);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      isPausedRef.current = true;
      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = setTimeout(() => {
        isPausedRef.current = false;
      }, 5000);

      const containerWidth = scrollRef.current.clientWidth;
      const scrollAmount = Math.max(containerWidth * 0.75, 300);
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(checkScroll, 350);
    }
  };

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', checkScroll);
      return () => ref.removeEventListener('scroll', checkScroll);
    }
  }, [products]);

  useEffect(() => {
    if (isHovered || isTouching || products.length === 0) return;
    
    let animationFrameId: number;
    let lastTime = 0;
    const scrollSpeed = 0.8;
    
    const smoothScroll = (currentTime: number) => {
      if (!scrollRef.current) {
        animationFrameId = requestAnimationFrame(smoothScroll);
        return;
      }

      if (isPausedRef.current) {
        lastTime = 0;
        animationFrameId = requestAnimationFrame(smoothScroll);
        return;
      }
      
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const canScroll = scrollWidth > clientWidth + 10;
      
      if (!canScroll) {
        animationFrameId = requestAnimationFrame(smoothScroll);
        return;
      }
      
      if (lastTime === 0) lastTime = currentTime;
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      
      const isAtEnd = scrollLeft >= scrollWidth - clientWidth - 5;
      
      if (isAtEnd) {
        scrollRef.current.scrollLeft = 0;
      } else {
        scrollRef.current.scrollLeft += scrollSpeed * (deltaTime / 16);
      }
      
      animationFrameId = requestAnimationFrame(smoothScroll);
    };
    
    animationFrameId = requestAnimationFrame(smoothScroll);
    
    return () => cancelAnimationFrame(animationFrameId);
  }, [products.length, isHovered, isTouching]);

  if (products.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
      className="py-2"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">{title}</h2>
        <div className="flex items-center gap-3">
          {seeAllLink && (
            <Link href={seeAllLink}>
              <Button variant="link" className="text-primary font-semibold">
                See All
              </Button>
            </Link>
          )}
          <div className="hidden md:flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="h-10 w-10 rounded-full border-border/50 bg-card/80 backdrop-blur-sm hover:bg-card disabled:opacity-30"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="h-10 w-10 rounded-full border-border/50 bg-card/80 backdrop-blur-sm hover:bg-card disabled:opacity-30"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-2 sm:gap-3 md:gap-4 overflow-x-auto scrollbar-hide pt-2 pb-4 -mx-2 px-2 sm:-mx-4 sm:px-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={() => setIsTouching(true)}
        onTouchEnd={() => setIsTouching(false)}
      >
        {products.map((product) => {
          const stock = product.stockQuantity ? parseInt(product.stockQuantity) : 0;
          const isOutOfStock = stock <= 0;
          const inCart = cartItems[product.id];

          const featuredLink = featuredMode && product.productLineId && productLineMap?.[product.productLineId]
            ? `/delivery/product-line/${productLineMap[product.productLineId].slug}`
            : featuredMode && product.brandId && brandMap?.[product.brandId]
            ? `/delivery/brand/${brandMap[product.brandId].slug}`
            : null;

          const cardContent = (
            <Card className="group h-full flex flex-col bg-card border-border/50 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(255,113,0,0.15)] transition-all duration-300">
                <div className="relative aspect-square overflow-hidden bg-gradient-to-b from-muted/50 to-muted">
                  <img
                    src={product.image || (brandMap && product.brandId ? brandMap[product.brandId]?.logo : null) || '/placeholder-product.svg'}
                    alt={product.name}
                    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.dataset.fallbackAttempted) {
                        target.src = '/placeholder-product.svg';
                        return;
                      }
                      target.dataset.fallbackAttempted = '1';
                      const brandLogo = brandMap && product.brandId ? brandMap[product.brandId]?.logo : null;
                      if (brandLogo) {
                        target.src = brandLogo;
                      } else {
                        target.src = '/placeholder-product.svg';
                      }
                    }}
                  />
                  
                  {product.badge && (
                    <Badge
                      className={`absolute top-2 left-2 sm:top-3 sm:left-3 text-[8px] sm:text-xs px-1 sm:px-2 py-0 sm:py-0.5 leading-tight ${
                        product.badge === 'popular' ? 'bg-primary text-primary-foreground' :
                        product.badge === 'new' ? 'bg-green-500 text-white' :
                        product.badge === 'sale' ? 'bg-red-500 text-white' :
                        'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      {product.badge === 'popular' && <TrendingUp className="w-2 h-2 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />}
                      {product.badge === 'new' && <Sparkles className="w-2 h-2 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />}
                      {product.badge.toUpperCase()}
                    </Badge>
                  )}


                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center backdrop-blur-sm">
                      <Badge variant="destructive" className="text-[8px] sm:text-sm px-1 sm:px-2 py-0 sm:py-0.5">Out of Stock</Badge>
                    </div>
                  )}

                  {!featuredMode && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-2 sm:pb-4 gap-1 sm:gap-2">
                      <Button
                        size="sm"
                        className="bg-black/70 text-white hover:bg-black/90 border-0 text-xs sm:text-sm h-7 sm:h-9 px-2 sm:px-3"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickView(product); }}
                      >
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Quick View</span>
                        <span className="sm:hidden">View</span>
                      </Button>
                      {!isOutOfStock && !inCart && (
                        <Button
                          size="sm"
                          className="bg-primary hover:bg-primary/90 text-xs sm:text-sm h-7 sm:h-9 px-2 sm:px-3"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAddToCart(product.id, product.allowPackToggle ? (packToggleMap[product.id] || (product.isPackOnly ? 'pack' : 'single')) : 'single'); }}
                        >
                          <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          Add
                        </Button>
                      )}
                      {!isOutOfStock && inCart && onUpdateQuantity && (
                        <div className="flex items-center gap-0.5 sm:gap-1 bg-black/70 rounded-lg p-0.5 sm:p-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-white hover:text-white hover:bg-white/20"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onUpdateQuantity(product.id, inCart - 1); }}
                          >
                            <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                          <span className="w-6 sm:w-8 text-center font-bold text-xs sm:text-sm text-white">{inCart}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-white hover:text-white hover:bg-white/20"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onUpdateQuantity(product.id, inCart + 1); }}
                            disabled={inCart >= stock}
                          >
                            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-2 sm:p-3 md:p-4 flex flex-col flex-1">
                  <h3 className="font-semibold text-foreground text-xs sm:text-sm md:text-base line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem] md:min-h-[3rem] mb-0.5">
                    {product.name}
                  </h3>
                  {(() => { const nic = (product as any).nicotineOverride || extractNicLevel(product.name); return nic ? (
                    <span className="inline-block text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-semibold mb-1">{nic}</span>
                  ) : null; })()}

                  <div className="mt-auto pt-1">
                  {product.allowPackToggle && (
                    <div className="mb-1">
                      {!product.isPackOnly ? (() => {
                        const packDisabled = stock < (product.packSize || 1);
                        return (
                        <div className="flex flex-col gap-0.5">
                          <div className="inline-flex self-start items-center rounded-full bg-muted/60 border border-border p-0.5 text-[9px] sm:text-[10px]">
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPackToggleMap(prev => ({ ...prev, [product.id]: 'single' })); }}
                              className={`px-1.5 py-0.5 rounded-full font-medium transition-colors ${(packToggleMap[product.id] || 'single') === 'single' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            >Single</button>
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!packDisabled) setPackToggleMap(prev => ({ ...prev, [product.id]: 'pack' })); }}
                              disabled={packDisabled}
                              className={`px-1.5 py-0.5 rounded-full font-medium transition-colors ${packDisabled ? 'opacity-40 cursor-not-allowed text-muted-foreground' : (packToggleMap[product.id] || 'single') === 'pack' ? 'bg-green-500 text-white' : 'text-muted-foreground hover:text-foreground'}`}
                              title={packDisabled ? 'Not enough stock for a pack' : ''}
                            >Pack</button>
                          </div>
                          <span className={`text-[9px] font-semibold self-end ${(product.packDiscountPercent || 0) > 0 ? 'text-green-500' : 'invisible'}`}>Save {product.packDiscountPercent || 0}%</span>
                        </div>
                        );
                      })() : (
                        <Badge variant="secondary" className="text-[9px] sm:text-[10px] px-1.5 py-0 bg-green-500/20 text-green-400 border-green-500/30">
                          Pack of {product.packSize}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-1 sm:gap-2 flex-wrap">
                      {(() => {
                        const currentMode = product.allowPackToggle
                          ? (product.isPackOnly ? 'pack' : (packToggleMap[product.id] || 'single'))
                          : 'single';

                        if (currentMode === 'pack' && product.allowPackToggle) {
                          const packPrice = Math.round(parseFloat(product.price) * (product.packSize || 1) * (1 - (product.packDiscountPercent || 0) / 100) * 100) / 100;
                          return (
                            <>
                              <span className="text-base sm:text-xl md:text-2xl font-bold text-green-500">
                                ${packPrice.toFixed(2)}
                              </span>
                            </>
                          );
                        }

                        if (product.salePrice) {
                          return (
                            <>
                              <span className="text-base sm:text-xl md:text-2xl font-bold text-primary">
                                ${product.salePrice}
                              </span>
                              <span className="text-[10px] sm:text-xs md:text-sm text-muted-foreground line-through">
                                ${product.price}
                              </span>
                              {product.allowPackToggle && <span className="text-[9px] text-muted-foreground">each</span>}
                            </>
                          );
                        }

                        return (
                          <>
                            <span className="text-base sm:text-xl md:text-2xl font-bold text-primary">
                              ${product.price}
                            </span>
                            {product.allowPackToggle && <span className="text-[9px] text-muted-foreground">each</span>}
                          </>
                        );
                      })()}
                    </div>
                    
                    {inCart && (
                      <Badge variant="secondary" className="bg-primary/20 text-primary text-[10px] sm:text-xs px-1.5 sm:px-2">
                        <ShoppingCart className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                        {inCart}
                      </Badge>
                    )}
                  </div>
                  </div>
                </div>
              </Card>
          );

          return (
            <motion.div
              key={product.id}
              className="flex-shrink-0 w-[145px] sm:w-[180px] md:w-[240px] lg:w-[280px] flex flex-col relative hover:z-10"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              {featuredLink ? (
                <Link href={featuredLink}>{cardContent}</Link>
              ) : (
                cardContent
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}

export default function DeliveryPortal() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { fulfillmentMode: deliveryMethod } = useFulfillment();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'featured' | 'category'>('featured');
  const [searchQuery, setSearchQuery] = useState("");
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [cartJiggle, setCartJiggle] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<DeliveryProduct | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useInactivityTimeout({
    timeoutMinutes: 30,
    warningMinutes: 2,
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/delivery/customers/me", {
          credentials: "include",
        });
        if (!response.ok) {
          setLocation("/delivery/login");
          return;
        }
        const customer = await response.json();
        if (customer && customer.hasSeenWelcomeModal === false) {
          setShowWelcomeModal(true);
        }
      } catch (error) {
        setLocation("/delivery/login");
      }
    };
    checkAuth();
  }, [setLocation]);

  const handleWelcomeClose = async () => {
    setShowWelcomeModal(false);
    try {
      await fetch("/api/delivery/customers/welcome-seen", {
        method: "PATCH",
        credentials: "include",
      });
    } catch {
      // non-critical — modal is already closed
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const categoryParam = params.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, []);

  const { data: products = [], isLoading } = useQuery<DeliveryProduct[]>({
    queryKey: ["/api/delivery/products"],
  });

  const { data: deliveryCategories = [] } = useQuery<DeliveryCategory[]>({
    queryKey: ["/api/delivery/categories"],
  });

  const { data: deliveryBrands = [] } = useQuery<DeliveryBrand[]>({
    queryKey: ["/api/delivery/brands"],
  });

  const { data: deliveryProductLines = [] } = useQuery<{ id: number; name: string; slug: string; brandId: number; isActive: boolean }[]>({
    queryKey: ["/api/delivery/product-lines"],
  });

  const { data: apiCartItems = [] } = useQuery<CartItem[]>({
    queryKey: ["/api/delivery/cart"],
    queryFn: async () => {
      const response = await fetch("/api/delivery/cart", {
        credentials: "include",
      });
      if (!response.ok) {
        return [];
      }
      return response.json();
    },
  });

  const { data: feeData } = useQuery<{
    distance: number;
    feeType: string;
    flatFee: number;
    perMileFee: number;
    perItemFee: number;
    withinDeliveryZone: boolean;
    deliveryRadiusMiles: number;
  }>({
    queryKey: ['/api/delivery/calculate-fee'],
    queryFn: async () => {
      const response = await fetch('/api/delivery/calculate-fee', { credentials: 'include' });
      if (!response.ok) return null;
      return response.json();
    },
    retry: false,
  });

  const { data: feeSettingsFallback } = useQuery<{
    feeType: string;
    flatFee: string;
    perMileFee: string;
    perItemFee: string;
  }>({
    queryKey: ['/api/delivery/fee-settings'],
    enabled: !feeData,
  });

  const { data: siteSettings } = useQuery<{
    freeDeliveryThreshold: string;
  }>({
    queryKey: ['/api/site-settings'],
  });

  const cartItems = useMemo(() => {
    const items: Record<number, number> = {};
    apiCartItems.forEach(item => {
      items[item.productId] = item.quantity;
    });
    return items;
  }, [apiCartItems]);

  const activeCategories = deliveryCategories
    .filter(c => c.isActive)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  const activeBrands = deliveryBrands
    .filter(b => b.isActive)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  const brandMap = useMemo(() => {
    const map: Record<number, DeliveryBrand> = {};
    deliveryBrands.forEach(b => { map[b.id] = b; });
    return map;
  }, [deliveryBrands]);

  const activeProductLines = deliveryProductLines
    .filter(pl => pl.isActive)
    .sort((a, b) => a.name.localeCompare(b.name));

  const productLineMap = useMemo(() => {
    const map: Record<number, { slug: string; name: string }> = {};
    deliveryProductLines.forEach(pl => { map[pl.id] = { slug: pl.slug, name: pl.name }; });
    return map;
  }, [deliveryProductLines]);
  
  const heroProducts = products.filter(p => p.isHeroSlideshow && p.enabled)
    .sort((a, b) => (a.slideshowPosition ?? 0) - (b.slideshowPosition ?? 0));

  useEffect(() => {
    if (heroProducts.length > 1) {
      const interval = setInterval(() => {
        setFeaturedIndex((prev) => (prev + 1) % heroProducts.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [heroProducts.length]);

  const enabledProducts = products.filter(p => p.enabled);

  const filteredProducts = enabledProducts.filter(p => {
    if (selectedCategory && p.category !== selectedCategory) return false;
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getProductsByBrand = (brandId: number) => {
    const brand = deliveryBrands.find(b => b.id === brandId);
    const featuredIds = (brand?.featuredProductIds as number[]) || [];
    
    return filteredProducts
      .filter(p => p.brandId === brandId)
      .sort((a, b) => {
        const aFeatured = featuredIds.includes(a.id);
        const bFeatured = featuredIds.includes(b.id);
        if (aFeatured && !bFeatured) return -1;
        if (!aFeatured && bFeatured) return 1;
        return (a.name || '').localeCompare(b.name || '');
      })
      .slice(0, 12);
  };

  // Get products flagged isFeaturedSlideshow for a category (used in featured view)
  const getFeaturedSlideshowByCategory = (categoryId: number) => {
    const category = deliveryCategories.find(c => c.id === categoryId);
    if (!category) return [];
    return products.filter(p => {
      if (!p.isFeaturedSlideshow || !p.enabled || !p.category) return false;
      const productCat = p.category.toLowerCase().trim();
      const matchNames = new Set<string>();
      const mapped = category.mappedCategories as string[] | undefined;
      if (mapped && mapped.length > 0) {
        mapped.forEach(m => matchNames.add(m.toLowerCase().trim()));
      }
      matchNames.add(category.name.toLowerCase().trim());
      matchNames.add(category.slug.toLowerCase().trim());
      if (matchNames.has(productCat)) return true;
      const norm = productCat.replace(/s$/, '');
      for (const name of matchNames) {
        if (norm === name.replace(/s$/, '')) return true;
        if (productCat.replace(/-/g, '') === name.replace(/-/g, '')) return true;
      }
      return false;
    });
  };

  // Get products for a category - shows featured products if set, otherwise all products
  const getProductsByCategory = (categoryId: number) => {
    const category = deliveryCategories.find(c => c.id === categoryId);
    const featuredIds = (category?.featuredProductIds as number[]) || [];
    
    const categoryProducts = products.filter(p => {
      if (!p.category || !category || !p.enabled) return false;
      
      const productCat = p.category.toLowerCase().trim();
      const matchNames = new Set<string>();
      const mapped = category.mappedCategories as string[] | undefined;
      if (mapped && mapped.length > 0) {
        mapped.forEach(m => matchNames.add(m.toLowerCase().trim()));
      }
      matchNames.add(category.name.toLowerCase().trim());
      matchNames.add(category.slug.toLowerCase().trim());
      
      if (matchNames.has(productCat)) return true;
      const productCatNormalized = productCat.replace(/s$/, '');
      for (const name of matchNames) {
        if (productCatNormalized === name.replace(/s$/, '')) return true;
        if (productCat.replace(/-/g, '') === name.replace(/-/g, '')) return true;
      }
      return false;
    });
    
    // If featured products are set, show only those in order
    if (featuredIds.length > 0) {
      return categoryProducts
        .filter(p => featuredIds.includes(p.id))
        .sort((a, b) => {
          const aIndex = featuredIds.indexOf(a.id);
          const bIndex = featuredIds.indexOf(b.id);
          return aIndex - bIndex;
        })
        .slice(0, 12);
    }
    
    // No featured products set - show all products sorted by brand then name
    return categoryProducts.sort((a, b) => {
      const aBrand = (a.brandId ? brandMap[a.brandId]?.name : '') || '';
      const bBrand = (b.brandId ? brandMap[b.brandId]?.name : '') || '';
      const brandCmp = aBrand.localeCompare(bBrand);
      if (brandCmp !== 0) return brandCmp;
      return (a.name || '').localeCompare(b.name || '');
    }).slice(0, 12);
  };

  const popularProducts = filteredProducts
    .filter(p => p.badge === 'popular')
    .sort((a, b) => {
      const aBrand = (a.brandId ? brandMap[a.brandId]?.name : '') || '';
      const bBrand = (b.brandId ? brandMap[b.brandId]?.name : '') || '';
      const brandCmp = aBrand.localeCompare(bBrand);
      if (brandCmp !== 0) return brandCmp;
      return (a.name || '').localeCompare(b.name || '');
    })
    .slice(0, 12);

  const newProducts = filteredProducts
    .filter(p => p.badge === 'new')
    .sort((a, b) => {
      const aBrand = (a.brandId ? brandMap[a.brandId]?.name : '') || '';
      const bBrand = (b.brandId ? brandMap[b.brandId]?.name : '') || '';
      const brandCmp = aBrand.localeCompare(bBrand);
      if (brandCmp !== 0) return brandCmp;
      return (a.name || '').localeCompare(b.name || '');
    })
    .slice(0, 12);

  const cartTotal = Object.entries(cartItems).reduce((sum, [productId, quantity]) => {
    const product = products.find(p => p.id === parseInt(productId));
    if (!product) return sum;
    const price = product.salePrice ? parseFloat(product.salePrice.toString()) : parseFloat(product.price.toString());
    return sum + price * quantity;
  }, 0);

  const cartItemCount = Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);
  const freeDeliveryThreshold = parseFloat(siteSettings?.freeDeliveryThreshold || "100");
  
  const calculatePortalDeliveryFee = () => {
    if (feeData) {
      const distance = feeData.distance;
      switch (feeData.feeType) {
        case 'flat': return feeData.flatFee;
        case 'per_mile': return feeData.perMileFee * distance;
        case 'per_item': return feeData.perItemFee * cartItemCount;
        case 'combined': return feeData.flatFee + feeData.perMileFee * distance + feeData.perItemFee * cartItemCount;
        default: return feeData.flatFee;
      }
    }
    if (feeSettingsFallback) {
      const flatFee = parseFloat(feeSettingsFallback.flatFee || "0");
      const perItemFee = parseFloat(feeSettingsFallback.perItemFee || "0");
      switch (feeSettingsFallback.feeType) {
        case 'flat': return flatFee;
        case 'per_item': return perItemFee * cartItemCount;
        case 'combined': return flatFee + perItemFee * cartItemCount;
        default: return flatFee;
      }
    }
    return 0;
  };
  const deliveryFee = cartTotal >= freeDeliveryThreshold ? 0 : calculatePortalDeliveryFee();

  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity, purchaseType }: { productId: number; quantity: number; purchaseType?: string }) => {
      const response = await fetch("/api/delivery/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productId, quantity, purchaseType: purchaseType || 'single' }),
      });
      if (!response.ok) {
        throw new Error("Failed to add to cart");
      }
      return response.json();
    },
    onMutate: async ({ productId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/delivery/cart"] });
      const previousCart = queryClient.getQueryData<CartItem[]>(["/api/delivery/cart"]);
      
      queryClient.setQueryData<CartItem[]>(["/api/delivery/cart"], (old = []) => {
        const existing = old.find(item => item.productId === productId);
        if (existing) {
          return old.map(item => 
            item.productId === productId 
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }
        const tempItem: CartItem = {
          id: Date.now(),
          productId,
          quantity,
          customerId: 0,
          createdAt: new Date(),
          product: products.find(p => p.id === productId) as any || {} as any,
        };
        return [...old, tempItem];
      });
      
      return { previousCart };
    },
    onError: (err, variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(["/api/delivery/cart"], context.previousCart);
      }
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery/cart"] });
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ cartItemId, quantity }: { cartItemId: number; quantity: number }) => {
      const response = await fetch(`/api/delivery/cart/${cartItemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ quantity }),
      });
      if (!response.ok) {
        throw new Error("Failed to update cart");
      }
      return response.json();
    },
    onMutate: async ({ cartItemId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/delivery/cart"] });
      const previousCart = queryClient.getQueryData<CartItem[]>(["/api/delivery/cart"]);
      
      queryClient.setQueryData<CartItem[]>(["/api/delivery/cart"], (old = []) => {
        return old.map(item => 
          item.id === cartItemId ? { ...item, quantity } : item
        );
      });
      
      return { previousCart };
    },
    onError: (err, variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(["/api/delivery/cart"], context.previousCart);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery/cart"] });
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (cartItemId: number) => {
      const response = await fetch(`/api/delivery/cart/${cartItemId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to remove from cart");
      }
      return response.json();
    },
    onMutate: async (cartItemId) => {
      await queryClient.cancelQueries({ queryKey: ["/api/delivery/cart"] });
      const previousCart = queryClient.getQueryData<CartItem[]>(["/api/delivery/cart"]);
      
      queryClient.setQueryData<CartItem[]>(["/api/delivery/cart"], (old = []) => {
        return old.filter(item => item.id !== cartItemId);
      });
      
      return { previousCart };
    },
    onError: (err, variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(["/api/delivery/cart"], context.previousCart);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/delivery/cart"] });
    },
  });

  const addToCart = (productId: number, purchaseType?: string) => {
    addToCartMutation.mutate({ productId, quantity: 1, purchaseType: purchaseType || 'single' });
    setCartJiggle(true);
    setTimeout(() => setCartJiggle(false), 600);
    toast({
      title: "Added to cart",
      description: "Item has been added to your cart.",
    });
  };

  const updateCartQuantity = (productId: number, newQuantity: number) => {
    const cartItem = apiCartItems.find(item => item.productId === productId);
    if (!cartItem) return;
    
    if (newQuantity <= 0) {
      removeFromCartMutation.mutate(cartItem.id);
      toast({
        title: "Removed from cart",
        description: "Item has been removed from your cart.",
      });
    } else {
      const diff = newQuantity - cartItem.quantity;
      if (diff > 0) {
        addToCartMutation.mutate({ productId, quantity: diff });
      } else {
        fetch(`/api/delivery/cart/${cartItem.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ quantity: newQuantity }),
        }).then(() => {
          queryClient.invalidateQueries({ queryKey: ["/api/delivery/cart"] });
        });
      }
    }
  };

  const handleQuickViewAddToCart = async (productId: number, quantity: number, purchaseType?: string) => {
    addToCartMutation.mutate({ productId, quantity, purchaseType: purchaseType || 'single' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="delivery-portal">
      <DeliveryHeader
        cartItemCount={cartItemCount}
        onSearch={setSearchQuery}
        searchQuery={searchQuery}
        showSearch={true}
        products={products}
        onProductSelect={setQuickViewProduct}
      />

      {cartTotal < freeDeliveryThreshold ? (
        <div className="bg-muted/50 border-b border-border/50 py-3">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
              <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">
                {cartItemCount === 0 
                  ? `Spend over $${freeDeliveryThreshold} for FREE delivery!`
                  : `Add $${(freeDeliveryThreshold - cartTotal).toFixed(2)} more for FREE delivery!`
                }
              </span>
              <Progress 
                value={(cartTotal / freeDeliveryThreshold) * 100} 
                className="h-2 w-24 sm:w-32 md:w-48"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-green-500/10 border-b border-green-500/30 py-3">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center gap-3">
              <Truck className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-green-500">
                You qualify for FREE delivery!
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Horizontal Categories Navigation with Dropdown */}
      <DeliveryCategoryNav 
        onCategorySelect={(cat) => {
          setSelectedCategory(cat);
          if (cat !== null) {
            setViewMode('category');
          }
        }}
        selectedCategory={selectedCategory}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <main className="flex-1">
        {heroProducts.length > 0 && (
          <section className="relative w-full py-6 overflow-hidden bg-gradient-to-b from-background to-card">
            <div className="container mx-auto px-3 sm:px-6 relative z-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={featuredIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="flex flex-col md:flex-row items-center gap-4 md:max-h-[280px]"
                >
                  <div className="flex-1 order-2 md:order-1">
                    <motion.div
                      initial={{ x: -40, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
                    >
                      <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <Badge className="mb-2 sm:mb-3 bg-primary/20 text-primary border-primary/30 text-[10px] sm:text-xs shadow-lg shadow-primary/20 px-1.5 sm:px-2 py-0 sm:py-0.5">
                          <Sparkles className="w-2 h-2 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                          Featured
                        </Badge>
                      </motion.div>
                      
                      <h1 className="text-base sm:text-2xl md:text-3xl font-black mb-1.5 sm:mb-2 text-foreground leading-tight">
                        {heroProducts[featuredIndex].name}
                      </h1>
                      
                      {heroProducts[featuredIndex].description && 
                       heroProducts[featuredIndex].description !== heroProducts[featuredIndex].name && (
                        <p className="text-[11px] sm:text-base mb-2 sm:mb-4 text-foreground/70 line-clamp-2">
                          {heroProducts[featuredIndex].description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap">
                        <span className="text-base sm:text-xl md:text-2xl font-bold text-primary">
                          ${heroProducts[featuredIndex].salePrice || heroProducts[featuredIndex].price}
                        </span>
                        {heroProducts[featuredIndex].salePrice && (
                          <span className="text-xs sm:text-base text-muted-foreground line-through">
                            ${heroProducts[featuredIndex].price}
                          </span>
                        )}
                        {(() => {
                          const featuredStock = parseInt(heroProducts[featuredIndex].stockQuantity || '0');
                          const isFeaturedOutOfStock = featuredStock <= 0;
                          
                          if (isFeaturedOutOfStock) {
                            return (
                              <Badge variant="destructive" className="text-[9px] sm:text-xs px-1.5 py-0">
                                Out of Stock
                              </Badge>
                            );
                          }
                          
                          const fp = heroProducts[featuredIndex];
                          const fpProductLine = fp.productLineId ? deliveryProductLines.find(pl => pl.id === fp.productLineId) : null;
                          const fpBrand = fp.brandId ? brandMap[fp.brandId] : null;
                          const fpLink = fpProductLine ? `/delivery/product-line/${fpProductLine.slug}` : fpBrand ? `/delivery/brand/${fpBrand.slug}` : `/delivery/shop`;
                          
                          return (
                            <Link href={fpLink}>
                              <Button
                                size="sm"
                                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/30 text-[10px] sm:text-sm h-6 sm:h-9 px-2 sm:px-3"
                              >
                                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-2" />
                                View Products
                              </Button>
                            </Link>
                          );
                        })()}
                      </div>
                    </motion.div>
                  </div>
                  
                  <div className="flex-1 order-1 md:order-2 flex justify-center items-center max-h-[180px] md:max-h-[250px]">
                    <motion.div
                      initial={{ x: 40, opacity: 0, rotate: -5 }}
                      animate={{ 
                        x: 0, 
                        opacity: 1, 
                        rotate: 0,
                        y: [0, -8, 0],
                      }}
                      transition={{ 
                        x: { delay: 0.2, duration: 0.6 },
                        opacity: { delay: 0.2, duration: 0.6 },
                        rotate: { delay: 0.2, duration: 0.6 },
                        y: { duration: 3, repeat: Infinity, ease: 'easeInOut' }
                      }}
                      className="relative"
                    >
                      <motion.div
                        className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"
                        animate={{ scale: [0.8, 1, 0.8], opacity: [0.3, 0.5, 0.3] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      />
                      <img
                        src={heroProducts[featuredIndex].image || (heroProducts[featuredIndex].brandId ? brandMap[heroProducts[featuredIndex].brandId!]?.logo : null) || '/placeholder-product.svg'}
                        alt={heroProducts[featuredIndex].name}
                        className="max-w-[150px] max-h-[160px] md:max-w-[200px] md:max-h-[220px] object-contain relative z-10 drop-shadow-2xl"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.dataset.fallbackAttempted) {
                            target.src = '/placeholder-product.svg';
                            return;
                          }
                          target.dataset.fallbackAttempted = '1';
                          const fp = heroProducts[featuredIndex];
                          const brandLogo = fp.brandId ? brandMap[fp.brandId]?.logo : null;
                          if (brandLogo) {
                            target.src = brandLogo;
                          } else {
                            target.src = '/placeholder-product.svg';
                          }
                        }}
                      />
                    </motion.div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {heroProducts.length > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setFeaturedIndex((prev) => (prev - 1 + heroProducts.length) % heroProducts.length)}
                    className="h-10 w-10 rounded-full bg-card/80 backdrop-blur-sm hover:bg-card border border-border/50"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <div className="flex items-center gap-2">
                    {heroProducts.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setFeaturedIndex(index)}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          index === featuredIndex 
                            ? "w-8 bg-primary" 
                            : "w-2 bg-primary/30 hover:bg-primary/50"
                        }`}
                      />
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setFeaturedIndex((prev) => (prev + 1) % heroProducts.length)}
                    className="h-10 w-10 rounded-full bg-card/80 backdrop-blur-sm hover:bg-card border border-border/50"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              )}
            </div>
          </section>
        )}

        <div className="container mx-auto px-2 sm:px-4 py-4">
          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
              {viewMode === 'featured' ? (
                <>
                  {(() => {
                    const hasFeatured = products.some(p => p.isFeaturedSlideshow && p.enabled);

                    if (!hasFeatured) {
                      return (
                        <div className="text-center py-20">
                          <Sparkles className="w-20 h-20 mx-auto text-muted-foreground/50 mb-6" />
                          <h3 className="text-2xl font-bold text-foreground mb-2">No featured products yet</h3>
                          <p className="text-muted-foreground">Check back soon for our featured selections!</p>
                        </div>
                      );
                    }

                    return (
                      <>
                        {activeCategories.map(cat => {
                          const catProducts = getFeaturedSlideshowByCategory(cat.id);
                          if (!catProducts || catProducts.length === 0) return null;
                          return (
                            <div key={cat.id} className="py-2">
                              <ProductCarousel
                                title={`Featured ${cat.name}`}
                                products={catProducts}
                                onAddToCart={addToCart}
                                onQuickView={setQuickViewProduct}
                                cartItems={cartItems}
                                seeAllLink={`/delivery/category/${cat.slug}`}
                                onUpdateQuantity={updateCartQuantity}
                                brandMap={brandMap}
                                featuredMode={true}
                                productLineMap={productLineMap}
                              />
                            </div>
                          );
                        })}
                      </>
                    );
                  })()}
                </>
              ) : (
                <>
                  {popularProducts.length > 0 && (
                    <ProductCarousel
                      title="Popular Right Now"
                      products={popularProducts}
                      onAddToCart={addToCart}
                      onQuickView={setQuickViewProduct}
                      cartItems={cartItems}
                      onUpdateQuantity={updateCartQuantity}
                      brandMap={brandMap}
                    />
                  )}

                  {newProducts.length > 0 && (
                    <ProductCarousel
                      title="New Arrivals"
                      products={newProducts}
                      onAddToCart={addToCart}
                      onQuickView={setQuickViewProduct}
                      cartItems={cartItems}
                      onUpdateQuantity={updateCartQuantity}
                      brandMap={brandMap}
                    />
                  )}

                  {selectedCategory === null && activeCategories.map((category) => {
                    const categoryProducts = getProductsByCategory(category.id);
                    if (categoryProducts.length === 0) return null;
                    
                    return (
                      <div key={category.id} id={`category-${category.slug}`} className="py-4">
                        <ProductCarousel
                          title={category.name}
                          products={categoryProducts}
                          onAddToCart={addToCart}
                          onQuickView={setQuickViewProduct}
                          cartItems={cartItems}
                          seeAllLink={`/delivery/category/${category.slug}`}
                          onUpdateQuantity={updateCartQuantity}
                          brandMap={brandMap}
                        />
                      </div>
                    );
                  })}

                  {selectedCategory !== null && activeBrands.map((brand) => {
                    const brandProducts = getProductsByBrand(brand.id);
                    if (brandProducts.length === 0) return null;
                    
                    return (
                      <div key={brand.id} id={`brand-${brand.slug}`}>
                        <ProductCarousel
                          title={brand.name}
                          products={brandProducts}
                          onAddToCart={addToCart}
                          onQuickView={setQuickViewProduct}
                          cartItems={cartItems}
                          seeAllLink={`/delivery/brand/${brand.slug}`}
                          onUpdateQuantity={updateCartQuantity}
                          brandMap={brandMap}
                        />
                      </div>
                    );
                  })}

                  {filteredProducts.length === 0 && (
                    <div className="text-center py-20">
                      <Package className="w-20 h-20 mx-auto text-muted-foreground/50 mb-6" />
                      <h3 className="text-2xl font-bold text-foreground mb-2">No products found</h3>
                      <p className="text-muted-foreground">Try adjusting your search or category filter</p>
                      <Button 
                        variant="outline" 
                        className="mt-6"
                        onClick={() => {
                          setSelectedCategory(null);
                          setSearchQuery("");
                        }}
                      >
                        Clear Filters
                      </Button>
                    </div>
                  )}

                  {(() => {
                    const productsInBrandCarousels = new Set(
                      activeBrands.flatMap(brand => 
                        filteredProducts.filter(p => p.brandId === brand.id).map(p => p.id)
                      )
                    );
                    const productsInPopular = new Set(popularProducts.map(p => p.id));
                    const productsInNew = new Set(newProducts.map(p => p.id));
                    
                    const otherProducts = filteredProducts.filter(p => 
                      !productsInBrandCarousels.has(p.id) && 
                      !productsInPopular.has(p.id) && 
                      !productsInNew.has(p.id)
                    );
                    
                    if (otherProducts.length > 0) {
                      return (
                        <ProductCarousel
                          title="All Products"
                          products={otherProducts.slice(0, 20)}
                          onAddToCart={addToCart}
                          onUpdateQuantity={updateCartQuantity}
                          onQuickView={setQuickViewProduct}
                          cartItems={cartItems}
                          brandMap={brandMap}
                        />
                      );
                    }
                    return null;
                  })()}
                </>
              )}
          </div>
        </div>
      </main>

      <ProductQuickView
        product={quickViewProduct}
        open={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={handleQuickViewAddToCart}
      />

      <FloatingCartButton
        cartItems={apiCartItems}
        products={products}
        deliveryMethod={deliveryMethod}
        freeDeliveryThreshold={freeDeliveryThreshold}
        deliveryFee={deliveryFee}
      />
      
      <DeliveryFooter />

      <WelcomeLaunchModal open={showWelcomeModal} onClose={handleWelcomeClose} />
    </div>
  );
}
