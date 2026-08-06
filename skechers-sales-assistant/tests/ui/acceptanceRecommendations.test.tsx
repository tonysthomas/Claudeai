// Phase 5 acceptance flow (end-to-end through the real app, data layer mocked):
//   Search SHOE-WALK-001 → open → select Walking → display approved
//   recommendations (upgrade, alternative, socks/shoe-care add-on) with stored
//   reason + benefit → log a "displayed" event.
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../../src/App';
import { AuthProvider } from '../../src/features/auth/AuthContext';
import { SelectionProvider } from '../../src/features/selection/SelectionContext';
import { logRecommendationsDisplayed } from '../../src/lib/recommendations';
import type { RecommendationCandidate, RelationshipType } from '../../src/features/recommendations/types';
import type { Product } from '../../src/types/db';
import { demoProduct } from './fixtures';

function prod(id: string, sku: string, name: string, category: string, price: number): Product {
  return { ...demoProduct, id, sku, name, category, price, image_url: null, key_features: null };
}
function cand(target: Product, type: RelationshipType, reason: string, benefit: string): RecommendationCandidate {
  return {
    relationship: {
      id: `${type}:${target.id}`, source_product_id: demoProduct.id, target_product_id: target.id,
      relationship_type: type, priority: 1, reason, customer_benefit: benefit,
      activity_type: null, customer_need: null, region: 'DEMO', active: true, approval_status: 'demo',
    },
    product: target,
    availability: 'available',
  };
}

vi.mock('../../src/lib/products', () => ({
  searchProducts: vi.fn(async (q: string) =>
    `${demoProduct.sku} ${demoProduct.name}`.toLowerCase().includes(q.toLowerCase()) ? [demoProduct] : [],
  ),
  getProductBySku: vi.fn(async (sku: string) => (sku === demoProduct.sku ? demoProduct : null)),
}));

vi.mock('../../src/lib/customerNeeds', async (orig) => {
  const actual = await orig<typeof import('../../src/lib/customerNeeds')>();
  return { ...actual, listCustomerNeeds: vi.fn(async () => actual.CANONICAL_NEEDS.map((n, i) => ({ id: String(i), code: n.code, name: n.name, description: null, active: true }))) };
});

vi.mock('../../src/lib/recommendations', () => ({
  getRecommendationCandidates: vi.fn(async () => [
    cand(prod('walk2', 'SHOE-WALK-002', 'Demo Walk Comfort 2', 'shoes', 89.99), 'upgrade_to', 'Premium walking upgrade with more cushioning.', 'Softer, longer-lasting comfort on long walks.'),
    cand(prod('fit1', 'SHOE-FIT-001', 'Demo Sport Fit Runner 1', 'shoes', 74.99), 'alternative_to', 'A sportier alternative.', 'More energy return.'),
    cand(prod('sock1', 'SOCK-PERF-001', 'Demo Performance Sock 1', 'socks', 12.99), 'pairs_with', 'Pairs with performance socks.', 'Moisture control keeps feet dry.'),
  ]),
  logRecommendationsDisplayed: vi.fn(),
  logRecommendationOutcome: vi.fn(async () => ({ error: null })),
}));

function renderApp() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <AuthProvider demoMode>
        <MemoryRouter initialEntries={['/']}>
          <SelectionProvider><App /></SelectionProvider>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('Phase 5 acceptance flow', () => {
  it('shows prioritized upgrade + alternative + add-on with stored copy and logs displayed', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.type(screen.getByRole('searchbox'), 'WALK-001');
    await user.click(await screen.findByText('Demo Walk Comfort 1'));
    await user.click(await screen.findByRole('button', { name: 'Walking' }));

    // recommendations appear
    const list = await screen.findByRole('list', { name: 'Recommendations' });
    const cards = within(list).getAllByTestId('recommendation-card');
    expect(cards).toHaveLength(3);

    // one of each type, in order
    expect(within(list).getByText('Premium upgrade')).toBeInTheDocument();
    expect(within(list).getByText('Alternative')).toBeInTheDocument();
    expect(within(list).getByText('Add-on')).toBeInTheDocument();

    // stored reason + benefit shown (not generated)
    expect(within(list).getByText(/Premium walking upgrade with more cushioning\./)).toBeInTheDocument();
    expect(within(list).getByText(/Softer, longer-lasting comfort on long walks\./)).toBeInTheDocument();

    // upgrade is first
    expect(within(cards[0]!).getByText('Demo Walk Comfort 2')).toBeInTheDocument();

    // a "displayed" event was logged (anonymous)
    await waitFor(() => expect(logRecommendationsDisplayed).toHaveBeenCalledTimes(1));
    expect(vi.mocked(logRecommendationsDisplayed).mock.calls[0]![0]).toMatchObject({
      selected: expect.objectContaining({ sku: 'SHOE-WALK-001' }),
      associateId: null, // DEMO_MODE logs anonymously
      storeId: null,
    });
  });
});
