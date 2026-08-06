import { useQuery } from '@tanstack/react-query';
import { CANONICAL_NEEDS, listCustomerNeeds } from '../../lib/customerNeeds';

/**
 * Load active customer needs. Falls back to the canonical 9 needs if the query
 * has not resolved yet, so the selector always has options to render.
 */
export function useCustomerNeeds() {
  const query = useQuery({
    queryKey: ['customer_needs'],
    queryFn: listCustomerNeeds,
    staleTime: 5 * 60_000,
  });
  const needs = query.data && query.data.length > 0 ? query.data : CANONICAL_NEEDS;
  return { needs, ...query };
}
