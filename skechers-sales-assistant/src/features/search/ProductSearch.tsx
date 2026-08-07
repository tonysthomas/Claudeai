// Live product search: local/DB search first, and on a miss for a valid Skechers
// SKU it triggers on-demand ingestion (backend endpoint in production; the
// authorized derive+recommend pipeline client-side in the offline demo — never
// scraping skechers.com). The ingested product + its auto-generated
// recommendations render immediately.
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useSelection } from '../selection/SelectionContext';
import { formatPrice } from '../../lib/format';
import { isLikelySku } from '../../lib/ingest/skuParse';
import { liveIngestSku, getProductBySku } from '../../lib/products';
import { getRecommendationCandidates } from '../../lib/recommendations';
import type { Product } from '../../types/db';
import type { RecommendationCandidate } from '../recommendations/types';
import { LoadingState } from '../../components/ui/states';
import { ProductCard } from '../products/ProductCard';
import { SearchBar } from '../products/SearchBar';
import { SearchResultsView, type SearchStatus } from '../products/SearchResultsView';
import { useProductSearch } from '../products/hooks';

const TYPE_LABEL: Record<string, string> = {
  upgrade_to: 'Premium upgrade',
  alternative_to: 'Alternative',
  pairs_with: 'Add-on',
  recommended_add_on: 'Shoe care',
  lower_price_option: 'Lower-price option',
  higher_price_option: 'Higher-tier option',
};

interface LiveState {
  sku: string;
  status: 'loading' | 'done' | 'none';
  product: Product | null;
  recs: RecommendationCandidate[];
}

export function ProductSearch() {
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query, 300);
  const navigate = useNavigate();
  const { setSelectedProduct } = useSelection();
  const search = useProductSearch(debounced);
  const [live, setLive] = useState<LiveState | null>(null);
  const attemptedRef = useRef<string | null>(null);

  const localResults = search.data ?? [];
  const searchSettled = debounced.trim() !== '' && !search.isPending && !search.isError;
  const missNeedsIngest = searchSettled && localResults.length === 0 && isLikelySku(debounced);

  useEffect(() => {
    if (!missNeedsIngest) return;
    if (attemptedRef.current === debounced) return; // already attempted this SKU
    attemptedRef.current = debounced;
    let cancelled = false;
    setLive({ sku: debounced, status: 'loading', product: null, recs: [] });
    void (async () => {
      const ingest = typeof liveIngestSku === 'function' ? liveIngestSku : undefined;
      const product = ingest ? await ingest(debounced) : await getProductBySku(debounced);
      if (cancelled) return;
      if (!product) {
        setLive({ sku: debounced, status: 'none', product: null, recs: [] });
        return;
      }
      const recs = await getRecommendationCandidates(product);
      if (cancelled) return;
      setLive({ sku: debounced, status: 'done', product, recs });
    })();
    return () => {
      cancelled = true;
    };
  }, [missNeedsIngest, debounced]);

  const onSelect = (p: Product) => {
    setSelectedProduct(p);
    navigate(`/product/${encodeURIComponent(p.sku)}`);
  };

  const status: SearchStatus =
    debounced.trim() === '' ? 'idle' : search.isPending ? 'loading' : search.isError ? 'error' : 'success';

  // Decide what to render below the search bar.
  let body: React.ReactNode;
  if (localResults.length > 0 || status !== 'success') {
    body = (
      <SearchResultsView
        status={status}
        query={debounced}
        products={localResults}
        errorMessage={search.error instanceof Error ? search.error.message : undefined}
        onSelect={onSelect}
        onRetry={() => void search.refetch()}
      />
    );
  } else if (missNeedsIngest && (!live || live.sku !== debounced || live.status === 'loading')) {
    body = <LoadingState label={`Retrieving Skechers SKU ${debounced.trim().toUpperCase()}...`} />;
  } else if (live && live.sku === debounced && live.status === 'done' && live.product) {
    body = <LiveResult product={live.product} recs={live.recs} onSelect={onSelect} />;
  } else {
    body = (
      <SearchResultsView status="success" query={debounced} products={[]} onSelect={onSelect} />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <SearchBar value={query} onChange={setQuery} onClear={() => setQuery('')} />
      {body}
    </div>
  );
}

function LiveResult({
  product,
  recs,
  onSelect,
}: {
  product: Product;
  recs: RecommendationCandidate[];
  onSelect: (p: Product) => void;
}) {
  const derived = product.data_status === 'demo' && product.approval_status === 'demo';
  const badges = [product.technology, product.gender, product.activity_type].filter(Boolean) as string[];
  return (
    <section data-testid="live-ingest-result" aria-label="Live ingested product" className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
          Live-ingested
        </span>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700" title="Synthetic demo data — not official Skechers data">
          DEMO
        </span>
        {derived && <span className="text-[10px] text-slate-400">derived from SKU — pending authorized sync</span>}
      </div>

      <ProductCard product={product} onSelect={onSelect} />

      {/* Technology / segment badges + regional price */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-sm font-semibold text-slate-800">{formatPrice(product.price, product.currency)}</span>
        {badges.map((b) => (
          <span key={b} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
            {b}
          </span>
        ))}
      </div>

      {recs.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold text-slate-700">Auto-generated recommendations</p>
          <ul className="mt-1 flex flex-col gap-1" data-testid="live-ingest-recs">
            {recs.slice(0, 3).map((c) => (
              <li key={c.relationship.id} className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate text-slate-700">{c.product.name}</span>
                <span className="flex-none rounded-full bg-brand-accent/10 px-2 py-0.5 text-[10px] font-medium text-brand-accent">
                  {TYPE_LABEL[c.relationship.relationship_type] ?? c.relationship.relationship_type}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button type="button" onClick={() => onSelect(product)} className="text-xs font-medium text-brand-accent">
        Open product & pick a customer need →
      </button>
    </section>
  );
}
