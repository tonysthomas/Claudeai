// Phase 4 acceptance flow (end-to-end through the real app, data layer mocked):
//   Open the app → search a product → view it → see key features →
//   select "Walking" → get a confirmation — and NO recommendations yet.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../../src/App';
import { SelectionProvider } from '../../src/features/selection/SelectionContext';
import { demoProduct } from './fixtures';

// Mock the data layer so the flow runs without a live Supabase.
vi.mock('../../src/lib/products', () => ({
  searchProducts: vi.fn(async (q: string) => {
    const needle = q.toLowerCase();
    const hay = `${demoProduct.sku} ${demoProduct.style_number} ${demoProduct.name}`.toLowerCase();
    return hay.includes(needle) ? [demoProduct] : [];
  }),
  getProductBySku: vi.fn(async (sku: string) => (sku === demoProduct.sku ? demoProduct : null)),
}));

vi.mock('../../src/lib/customerNeeds', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/lib/customerNeeds')>();
  return {
    ...actual,
    listCustomerNeeds: vi.fn(async () =>
      actual.CANONICAL_NEEDS.map((n, i) => ({ id: String(i), code: n.code, name: n.name, description: null, active: true })),
    ),
  };
});

function renderApp() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/']}>
        <SelectionProvider>
          <App />
        </SelectionProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Phase 4 acceptance flow', () => {
  beforeEach(() => vi.clearAllMocks());

  it('search → view product → see key features → select Walking → confirmation (no recommendations)', async () => {
    const user = userEvent.setup();
    renderApp();

    // 1. App shell is open
    expect(screen.getByText('Skechers Sales Assistant')).toBeInTheDocument();

    // 2. Search for the walking shoe (by style/SKU fragment)
    await user.type(screen.getByRole('searchbox'), 'WALK-001');

    // 3. Result appears; open the product
    const result = await screen.findByText('Demo Walk Comfort 1');
    await user.click(result);

    // 4. Product detail is shown with its key features
    expect(await screen.findByRole('heading', { name: 'Demo Walk Comfort 1' })).toBeInTheDocument();
    expect(screen.getByText('Cushioned midsole')).toBeInTheDocument();
    expect(screen.getByText('Breathable upper')).toBeInTheDocument();

    // 5. Select the "Walking" customer need
    await user.click(await screen.findByRole('button', { name: 'Walking' }));

    // 6. Confirmation that the need is selected
    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent('Selected: Walking');

    // 7. Still NO recommendations at the end of Phase 4
    expect(screen.queryByText(/recommended product/i)).not.toBeInTheDocument();
    expect(within(status).getByText(/coming next/i)).toBeInTheDocument();
  });

  it('shows "Product not found" for an unknown search', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.type(screen.getByRole('searchbox'), 'zzz-nothing');
    expect(await screen.findByText('Product not found')).toBeInTheDocument();
  });
});
