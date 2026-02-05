import { lazy } from 'react';
import { Suspense } from 'react';
import ErrorBoundary from './ErrorBoundary';

// Lazy load heavy components to reduce initial bundle size
const AdminPageLazy = lazy(() => import('../pages/AdminPage'));
const FriscoLocationPageLazy = lazy(() => import('../pages/FriscoLocationPage'));
const ProductsPageLazy = lazy(() => import('../pages/ProductsPage'));
const ContactPageLazy = lazy(() => import('../pages/ContactPage'));

// Loading component for better UX during code splitting
const PageLoadingSkeleton = () => (
  <div className="flex flex-col min-h-screen bg-light animate-pulse">
    <div className="h-16 bg-gray-200 mb-4"></div>
    <div className="flex-1 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="h-8 bg-gray-200 rounded mb-4 w-1/3"></div>
        <div className="h-4 bg-gray-200 rounded mb-2 w-2/3"></div>
        <div className="h-4 bg-gray-200 rounded mb-4 w-1/2"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Wrapper component with Suspense
const withSuspense = (Component: React.ComponentType) => {
  return (props: any) => (
    <Suspense fallback={<PageLoadingSkeleton />}>
      <Component {...props} />
    </Suspense>
  );
};

// Wrapper with both Suspense and ErrorBoundary for critical pages
const withSuspenseAndErrorBoundary = (Component: React.ComponentType) => {
  return (props: any) => (
    <ErrorBoundary>
      <Suspense fallback={<PageLoadingSkeleton />}>
        <Component {...props} />
      </Suspense>
    </ErrorBoundary>
  );
};

export const AdminPage = withSuspenseAndErrorBoundary(AdminPageLazy);
export const FriscoLocationPage = withSuspense(FriscoLocationPageLazy);
export const ProductsPage = withSuspense(ProductsPageLazy);
export const ContactPage = withSuspense(ContactPageLazy);