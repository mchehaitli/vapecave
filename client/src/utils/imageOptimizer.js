// Image optimization utilities
export const optimizeImage = (src, options = {}) => {
  const { width, height, quality = 85, format = 'webp' } = options;
  
  // For now, return original src since we don't have image optimization service
  // In production, this would integrate with a CDN or image optimization service
  let optimizedSrc = src;
  
  // Add query parameters for optimization (if using a service like Cloudinary)
  if (width || height || quality !== 85) {
    const params = new URLSearchParams();
    if (width) params.append('w', width);
    if (height) params.append('h', height);
    if (quality !== 85) params.append('q', quality);
    
    // For local images, we can't really optimize them without a service
    // But we can at least ensure proper loading
    optimizedSrc = src;
  }
  
  return optimizedSrc;
};

// Create responsive srcSet
export const createSrcSet = (src, widths = [400, 800, 1200]) => {
  return widths.map(width => `${optimizeImage(src, { width })} ${width}w`).join(', ');
};

// Lazy load images with Intersection Observer
export const lazyLoadImages = () => {
  if (!('IntersectionObserver' in window)) {
    // Fallback for browsers without Intersection Observer
    document.querySelectorAll('img[data-src]').forEach(img => {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    });
    return;
  }

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.remove('lazy');
        img.classList.add('loaded');
        observer.unobserve(img);
      }
    });
  }, {
    rootMargin: '50px 0px',
    threshold: 0.01
  });

  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });
};

// Convert images to WebP when supported
export const supportsWebP = () => {
  if (typeof document === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('webp') !== -1;
};

// Get optimal image format
export const getOptimalFormat = (originalSrc) => {
  if (supportsWebP() && !originalSrc.endsWith('.svg')) {
    return originalSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  }
  return originalSrc;
};

// Preload critical images
export const preloadImage = (src) => {
  if (typeof document === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  document.head.appendChild(link);
};

export default { 
  optimizeImage, 
  createSrcSet, 
  lazyLoadImages, 
  supportsWebP, 
  getOptimalFormat, 
  preloadImage 
};