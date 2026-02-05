import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { ApiBrand } from '@/components/BrandsCarousel';

export interface BrandCategory {
  id: number;
  category: string;
  bgClass?: string;
  displayOrder?: number;
  intervalMs?: number;
  brands: ApiBrand[];
}

/**
 * Hook to fetch all brand categories with their brands
 * Used for displaying brand carousels on the homepage
 */
export function useFeaturedBrands() {
  return useQuery({
    queryKey: ['/api/featured-brands'],
    queryFn: getQueryFn<BrandCategory[]>({ on401: 'returnNull' }),
  });
}

/**
 * Hook to fetch brands by category ID
 */
export function useBrandsByCategory(categoryId: number) {
  return useQuery({
    queryKey: ['/api/brands', categoryId],
    queryFn: getQueryFn<ApiBrand[]>({ on401: 'returnNull' }),
    enabled: !!categoryId,
  });
}

/**
 * Hook to fetch all brand categories
 */
export function useBrandCategories() {
  return useQuery({
    queryKey: ['/api/brand-categories'],
    queryFn: getQueryFn<BrandCategory[]>({ on401: 'returnNull' }),
  });
}