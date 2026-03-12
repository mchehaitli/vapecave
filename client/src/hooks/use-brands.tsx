import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';

export interface FeaturedBrandCategory {
  id: number;
  category: string;
  brands: Array<{
    name: string;
    logo: string | null;
  }>;
}

export function useFeaturedBrands() {
  return useQuery({
    queryKey: ['/api/featured-brands'],
    queryFn: getQueryFn<FeaturedBrandCategory[]>({ on401: 'returnNull' }),
  });
}