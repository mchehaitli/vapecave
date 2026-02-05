import { lazy, Suspense, memo } from 'react';

// Lazy load the heavy BrandsCarousel component
const BrandsCarousel = lazy(() => import('./BrandsCarousel'));

// Loading skeleton for BrandsCarousel
const BrandsCarouselSkeleton = memo(() => (
  <div className="py-16 bg-gradient-to-b from-gray-900 to-black">
    <div className="container mx-auto px-4">
      <div className="text-center mb-8">
        <div className="h-8 w-64 bg-gray-700 animate-pulse rounded mx-auto mb-4"></div>
        <div className="h-4 w-96 bg-gray-700 animate-pulse rounded mx-auto"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="rounded-xl shadow-lg bg-gray-800 h-64 animate-pulse">
            <div className="p-5 h-16 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700"></div>
            <div className="p-4 flex-grow flex flex-col items-center justify-center">
              <div className="h-16 w-full bg-gray-700 rounded mb-2"></div>
              <div className="h-6 w-32 bg-gray-700 rounded mb-1"></div>
              <div className="h-4 w-48 bg-gray-700 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
));

BrandsCarouselSkeleton.displayName = 'BrandsCarouselSkeleton';

// Optimized lazy brands carousel with error boundary
interface LazyBrandsCarouselProps {
  category: string;
  brands: Array<{
    name: string;
    image: string;
    description: string;
  }>;
  intervalMs?: number;
  bgClass?: string;
  [key: string]: any;
}

const LazyBrandsCarousel = memo((props: LazyBrandsCarouselProps) => (
  <Suspense fallback={<BrandsCarouselSkeleton />}>
    <BrandsCarousel {...props} />
  </Suspense>
));

LazyBrandsCarousel.displayName = 'LazyBrandsCarousel';

export default LazyBrandsCarousel;