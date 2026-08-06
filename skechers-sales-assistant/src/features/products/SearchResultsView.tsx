// Prop-driven results view — renders idle / loading / error / empty / results.
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/states';
import type { Product } from '../../types/db';
import { ProductCard } from './ProductCard';

export type SearchStatus = 'idle' | 'loading' | 'error' | 'success';

interface SearchResultsViewProps {
  status: SearchStatus;
  query: string;
  products: Product[];
  errorMessage?: string;
  onSelect: (p: Product) => void;
  onRetry?: () => void;
}

export function SearchResultsView({
  status,
  query,
  products,
  errorMessage,
  onSelect,
  onRetry,
}: SearchResultsViewProps) {
  if (status === 'idle' || query.trim() === '') {
    return <EmptyState title="Search for a product">Enter a SKU, style number, or product name to begin.</EmptyState>;
  }
  if (status === 'loading') return <LoadingState label="Searching products…" />;
  if (status === 'error') return <ErrorState message={errorMessage ?? 'Search failed'} onRetry={onRetry} />;
  if (products.length === 0) {
    return (
      <EmptyState title="Product not found">
        No demo products match “{query}”. Check the code or try a different term.
      </EmptyState>
    );
  }
  return (
    <ul className="flex flex-col gap-2" aria-label="Search results">
      {products.map((p) => (
        <li key={p.id}>
          <ProductCard product={p} onSelect={onSelect} />
        </li>
      ))}
    </ul>
  );
}
