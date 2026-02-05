// Bundle optimization utilities

// Dynamic import wrapper with error handling
export const dynamicImport = async <T>(
  importFn: () => Promise<{ default: T }>,
  retries = 3
): Promise<T> => {
  for (let i = 0; i < retries; i++) {
    try {
      const module = await importFn();
      return module.default;
    } catch (error) {
      if (i === retries - 1) throw error;
      // Wait before retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  throw new Error('Failed to load module after retries');
};

// Preload modules for better performance
export const preloadModule = (moduleUrl: string) => {
  const link = document.createElement('link');
  link.rel = 'modulepreload';
  link.href = moduleUrl;
  document.head.appendChild(link);
};

// Remove unused CSS classes (basic implementation)
export const purgeUnusedCSS = () => {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'production') {
    return;
  }

  // Get all CSS rules
  const stylesheets = Array.from(document.styleSheets);
  const usedSelectors = new Set<string>();

  // Collect all used classes and IDs
  const elements = document.querySelectorAll('*');
  elements.forEach(element => {
    if (element.className) {
      const classes = element.className.split(' ');
      classes.forEach(cls => {
        if (cls.trim()) {
          usedSelectors.add(`.${cls.trim()}`);
        }
      });
    }
    if (element.id) {
      usedSelectors.add(`#${element.id}`);
    }
  });

  console.log(`Found ${usedSelectors.size} used selectors`);
};

// Optimize third-party scripts
export const optimizeThirdPartyScripts = () => {
  // Delay third-party scripts until user interaction
  const delayScripts = ['googletagmanager.com', 'google-analytics.com'];
  
  const loadScriptOnInteraction = (src: string) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    document.head.appendChild(script);
  };

  const handleInteraction = () => {
    delayScripts.forEach(domain => {
      const scripts = document.querySelectorAll(`script[src*="${domain}"]`);
      scripts.forEach(script => {
        const src = script.getAttribute('src');
        if (src) {
          loadScriptOnInteraction(src);
        }
      });
    });

    // Remove event listeners after first interaction
    ['mousedown', 'touchstart', 'keydown'].forEach(event => {
      document.removeEventListener(event, handleInteraction, true);
    });
  };

  // Add interaction listeners
  ['mousedown', 'touchstart', 'keydown'].forEach(event => {
    document.addEventListener(event, handleInteraction, { once: true, passive: true });
  });
};

// Service Worker registration for caching
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('SW registered: ', registration);
    } catch (registrationError) {
      console.log('SW registration failed: ', registrationError);
    }
  }
};

export default {
  dynamicImport,
  preloadModule,
  purgeUnusedCSS,
  optimizeThirdPartyScripts,
  registerServiceWorker,
};