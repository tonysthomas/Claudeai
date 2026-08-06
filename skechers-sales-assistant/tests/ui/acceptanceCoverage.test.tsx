// Phase 5 coverage acceptance: three different source products each return a
// valid recommendation with the correct type and stored (not generated) copy.
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../../src/App';
import { SelectionProvider } from '../../src/features/selection/SelectionContext';
import type { RecommendationCandidate, RelationshipType } from '../../src/features/recommendations/types';
import type { Product } from '../../src/types/db';
import { demoProduct } from './fixtures';

function prod(id: string, sku: string, name: string, category: string, price: number): Product {
  return { ...demoProduct, id, sku, name, category, price, image_url: null, key_features: null };
}
function cand(source: Product, target: Product, type: RelationshipType, reason: string, benefit: string): RecommendationCandidate {
  return {
    relationship: {
      id: `${source.id}:${type}:${target.id}`, source_product_id: source.id, target_product_id: target.id,
      relationship_type: type, priority: 1, reason, customer_benefit: benefit,
      activity_type: null, customer_need: null, region: 'DEMO', active: true, approval_status: 'demo',
    },
    product: target, availability: 'available',
  };
}

// Three source products (walking / work / fitness) + their candidates.
const WALK = prod('walk1', 'SHOE-WALK-001', 'Demo Walk Comfort 1', 'shoes', 59.99);
const WORK = prod('work1', 'SHOE-WORK-001', 'Demo Work Cushion 1', 'shoes', 69.99);
const FIT = prod('fit1', 'SHOE-FIT-001', 'Demo Sport Fit Runner 1', 'shoes', 74.99);
const SOURCES: Record<string, Product> = { [WALK.sku]: WALK, [WORK.sku]: WORK, [FIT.sku]: FIT };

const CANDIDATES: Record<string, RecommendationCandidate[]> = {
  walk1: [
    cand(WALK, prod('walk2', 'SHOE-WALK-002', 'Demo Walk Comfort 2', 'shoes', 89.99), 'upgrade_to', 'Premium walking upgrade.', 'Softer comfort on long walks.'),
    cand(WALK, prod('ev1', 'SHOE-EVERYDAY-001', 'Demo Everyday Slip-On 1', 'shoes', 54.99), 'alternative_to', 'A slip-on alternative.', 'Easy on and off.'),
    cand(WALK, prod('sock1', 'SOCK-PERF-001', 'Demo Performance Sock 1', 'socks', 12.99), 'pairs_with', 'Pairs with performance socks.', 'Keeps feet dry.'),
  ],
  work1: [
    cand(WORK, prod('work2', 'SHOE-WORK-002', 'Demo Work Cushion 2', 'shoes', 99.99), 'upgrade_to', 'Upgraded work shoe.', 'More support on long shifts.'),
    cand(WORK, prod('crew1', 'SOCK-CREW-001', 'Demo Everyday Crew Sock 1', 'socks', 9.99), 'pairs_with', 'Pairs with crew socks.', 'Cushioned comfort.'),
  ],
  fit1: [
    cand(FIT, prod('fit2', 'SHOE-FIT-002', 'Demo Sport Fit Runner 2', 'shoes', 109.99), 'upgrade_to', 'Upgrade to the pro trainer.', 'More rebound for tough workouts.'),
    cand(FIT, prod('maxc', 'SHOE-MAXC-001', 'Demo Max Cushion Cloud 1', 'shoes', 94.99), 'alternative_to', 'A cushioned alternative.', 'Softer landings.'),
  ],
};

vi.mock('../../src/lib/products', () => ({
  searchProducts: vi.fn(async (q: string) => Object.values(SOURCES).filter((p) => `${p.sku} ${p.name}`.toLowerCase().includes(q.toLowerCase()))),
  getProductBySku: vi.fn(async (sku: string) => SOURCES[sku] ?? null),
}));
vi.mock('../../src/lib/customerNeeds', async (orig) => {
  const actual = await orig<typeof import('../../src/lib/customerNeeds')>();
  return { ...actual, listCustomerNeeds: vi.fn(async () => actual.CANONICAL_NEEDS.map((n, i) => ({ id: String(i), code: n.code, name: n.name, description: null, active: true }))) };
});
vi.mock('../../src/lib/recommendations', () => ({
  getRecommendationCandidates: vi.fn(async (product: Product) => CANDIDATES[product.id] ?? []),
  logRecommendationsDisplayed: vi.fn(),
}));

function renderApp() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/']}>
        <SelectionProvider><App /></SelectionProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

interface Case {
  label: string; searchTerm: string; productName: string; need: string;
  expectType: string; expectReason: string; expectBenefit: string;
}
const CASES: Case[] = [
  { label: 'walking', searchTerm: 'WALK-001', productName: 'Demo Walk Comfort 1', need: 'Walking', expectType: 'Premium upgrade', expectReason: 'Premium walking upgrade.', expectBenefit: 'Softer comfort on long walks.' },
  { label: 'work', searchTerm: 'WORK-001', productName: 'Demo Work Cushion 1', need: 'Work or long hours', expectType: 'Premium upgrade', expectReason: 'Upgraded work shoe.', expectBenefit: 'More support on long shifts.' },
  { label: 'fitness', searchTerm: 'FIT-001', productName: 'Demo Sport Fit Runner 1', need: 'Fitness', expectType: 'Premium upgrade', expectReason: 'Upgrade to the pro trainer.', expectBenefit: 'More rebound for tough workouts.' },
];

describe('Phase 5 recommendation coverage (3 source products)', () => {
  it.each(CASES)('$label: found → need → valid recommendation with stored copy', async (c) => {
    const user = userEvent.setup();
    renderApp();

    // found
    await user.type(screen.getByRole('searchbox'), c.searchTerm);
    await user.click(await screen.findByText(c.productName));
    expect(await screen.findByRole('heading', { name: c.productName })).toBeInTheDocument();

    // need selectable
    await user.click(await screen.findByRole('button', { name: c.need }));

    // at least one recommendation, correct type, stored reason + benefit
    const list = await screen.findByRole('list', { name: 'Recommendations' });
    const cards = within(list).getAllByTestId('recommendation-card');
    expect(cards.length).toBeGreaterThanOrEqual(1);
    expect(within(list).getByText(c.expectType)).toBeInTheDocument();
    // stored copy shown verbatim (nothing generated)
    expect(within(list).getByText(new RegExp(c.expectReason.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))).toBeInTheDocument();
    expect(within(list).getByText(new RegExp(c.expectBenefit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))).toBeInTheDocument();
  });
});
