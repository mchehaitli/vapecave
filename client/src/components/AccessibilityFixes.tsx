import { useEffect } from 'react';

// Component to fix common accessibility issues
export const AccessibilityEnhancer = () => {
  useEffect(() => {
    // Fix missing button labels
    const fixButtonLabels = () => {
      const buttons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
      buttons.forEach((button) => {
        const text = button.textContent?.trim();
        if (!text || text.length === 0) {
          // If button has an icon, try to get meaningful label
          const icon = button.querySelector('svg, i, [class*="icon"]');
          if (icon) {
            const title = icon.getAttribute('title') || 
                         icon.getAttribute('data-icon') || 
                         'Interactive button';
            button.setAttribute('aria-label', title);
          } else {
            button.setAttribute('aria-label', 'Interactive button');
          }
        }
      });
    };

    // Fix missing link labels
    const fixLinkLabels = () => {
      const links = document.querySelectorAll('a:not([aria-label]):not([aria-labelledby])');
      links.forEach((link) => {
        const text = link.textContent?.trim();
        const href = link.getAttribute('href');
        if (!text || text.length === 0) {
          if (href) {
            // Try to create meaningful label from href
            let label = href.replace(/^https?:\/\//, '').replace(/\/$/, '');
            if (label.includes('google.com/maps')) {
              label = 'Open in Google Maps';
            } else if (label.includes('apple.com/maps')) {
              label = 'Open in Apple Maps';
            } else if (label.includes('tel:')) {
              label = `Call ${href.replace('tel:', '')}`;
            } else if (label.includes('mailto:')) {
              label = `Email ${href.replace('mailto:', '')}`;
            } else {
              label = `Visit ${label}`;
            }
            link.setAttribute('aria-label', label);
          }
        }
      });
    };

    // Fix ARIA role issues
    const fixAriaRoles = () => {
      // Fix missing required children for ARIA roles
      const menuButtons = document.querySelectorAll('[role="menubutton"]:not([aria-haspopup])');
      menuButtons.forEach(button => {
        button.setAttribute('aria-haspopup', 'menu');
      });

      // Fix missing required parent elements
      const menuItems = document.querySelectorAll('[role="menuitem"]');
      menuItems.forEach(item => {
        const parent = item.parentElement;
        if (parent && !parent.hasAttribute('role')) {
          parent.setAttribute('role', 'menu');
        }
      });

      // Fix list items without list parents
      const listItems = document.querySelectorAll('[role="listitem"]');
      listItems.forEach(item => {
        const parent = item.parentElement;
        if (parent && !parent.hasAttribute('role')) {
          parent.setAttribute('role', 'list');
        }
      });
    };

    // Fix color contrast by adding high contrast mode detection
    const enhanceColorContrast = () => {
      // Detect if user prefers high contrast
      if (window.matchMedia('(prefers-contrast: high)').matches) {
        document.documentElement.classList.add('high-contrast');
      }
      
      // Add focus indicators for better keyboard navigation
      const style = document.createElement('style');
      style.textContent = `
        .high-contrast button,
        .high-contrast a,
        .high-contrast [tabindex] {
          outline: 2px solid #0066cc !important;
          outline-offset: 2px !important;
        }
        
        button:focus-visible,
        a:focus-visible,
        [tabindex]:focus-visible {
          outline: 2px solid #0066cc !important;
          outline-offset: 2px !important;
        }
        
        /* Improve text contrast */
        .high-contrast .text-gray-300 {
          color: #ffffff !important;
        }
        
        .high-contrast .text-gray-400 {
          color: #e5e5e5 !important;
        }
        
        .high-contrast .text-gray-500 {
          color: #cccccc !important;
        }
      `;
      document.head.appendChild(style);
    };

    // Apply all fixes
    fixButtonLabels();
    fixLinkLabels();
    fixAriaRoles();
    enhanceColorContrast();

    // Set up observer for dynamic content
    const observer = new MutationObserver(() => {
      fixButtonLabels();
      fixLinkLabels();
      fixAriaRoles();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  return null;
};

// Skip link component for keyboard navigation
export const SkipLink = () => (
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
               bg-primary text-white px-4 py-2 rounded z-50 text-sm font-medium
               focus:outline-none focus:ring-2 focus:ring-white"
  >
    Skip to main content
  </a>
);

export default AccessibilityEnhancer;