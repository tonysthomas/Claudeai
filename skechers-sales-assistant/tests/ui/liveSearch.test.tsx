import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { SelectionProvider } from '../../src/features/selection/SelectionContext';
import { ProductSearch } from '../../src/features/search/ProductSearch';
import type { Product } from '../../src/types/db';

const GLAM: Product = {
  id: 'SK-304351L', sku: 'SK-304351L', barcode: null, style_number: '304351L', name: 'Skechers Garage - Glam Racer',
  category: 'shoes', subcategory: 'kids', gender: 'kids', color: 'Rose Gold', size_range: 'UK 10-3 (Kids)',
  price: 179, currency: 'AED', region: 'AE', image_url: null, product_url: null,
  description: 'Light-up kids trainer.', key_features: ['Skechers Garage Lighted Midsole'],
  technology: 'Skechers Garage Lighted Midsole', activity_type: 'casual', data_status: 'imported', approval_status: 'approved',
};

const SOCK: Product = { ...GLAM, id: 'SK-PERF', sku: 'SK-PERF', name: 'Skechers Performance Crew Socks', category: 'socks', technology: null };

vi.mock('../../src/lib/products', () => ({
  searchProducts: vi.fn(async () => []), // always a miss → triggers live ingest
  getProductBySku: vi.fn(async () => GLAM),
  // small delay so the "Retrieving…" indicator is observable before the result.
  liveIngestSku: vi.fn(async () => {
    await new Promise((r) => setTimeout(r, 80));
    return GLAM;
  }),
}));

vi.mock('../../src/lib/recommendations', () => ({
  getRecommendationCandidates: vi.fn(async () => [
    { relationship: { id: 'r1', source_product_id: GLAM.id, target_product_id: SOCK.id, relationship_type: 'pairs_with', priority: 1, reason: 'Pairs with socks.', customer_benefit: 'Comfort.', activity_type: null, customer_need: null, region: 'AE', active: true, approval_status: 'approved' }, product: SOCK, availability: 'available' },
  ]),
}));

function renderSearch() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <SelectionProvider>
          <ProductSearch />
        </SelectionProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ProductSearch — live SKU ingest', () => {
  beforeEach(() => vi.clearAllMocks());

  it('ingests a valid SKU on a search miss and renders the product + recommendations', async () => {
    const user = userEvent.setup();
    renderSearch();

    await user.type(screen.getByRole('searchbox'), '304351L');

    // Loading indicator names the SKU.
    expect(await screen.findByText(/Retrieving Skechers SKU 304351L/i)).toBeInTheDocument();

    // Ingested product renders with its technology badge and auto-generated recs.
    const result = await screen.findByTestId('live-ingest-result');
    expect(result).toHaveTextContent('Skechers Garage - Glam Racer');
    expect(result).toHaveTextContent('Skechers Garage Lighted Midsole');
    expect(result).toHaveTextContent('AED');
    expect(screen.getByTestId('live-ingest-recs')).toHaveTextContent('Skechers Performance Crew Socks');
  });

  it('does not live-ingest a non-SKU query (shows not found)', async () => {
    const user = userEvent.setup();
    const products = await import('../../src/lib/products');
    renderSearch();

    await user.type(screen.getByRole('searchbox'), 'zzz-nothing');
    expect(await screen.findByText('Product not found')).toBeInTheDocument();
    expect(products.liveIngestSku).not.toHaveBeenCalled();
  });
});
