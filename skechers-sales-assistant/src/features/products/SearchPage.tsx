// Search container: wires the search input + debounce + query to the results view.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useSelection } from '../selection/SelectionContext';
import type { Product } from '../../types/db';
import { SearchBar } from './SearchBar';
import { SearchResultsView, type SearchStatus } from './SearchResultsView';
import { useProductSearch } from './hooks';

export function SearchPage() {
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query, 300);
  const navigate = useNavigate();
  const { setSelectedProduct } = useSelection();
  const search = useProductSearch(debounced);

  const status: SearchStatus =
    debounced.trim() === ''
      ? 'idle'
      : search.isPending
        ? 'loading'
        : search.isError
          ? 'error'
          : 'success';

  const onSelect = (p: Product) => {
    setSelectedProduct(p);
    navigate(`/product/${encodeURIComponent(p.sku)}`);
  };

  return (
    <div className="flex flex-col gap-4">
      <SearchBar value={query} onChange={setQuery} onClear={() => setQuery('')} />
      <SearchResultsView
        status={status}
        query={debounced}
        products={search.data ?? []}
        errorMessage={search.error instanceof Error ? search.error.message : undefined}
        onSelect={onSelect}
        onRetry={() => void search.refetch()}
      />
    </div>
  );
}
