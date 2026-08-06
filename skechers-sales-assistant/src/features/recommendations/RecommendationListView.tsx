// Prop-driven recommendations view: loading / error / empty / list.
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/states';
import type { CustomerNeed, Product } from '../../types/db';
import { RecommendationCard } from './RecommendationCard';
import type { Recommendation } from './types';

export type RecommendationStatus = 'loading' | 'error' | 'success';

interface Props {
  status: RecommendationStatus;
  recommendations: Recommendation[];
  selected: Product;
  need: CustomerNeed;
  errorMessage?: string;
  onRetry?: () => void;
}

export function RecommendationListView({ status, recommendations, selected, need, errorMessage, onRetry }: Props) {
  if (status === 'loading') return <LoadingState label="Finding recommendations…" />;
  if (status === 'error') return <ErrorState message={errorMessage ?? 'Could not load recommendations'} onRetry={onRetry} />;
  if (recommendations.length === 0) {
    return <EmptyState title="No approved recommendations">There are no approved recommendations for this product and need yet.</EmptyState>;
  }
  return (
    <ul className="flex flex-col gap-2" aria-label="Recommendations">
      {recommendations.map((rec) => (
        <li key={rec.relationshipId}>
          <RecommendationCard rec={rec} selected={selected} need={need} />
        </li>
      ))}
    </ul>
  );
}
