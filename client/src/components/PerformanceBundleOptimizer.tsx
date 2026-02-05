import { memo, lazy, Suspense } from 'react';

// Optimized bundle splitting for heavy components
export const LazyBrandsCarousel = lazy(() => import('./BrandsCarousel'));
export const LazyGoogleMapsIntegration = lazy(() => import('./GoogleMapsIntegration'));
export const LazyFloatingNewsletter = lazy(() => import('./FloatingNewsletter'));

// Performance optimized component wrapper
export const withPerformanceOptimization = <T extends Record<string, any>>(
  Component: React.ComponentType<T>
) => {
  return memo((props: T) => (
    <Suspense fallback={<div className="skeleton h-32 w-full animate-pulse bg-gray-200 rounded" />}>
      <Component {...props} />
    </Suspense>
  ));
};

// Optimized image loading component
interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
}

export const LazyImage = memo(({ 
  src, 
  alt, 
  className = '', 
  fallback = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PC9zdmc+',
  ...props 
}: LazyImageProps) => {
  return (
    <img
      {...props}
      src={src || fallback}
      alt={alt}
      className={`lazy-load ${className}`}
      loading="lazy"
      decoding="async"
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        if (target.src !== fallback) {
          target.src = fallback;
        }
      }}
    />
  );
});

LazyImage.displayName = 'LazyImage';

// Resource preloader for critical assets
export const preloadCriticalResources = () => {
  // Preload critical images
  const criticalImages = [
    '/vapecave-logo.png',
    '/vapecave-logo.svg',
  ];

  criticalImages.forEach((src) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  });
};

// Bundle analyzer helper for development
export const logBundleInfo = () => {
  if (process.env.NODE_ENV === 'development') {
    // Only import if bundle analyzer exists
    console.log('Bundle optimization active');
  }
};

export default memo(({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
});