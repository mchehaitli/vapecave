import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, User, LogOut, Search, Menu, X, ChevronDown, Package, ArrowLeft, Sun, Moon, HelpCircle, ExternalLink } from "lucide-react";
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
    <header className="bg-card border-b sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto pl-2 pr-4">
        <div className="h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {showBackButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (window.history.length > 1) {
                    window.history.back();
                  } else {
                    setLocation("/delivery/home");
                  }
                }}
                data-testid="back-button"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <Link href="/delivery/home" className="flex items-center gap-4 font-bold text-xl hover:opacity-80 transition-opacity">
              <img 
                src="/logo-orange.png" 
                alt="Vape Cave Smoke & Stuff" 
                className="h-12 w-auto scale-x-[1.15]"
              />
              <Badge variant="secondary" className="hidden sm:inline-flex text-xs">
                Delivery
              </Badge>
            </Link>
            
            <nav className="hidden md:flex items-center gap-1 ml-6">
              <Link href="/delivery/home">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`font-semibold transition-all ${
                      location === '/delivery/home' || location === '/delivery'
                        ? 'text-primary bg-primary/15 shadow-[0_0_12px_rgba(255,113,0,0.4)] border border-primary/40'
                        : 'hover:text-primary hover:bg-primary/10'
                    }`}
                  >
                    Home
                  </Button>
                </motion.div>
              </Link>
              <Link href="/delivery/shop">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`font-semibold transition-all ${
                      location === '/delivery/shop'
                        ? 'text-primary bg-primary/15 shadow-[0_0_12px_rgba(255,113,0,0.4)] border border-primary/40'
                        : 'hover:text-primary hover:bg-primary/10'
                    }`}
                  >
                    Shop
                  </Button>
                </motion.div>
              </Link>
            </nav>
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
                      className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden"
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
                              alt={product.name}
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

          <div className="flex items-center gap-2">
            {showSearch && (
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                data-testid="mobile-search-toggle"
              >
                <Search className="h-5 w-5" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              data-testid="theme-toggle"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setLocation("/delivery/cart")}
              data-testid="header-cart-button"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
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
                    className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden max-h-64 overflow-y-auto"
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
                            alt={product.name}
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
                  setLocation("/delivery/home");
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 w-full px-3 py-2 rounded-md transition-all duration-200 font-semibold ${
                  location === '/delivery/home' || location === '/delivery'
                    ? 'text-primary bg-primary/15 shadow-[0_0_12px_rgba(255,113,0,0.4)] border border-primary/40'
                    : 'hover:bg-primary/10 hover:text-primary'
                }`}
                whileTap={{ scale: 0.98 }}
                data-testid="mobile-menu-home"
              >
                <span>Home</span>
              </motion.button>
              <motion.button
                variants={menuItemVariants}
                onClick={() => {
                  setLocation("/delivery/shop");
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 w-full px-3 py-2 rounded-md transition-all duration-200 font-semibold ${
                  location === '/delivery/shop'
                    ? 'text-primary bg-primary/15 shadow-[0_0_12px_rgba(255,113,0,0.4)] border border-primary/40'
                    : 'hover:bg-primary/10 hover:text-primary'
                }`}
                whileTap={{ scale: 0.98 }}
                data-testid="mobile-menu-shop"
              >
                <span>Shop</span>
              </motion.button>
              <motion.div variants={menuItemVariants} className="border-t my-2" />
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
                  setLocation("/delivery/cart");
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-md hover:bg-primary/10 hover:text-primary transition-all duration-200"
                whileTap={{ scale: 0.98 }}
                data-testid="mobile-menu-cart"
              >
                <ShoppingCart className="h-5 w-5" />
                <span>Cart</span>
                {cartItemCount > 0 && (
                  <Badge variant="secondary" className="ml-auto bg-primary/20 text-primary">
                    {cartItemCount}
                  </Badge>
                )}
              </motion.button>
              <motion.button
                variants={menuItemVariants}
                onClick={() => {
                  toggleTheme();
                }}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-md hover:bg-primary/10 hover:text-primary transition-all duration-200"
                whileTap={{ scale: 0.98 }}
                data-testid="mobile-menu-theme"
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
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
