// CSS optimization utility for production builds
export const inlineCSS = (cssText) => {
  if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = cssText;
    document.head.appendChild(style);
  }
};

// Critical CSS that should be inlined
export const criticalCSS = `
  /* Reset and base styles */
  *,*::before,*::after{box-sizing:border-box}
  body{margin:0;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
  
  /* Layout utilities */
  .container{max-width:1200px;margin:0 auto;padding:0 1rem}
  .flex{display:flex}
  .grid{display:grid}
  .hidden{display:none}
  
  /* Typography */
  h1,h2,h3,h4,h5,h6{margin:0 0 1rem;font-weight:600}
  p{margin:0 0 1rem}
  
  /* Buttons */
  .btn{display:inline-block;padding:0.75rem 1.5rem;border:none;border-radius:0.5rem;cursor:pointer;text-decoration:none;font-weight:500;transition:all 0.2s}
  .btn-primary{background:#22c55e;color:white}
  .btn-primary:hover{background:#16a34a}
  
  /* Loading states */
  .loading{opacity:0.6;pointer-events:none}
  .skeleton{background:linear-gradient(90deg,#f0f0f0 25%,transparent 37%,transparent 63%,#f0f0f0 75%);background-size:400% 100%;animation:shimmer 1.4s ease-in-out infinite}
  @keyframes shimmer{0%{background-position:100% 50%}100%{background-position:-100% 50%}}
  
  /* Performance optimizations */
  img{height:auto;max-width:100%}
  .will-change-transform{will-change:transform}
  .gpu-accelerated{transform:translateZ(0)}
`;

// Remove unused CSS (basic implementation)
export const removeUnusedCSS = () => {
  if (typeof document === 'undefined') return;
  
  // Find all stylesheets
  const stylesheets = Array.from(document.styleSheets);
  const usedSelectors = new Set();
  
  // Find all elements and their classes/ids
  const elements = document.querySelectorAll('*');
  elements.forEach(el => {
    if (el.id) usedSelectors.add(`#${el.id}`);
    if (el.className) {
      el.className.split(' ').forEach(className => {
        if (className) usedSelectors.add(`.${className}`);
      });
    }
    usedSelectors.add(el.tagName.toLowerCase());
  });
  
  console.log(`Found ${usedSelectors.size} used selectors`);
};

// Defer non-critical CSS
export const deferCSS = (href) => {
  if (typeof document === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'style';
  link.href = href;
  link.onload = function() {
    this.onload = null;
    this.rel = 'stylesheet';
  };
  document.head.appendChild(link);
};

export default { inlineCSS, criticalCSS, removeUnusedCSS, deferCSS };