import { useQuery } from '@tanstack/react-query';
import { getRecommendationCandidates } from '../../lib/recommendations';
import type { CustomerNeed, Product } from '../../types/db';
import { buildRecommendations } from './engine';

/** Load + build recommendations for a selected product and customer need. */
export function useRecommendations(product: Product | null, need: CustomerNeed | null) {
  return useQuery({
    queryKey: ['recommendations', product?.id, need?.code],
    enabled: Boolean(product && need),
    queryFn: async () => {
      const candidates = await getRecommendationCandidates(product as Product);
      return buildRecommendations(product as Product, (need as CustomerNeed).code, candidates);
    },
  });
}
