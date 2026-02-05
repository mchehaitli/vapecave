import { useEffect } from 'react';

// Component to inline critical CSS for better performance
export const CriticalCSS = () => {
  useEffect(() => {
    // Inline critical CSS to avoid render-blocking
    const criticalCSS = `
      /* Critical styles for above-the-fold content */
      .font-poppins { font-family: 'Poppins', sans-serif; }
      .font-open-sans { font-family: 'Open Sans', sans-serif; }
      
      /* Loading optimizations */
      .lazy-load {
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
      }
      
      .lazy-load.loaded {
        opacity: 1;
      }
      
      /* Prevent layout shift */
      img {
        height: auto;
        max-width: 100%;
      }
      
      /* Optimize animations */
      .will-change-transform {
        will-change: transform;
      }
      
      .will-change-opacity {
        will-change: opacity;
      }
      
      /* High contrast mode support */
      @media (prefers-contrast: high) {
        .text-gray-300 { color: #ffffff !important; }
        .text-gray-400 { color: #e5e5e5 !important; }
        .text-gray-500 { color: #cccccc !important; }
      }
      
      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
      
      /* Focus indicators for accessibility */
      button:focus-visible,
      a:focus-visible,
      [tabindex]:focus-visible {
        outline: 2px solid #0066cc !important;
        outline-offset: 2px !important;
      }
    `;

    // Add critical CSS to head if not already present
    if (!document.getElementById('critical-css')) {
      const style = document.createElement('style');
      style.id = 'critical-css';
      style.textContent = criticalCSS;
      document.head.insertBefore(style, document.head.firstChild);
    }

    // Remove render-blocking stylesheets after page load
    const optimizeStylesheets = () => {
      const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
      stylesheets.forEach((stylesheet) => {
        const link = stylesheet as HTMLLinkElement;
        if (!link.media || link.media === 'all') {
          link.media = 'print';
          link.onload = () => {
            link.media = 'all';
            link.onload = null;
          };
        }
      });
    };

    // Defer non-critical stylesheets
    window.addEventListener('load', optimizeStylesheets);

    return () => {
      window.removeEventListener('load', optimizeStylesheets);
    };
  }, []);

  return null;
};

export default CriticalCSS;