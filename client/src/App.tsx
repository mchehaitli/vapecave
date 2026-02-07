import { Route, Switch, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import HomePage from "@/pages/HomePage";
import BlogPage from "@/pages/BlogPage";
import BlogPostPage from "@/pages/BlogPostPage";
import FAQPage from "@/pages/FAQPage";
import ReviewsPage from "@/pages/ReviewsPage";
import AdminLoginPage from "@/pages/AdminLoginPage";
import AdminCategoriesBrandsPage from "@/pages/AdminCategoriesBrandsPage";
import AdminBrandImagesPage from "@/pages/AdminBrandImagesPage";
import NotFound from "@/pages/not-found";
import SeoLandingPage from "@/pages/SeoLandingPage";
import DeliveryLanding from "@/pages/DeliveryLanding";
import DeliveryHome from "@/pages/DeliveryHome";
import DeliveryPortal from "@/pages/DeliveryPortal";
import DeliverySignup from "@/pages/DeliverySignup";
import DeliveryLogin from "@/pages/DeliveryLogin";
import DeliveryAccount from "@/pages/DeliveryAccount";
import DeliveryPasswordChange from "@/pages/DeliveryPasswordChange";
import DeliveryPasswordReset from "@/pages/DeliveryPasswordReset";
import DeliverySetPassword from "@/pages/DeliverySetPassword";
import DeliveryCart from "@/pages/DeliveryCart";
import DeliveryCheckout from "@/pages/DeliveryCheckout";
import DeliveryOrderConfirmation from "@/pages/DeliveryOrderConfirmation";
import DeliveryOrderSuccess from "@/pages/DeliveryOrderSuccess";
import DeliveryHelp from "@/pages/DeliveryHelp";
import DeliveryBrandPage from "@/pages/DeliveryBrandPage";
import DeliveryBrandsPage from "@/pages/DeliveryBrandsPage";
import DeliveryProductLinePage from "@/pages/DeliveryProductLinePage";
import DeliveryCategoryPage from "@/pages/DeliveryCategoryPage";
import DeliverySalePage from "@/pages/DeliverySalePage";
import TermsPage from "@/pages/TermsPage";
import PrivacyPage from "@/pages/PrivacyPage";
import RefundPolicyPage from "@/pages/RefundPolicyPage";
import SignupPage from "@/pages/SignupPage";
import AgeVerificationModal from "@/components/AgeVerificationModal";
import PageTransition from "@/components/PageTransition";
import { AccessibilityEnhancer, SkipLink } from "@/components/AccessibilityFixes";
import { usePerformanceOptimizations } from "@/hooks/usePerformanceOptimizations";
import CriticalCSS from "@/components/CriticalCSS";
import { preloadCriticalResources } from "@/components/PerformanceBundleOptimizer";
import BundleAnalyzer from "@/components/BundleAnalyzer";
// Lazy load heavy components to improve performance
import {
  FriscoLocationPage,
  ContactPage,
  ProductsPage,
  AdminPage,
} from "@/components/LazyComponents";

// Custom hook to scroll to top on route changes with smooth animation
function useScrollToTop() {
  const [location] = useLocation();
  
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, [location]);
  
  return null;
}

function Router() {
  // Use the scroll-to-top hook
  useScrollToTop();
  
  // Get current location for AnimatePresence
  const [location] = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <PageTransition key={location}>
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/locations/frisco" component={FriscoLocationPage} />
          <Route path="/products" component={ProductsPage} />
          <Route path="/contact" component={ContactPage} />
          <Route path="/blog" component={BlogPage} />
          <Route path="/blog/:slug" component={BlogPostPage} />
          <Route path="/faq" component={FAQPage} />
          <Route path="/reviews" component={ReviewsPage} />
          <Route path="/signup" component={SignupPage} />
          <Route path="/admin/login" component={AdminLoginPage} />
          <Route path="/admin/categories-brands" component={AdminCategoriesBrandsPage} />
          <Route path="/admin/brand-images" component={AdminBrandImagesPage} />
          <Route path="/admin" component={AdminPage} />
          <Route path="/delivery" component={DeliveryLanding} />
          <Route path="/delivery/home" component={DeliveryHome} />
          <Route path="/delivery/shop" component={DeliveryPortal} />
          <Route path="/delivery/account" component={DeliveryAccount} />
          <Route path="/register" component={DeliverySignup} />
          <Route path="/signin" component={DeliveryLogin} />
          <Route path="/delivery/login" component={DeliveryLogin} />
          <Route path="/delivery/set-password" component={DeliverySetPassword} />
          <Route path="/delivery/change-password" component={DeliveryPasswordChange} />
          <Route path="/delivery/reset-password" component={DeliveryPasswordReset} />
          <Route path="/delivery/cart" component={DeliveryCart} />
          <Route path="/delivery/checkout" component={DeliveryCheckout} />
          <Route path="/delivery/order-success" component={DeliveryOrderSuccess} />
          <Route path="/delivery/order-confirmation/:id" component={DeliveryOrderConfirmation} />
          <Route path="/delivery/help" component={DeliveryHelp} />
          <Route path="/delivery/brands" component={DeliveryBrandsPage} />
          <Route path="/delivery/sale" component={DeliverySalePage} />
          <Route path="/delivery/brand/:slug">{(params) => <DeliveryBrandPage params={params} />}</Route>
          <Route path="/delivery/product-line/:slug">{(params) => <DeliveryProductLinePage params={params} />}</Route>
          <Route path="/delivery/category/:slug" component={DeliveryCategoryPage} />
          <Route path="/terms" component={TermsPage} />
          <Route path="/privacy" component={PrivacyPage} />
          <Route path="/refund-policy" component={RefundPolicyPage} />
          <Route path="/disposables">
            {() => (
              <SeoLandingPage
                title="Best Disposable Vapes in Frisco, TX | Vape Cave"
                headline="Frisco's #1 Destination for Geek Bar, Raz & Lost Mary"
                content="Looking for disposable vapes in Frisco? We stock the largest inventory on Main St. From the Geek Bar Pulse to the latest Lost Mary, find your favorite flavors here."
              />
            )}
          </Route>
          <Route path="/thca-hemp">
            {() => (
              <SeoLandingPage
                title="THCA Flower & Delta-8 Shop Frisco | Vape Cave"
                headline="Premium THCA Flower & Legal Delta-8 in Frisco"
                content="Your trusted source for lab-tested THCA and Hemp products in Downtown Frisco. We carry fresh flower, pre-rolls, and gummies that are 100% legal and potent."
              />
            )}
          </Route>
          <Route path="/kratom-cbd">
            {() => (
              <SeoLandingPage
                title="Kratom & CBD Store Frisco | High Potency"
                headline="Top-Shelf Kratom & CBD Oil in Frisco"
                content="From Maeng Da to Bali, find the best Kratom strains right here in Frisco. We also carry premium CBD oils and topicals for relief."
              />
            )}
          </Route>
          <Route path="/glass-hookah">
            {() => (
              <SeoLandingPage
                title="Glass Pipes & Hookah Gallery Frisco | Vape Cave"
                headline="Hand-Blown Glass & Premium Hookah Tobacco"
                content="Visit our glass gallery on Main St. We carry RooR, Toro, and premier Hookah shisha brands like Al Fakher and Starbuzz."
              />
            )}
          </Route>
          <Route path="/vape-juice">
            {() => (
              <SeoLandingPage
                title="Premium E-Liquid & Vape Juice Frisco | Vape Cave"
                headline="The Best Vape Juice Selection in Frisco, TX"
                content="Salt Nic or Freebase? We have every flavor imaginable at Vape Cave Frisco. Stocking premium brands like Naked 100, Juice Head, and more."
              />
            )}
          </Route>
          <Route component={NotFound} />
        </Switch>
      </PageTransition>
    </AnimatePresence>
  );
}

function App() {
  const [showAgeVerification, setShowAgeVerification] = useState(false);
  
  // Apply performance optimizations
  usePerformanceOptimizations();
  
  // Preload critical resources
  useEffect(() => {
    preloadCriticalResources();
  }, []);

  useEffect(() => {
    const ageVerified = localStorage.getItem("ageVerified");
    if (!ageVerified) {
      setShowAgeVerification(true);
    }
  }, []);

  const handleVerifyAge = (isVerified: boolean) => {
    if (isVerified) {
      localStorage.setItem("ageVerified", "true");
      setShowAgeVerification(false);
    } else {
      window.location.href = "https://www.google.com";
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <CriticalCSS />
          <SkipLink />
          <AccessibilityEnhancer />
          <BundleAnalyzer />

          <main id="main-content">
            <Router />
          </main>
          <Toaster />
          {showAgeVerification && <AgeVerificationModal onVerify={handleVerifyAge} />}
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
