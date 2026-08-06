import { useQuery } from '@tanstack/react-query';
import { getProductBySku, searchProducts } from '../../lib/products';

/** Query hook for product search (enabled only when there is a query). */
export function useProductSearch(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: ['products', 'search', q],
    queryFn: () => searchProducts(q),
    enabled: q.length > 0,
    staleTime: 30_000,
  });
}

/** Query hook for a single product by SKU. */
export function useProduct(sku: string | undefined) {
  return useQuery({
    queryKey: ['products', 'bySku', sku],
    queryFn: () => getProductBySku(sku as string),
    enabled: Boolean(sku),
  });
}
