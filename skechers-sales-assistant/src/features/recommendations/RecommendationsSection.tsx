// Container: loads recommendations for the selected product + need, renders the
// list, and logs an anonymous "displayed" event once per result set.
import { useEffect, useRef } from 'react';
import { logRecommendationsDisplayed } from '../../lib/recommendations';
import type { CustomerNeed, Product } from '../../types/db';
import { useRecommendations } from './hooks';
import { RecommendationListView, type RecommendationStatus } from './RecommendationListView';

export function RecommendationsSection({ product, need }: { product: Product; need: CustomerNeed }) {
  const query = useRecommendations(product, need);
  const loggedKey = useRef<string | null>(null);

  useEffect(() => {
    if (!query.data || query.data.length === 0) return;
    const key = `${product.id}:${need.code}`;
    if (loggedKey.current === key) return; // log once per product+need result set
    loggedKey.current = key;
    void logRecommendationsDisplayed({
      selected: product,
      needId: need.id,
      recommendations: query.data.map((r) => ({ relationshipId: r.relationshipId, product: r.product })),
    });
  }, [query.data, product, need]);

  const status: RecommendationStatus = query.isPending ? 'loading' : query.isError ? 'error' : 'success';

  return (
    <section aria-labelledby="rec-heading" className="flex flex-col gap-3">
      <h2 id="rec-heading" className="text-sm font-semibold text-slate-700">
        Recommended for {need.name}
      </h2>
      <RecommendationListView
        status={status}
        recommendations={query.data ?? []}
        errorMessage={query.error instanceof Error ? query.error.message : undefined}
        onRetry={() => void query.refetch()}
      />
    </section>
  );
}
