import { useEffect } from 'react';
// import { criticalCSS, inlineCSS } from '@/utils/cssOptimizer';
// import { lazyLoadImages, preloadImage } from '@/utils/imageOptimizer';

// Enhanced performance optimizations
export const usePerformanceOptimizations = () => {
  useEffect(() => {
    // Inline critical CSS immediately
    if (!document.getElementById('critical-css-injected')) {
      const criticalCSS = `body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}`;
      const style = document.createElement('style');
      style.textContent = criticalCSS;
      document.head.appendChild(style);
      
      const marker = document.createElement('meta');
      marker.id = 'critical-css-injected';
      document.head.appendChild(marker);
    }

    // Preload critical resources
    const preloadCriticalResources = () => {
      // Critical images
      const criticalImages = [
        '/vapecave-logo.svg',
        '/vapecave-logo.png'
      ];
      
      criticalImages.forEach(src => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src;
        document.head.appendChild(link);
      });
      
      // DNS prefetch for external domains
      const domains = [
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com',
        'https://cdnjs.cloudflare.com'
      ];

      domains.forEach(domain => {
        const link = document.createElement('link');
        link.rel = 'dns-prefetch';
        link.href = domain;
        document.head.appendChild(link);
      });
    };

    // Defer non-critical resources
    const deferNonCriticalResources = () => {
      // Defer Font Awesome if not already optimized
      const fontAwesome = document.querySelector('link[href*="font-awesome"]') as HTMLLinkElement;
      if (fontAwesome && fontAwesome.rel === 'stylesheet') {
        fontAwesome.rel = 'preload';
        (fontAwesome as any).as = 'style';
        fontAwesome.onload = function() {
          this.rel = 'stylesheet';
        };
      }
    };

    // Initialize lazy loading
    const initLazyLoading = () => {
      // Simple lazy loading implementation
      if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              if (img.dataset.src) {
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
              }
            }
          });
        }, {
          rootMargin: '50px',
        });

        setTimeout(() => {
          document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
          });
        }, 100);
      }
    };

    // Register service worker for caching
    const registerServiceWorker = () => {
      if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('Service Worker registered successfully');
            
            // Update available
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New update available
                    console.log('New version available');
                  }
                });
              }
            });
          })
          .catch((error) => {
            console.log('Service Worker registration failed:', error);
          });
      }
    };

    // Performance monitoring
    const monitorPerformance = () => {
      if ('performance' in window) {
        // Log Core Web Vitals
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          if (navigation) {
            console.log('Performance Metrics:', {
              FCP: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
              LCP: navigation.loadEventEnd - navigation.loadEventStart,
              DOMContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
              LoadComplete: navigation.loadEventEnd - navigation.fetchStart
            });
          }
        }, 1000);
      }
    };

    // Execute optimizations
    preloadCriticalResources();
    deferNonCriticalResources();
    initLazyLoading();
    registerServiceWorker();
    monitorPerformance();

    // Cleanup
    return () => {
      // Cleanup any observers if needed
    };
  }, []);
};

export default usePerformanceOptimizations;