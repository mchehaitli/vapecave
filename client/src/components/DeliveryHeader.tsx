import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, User, LogOut, Search, Menu, X, ChevronDown, Package, ArrowLeft, Sun, Moon, HelpCircle, ExternalLink, Truck, Store } from "lucide-react";
import type { DeliveryProduct } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import { useFulfillment } from "@/contexts/FulfillmentContext";

import logo_dark from "../assets/white_logo_transparent_background.webp";
import logo_light from "../assets/white_logo_transparent_background.webp";

const mobileMenuVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: {
    opacity: 1,
    height: "auto",
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
};

const menuItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

interface DeliveryHeaderProps {
  cartItemCount?: number;
  onSearch?: (query: string) => void;
  searchQuery?: string;
  showSearch?: boolean;
  customerName?: string;
  showBackButton?: boolean;
  products?: DeliveryProduct[];
  onProductSelect?: (product: DeliveryProduct) => void;
}

export function DeliveryHeader({
  cartItemCount = 0,
  onSearch,
  searchQuery = "",
  showSearch = true,
  customerName,
  showBackButton = false,
  products = [],
  onProductSelect,
}: DeliveryHeaderProps) {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  const suggestions = searchQuery.length >= 2
    ? products
        .filter(p => p.enabled && p.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 6)
    : [];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node) &&
          mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSuggestionClick = (product: DeliveryProduct) => {
    setShowSuggestions(false);
    onSearch?.(product.name);
    onProductSelect?.(product);
  };
  
  const { fulfillmentMode, setFulfillmentMode } = useFulfillment();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/delivery/logout", {
        method: "POST",
        credentials: "include",
      });
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully.",
      });
      setLocation("/delivery/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="bg-[#c0392b] text-white text-center py-1.5 text-xs md:text-sm font-bold tracking-wide z-[60] relative">
        WARNING: SOME OF THESE PRODUCTS CONTAIN NICOTINE. NICOTINE IS AN ADDICTIVE CHEMICAL.
      </div>
      <header className="bg-card border-b sticky top-0 z-[60] shadow-sm">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
              {showBackButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0"
                  onClick={() => {
                    if (window.history.length > 1) {
                      window.history.back();
                    } else {
                      setLocation("/delivery/shop");
                    }
                  }}
                  data-testid="back-button"
                >
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              )}
              <Link href="/delivery/shop" className="flex items-center gap-2 sm:gap-4 font-bold text-xl hover:opacity-80 transition-opacity min-w-0">
                <img 
                  src={theme === "light" ? logo_light : logo_dark} 
                  alt="Vape Cave Frisco - Logo" 
                  width={3400}
                  height={842}
                  loading="eager"
                  decoding="async"
                  className="h-7 sm:h-12 w-auto flex-shrink-0"
                />
              </Link>
              <div
                className="relative flex items-center rounded-full bg-muted/60 border border-border p-0.5"
                role="radiogroup"
                aria-label="Fulfillment method"
              >
                <motion.div
                  className={`absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-full ${
                    fulfillmentMode === 'delivery' ? 'bg-green-500' : 'bg-yellow-400'
                  }`}
                  initial={false}
                  animate={{ x: fulfillmentMode === 'delivery' ? 0 : '100%' }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  style={{ left: '2px' }}
                />
                <button
                  onClick={() => setFulfillmentMode('delivery')}
                  role="radio"
                  aria-checked={fulfillmentMode === 'delivery'}
                  aria-label="Delivery"
                  className={`relative z-10 flex items-center justify-center gap-1 sm:gap-1.5 rounded-full px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium transition-colors min-h-[36px] sm:min-h-[38px] ${
                    fulfillmentMode === 'delivery'
                      ? 'text-white'
                      : 'text-muted-foreground hover:text-foreground cursor-pointer'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Delivery</span>
                </button>
                <button
                  onClick={() => setFulfillmentMode('pickup')}
                  role="radio"
                  aria-checked={fulfillmentMode === 'pickup'}
                  aria-label="Pickup"
                  className={`relative z-10 flex items-center justify-center gap-1 sm:gap-1.5 rounded-full px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium transition-colors min-h-[36px] sm:min-h-[38px] ${
                    fulfillmentMode === 'pickup'
                      ? 'text-black'
                      : 'text-muted-foreground hover:text-foreground cursor-pointer'
                  }`}
                >
                  <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Pickup</span>
                </button>
              </div>
              
              
            </div>

            {showSearch && (
              <div className="hidden md:flex flex-1 max-w-md mx-4" ref={searchRef}>
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 z-10" />
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => {
                      onSearch?.(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="pl-10 w-full"
                    data-testid="header-search-input"
                  />
                  <AnimatePresence>
                    {showSuggestions && suggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-[9999] overflow-hidden"
                      >
                        {suggestions.map((product, index) => (
                          <motion.button
                            key={product.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03, duration: 0.2 }}
                            onClick={() => handleSuggestionClick(product)}
                            className="flex items-center gap-3 w-full px-4 py-3 hover:bg-primary/10 transition-all duration-200 text-left"
                            whileHover={{ x: 4 }}
                          >
                            {product.image && (
                              <img 
                                src={product.image} 
                                alt={`Vape Cave Frisco - ${product.name}`}
                                width={40}
                                height={40}
                                loading="lazy"
                                decoding="async"
                                className="w-10 h-10 object-cover rounded"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">{product.name}</p>
                              <p className="text-sm text-primary">${product.salePrice || product.price}</p>
                            </div>
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            <div className="flex items-center gap-0.5 sm:gap-2">
              {showSearch && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-8 w-8 sm:h-10 sm:w-10"
                  onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                  data-testid="mobile-search-toggle"
                >
                  <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-10 sm:w-10"
                onClick={toggleTheme}
                data-testid="theme-toggle"
              >
                {theme === "dark" ? <Sun className="h-4 w-4 sm:h-5 sm:w-5" /> : <Moon className="h-4 w-4 sm:h-5 sm:w-5" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="relative h-8 w-8 sm:h-10 sm:w-10 mr-1 sm:mr-0"
                onClick={() => setLocation("/delivery/cart")}
                data-testid="header-cart-button"
              >
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] sm:text-xs font-bold rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center">
                    {cartItemCount > 99 ? "99+" : cartItemCount}
                  </span>
                )}
              </Button>

              <div className="hidden sm:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2" data-testid="account-dropdown-trigger">
                      <User className="h-5 w-5" />
                      <span className="hidden lg:inline max-w-[120px] truncate">
                        {customerName || "Account"}
                      </span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setLocation("/delivery/account")} data-testid="dropdown-account">
                      <User className="h-4 w-4 mr-2" />
                      My Account
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation("/delivery/help")} data-testid="dropdown-help">
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Help
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLocation("/")} data-testid="dropdown-main-site">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Main Website
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive" data-testid="dropdown-logout">
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="sm:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                data-testid="mobile-menu-toggle"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {mobileSearchOpen && showSearch && (
            <div className="md:hidden pb-3" ref={mobileSearchRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 z-10" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => {
                    onSearch?.(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="pl-10 w-full"
                  autoFocus
                  data-testid="mobile-search-input"
                />
                <AnimatePresence>
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-[9999] overflow-hidden max-h-64 overflow-y-auto"
                    >
                      {suggestions.map((product, index) => (
                        <motion.button
                          key={product.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03, duration: 0.2 }}
                          onClick={() => handleSuggestionClick(product)}
                          className="flex items-center gap-3 w-full px-4 py-3 hover:bg-primary/10 transition-all duration-200 text-left"
                          whileHover={{ x: 4 }}
                        >
                          {product.image && (
                            <img 
                              src={product.image} 
                              alt={`Vape Cave Frisco - ${product.name}`}
                              width={40}
                              height={40}
                              loading="lazy"
                              decoding="async"
                              className="w-10 h-10 object-cover rounded"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{product.name}</p>
                            <p className="text-sm text-primary">${product.salePrice || product.price}</p>
                          </div>
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              variants={mobileMenuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="sm:hidden border-t bg-card overflow-hidden"
            >
              <nav className="container mx-auto px-4 py-3 space-y-1">
                
                <motion.button
                  variants={menuItemVariants}
                  onClick={() => {
                    setLocation("/delivery/account");
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-md hover:bg-primary/10 hover:text-primary transition-all duration-200"
                  whileTap={{ scale: 0.98 }}
                  data-testid="mobile-menu-account"
                >
                  <User className="h-5 w-5" />
                  <span>My Account</span>
                </motion.button>
                <motion.button
                  variants={menuItemVariants}
                  onClick={() => {
                    setLocation("/delivery/help");
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-md hover:bg-primary/10 hover:text-primary transition-all duration-200"
                  whileTap={{ scale: 0.98 }}
                  data-testid="mobile-menu-help"
                >
                  <HelpCircle className="h-5 w-5" />
                  <span>Help</span>
                </motion.button>
                <motion.button
                  variants={menuItemVariants}
                  onClick={() => {
                    setLocation("/");
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-md hover:bg-primary/10 hover:text-primary transition-all duration-200"
                  whileTap={{ scale: 0.98 }}
                  data-testid="mobile-menu-main-site"
                >
                  <ExternalLink className="h-5 w-5" />
                  <span>Main Website</span>
                </motion.button>
                <motion.div variants={menuItemVariants} className="border-t my-2" />
                <motion.button
                  variants={menuItemVariants}
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-md hover:bg-destructive/10 text-destructive transition-all duration-200"
                  whileTap={{ scale: 0.98 }}
                  data-testid="mobile-menu-logout"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </motion.button>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
