import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OutcomeFeedback } from '../../src/features/outcomes/OutcomeFeedback';
import type { CustomerNeed } from '../../src/types/db';
import { demoProduct } from './fixtures';

const h = vi.hoisted(() => ({
  auth: {
    isDemo: true, userId: null as string | null, store: null as { id: string } | null,
    loading: false, isAuthenticated: true, profile: null, error: null,
    signIn: async () => ({ error: null }), signOut: async () => {},
  },
  logOutcome: vi.fn(),
}));

vi.mock('../../src/features/auth/AuthContext', () => ({
  useAuth: () => h.auth,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('../../src/lib/recommendations', () => ({ logRecommendationOutcome: h.logOutcome }));

const need: CustomerNeed = { id: 'need-1', code: 'walking', name: 'Walking', description: null, active: true };
const recommended = { ...demoProduct, id: 'rec-1', sku: 'SHOE-WALK-002', name: 'Demo Walk Comfort 2' };

function renderBar() {
  return render(<OutcomeFeedback selected={demoProduct} recommended={recommended} relationshipId="rel-1" need={need} />);
}

beforeEach(() => {
  h.auth.isDemo = true; h.auth.userId = null; h.auth.store = null;
  h.logOutcome.mockReset();
  h.logOutcome.mockResolvedValue({ error: null });
});

describe('OutcomeFeedback', () => {
  it('renders the five outcome action buttons', () => {
    renderBar();
    const group = screen.getByRole('group', { name: 'Record outcome' });
    expect(group.querySelectorAll('button')).toHaveLength(5);
    for (const label of ['Added to basket', 'Interested', 'Declined', 'Unavailable', 'Not relevant']) {
      expect(screen.getByRole('button', { name: new RegExp(label) })).toBeInTheDocument();
    }
  });

  it('logs the correct action + payload and shows a confirmation (DEMO = anonymous)', async () => {
    const user = userEvent.setup();
    renderBar();
    await user.click(screen.getByRole('button', { name: /Added to basket/ }));
    await waitFor(() => expect(h.logOutcome).toHaveBeenCalledTimes(1));
    expect(h.logOutcome.mock.calls[0]![0]).toMatchObject({
      action: 'added_to_basket',
      recommended: expect.objectContaining({ id: 'rec-1' }),
      relationshipId: 'rel-1',
      needId: 'need-1',
      associateId: null, // demo → anonymous
      storeId: null,
    });
    expect(await screen.findByTestId('outcome-confirmation')).toHaveTextContent('Added to basket logged');
  });

  it('attaches the session associate + store in production mode', async () => {
    h.auth.isDemo = false; h.auth.userId = 'assoc-123'; h.auth.store = { id: 'store-9' };
    const user = userEvent.setup();
    renderBar();
    await user.click(screen.getByRole('button', { name: /Declined/ }));
    await waitFor(() => expect(h.logOutcome).toHaveBeenCalledTimes(1));
    expect(h.logOutcome.mock.calls[0]![0]).toMatchObject({
      action: 'customer_declined', associateId: 'assoc-123', storeId: 'store-9',
    });
  });

  it('maps every button to its action value', async () => {
    const user = userEvent.setup();
    const expected: Array<[RegExp, string]> = [
      [/Interested/, 'customer_interested'],
      [/Unavailable/, 'product_unavailable'],
      [/Not relevant/, 'not_relevant'],
    ];
    for (const [label, action] of expected) {
      h.logOutcome.mockClear();
      const { unmount } = renderBar();
      await user.click(screen.getByRole('button', { name: label }));
      await waitFor(() => expect(h.logOutcome).toHaveBeenCalled());
      expect(h.logOutcome.mock.calls[0]![0]).toMatchObject({ action });
      unmount();
    }
  });

  it('lets the associate change the outcome before the next scan', async () => {
    const user = userEvent.setup();
    renderBar();
    await user.click(screen.getByRole('button', { name: /Interested/ }));
    await screen.findByTestId('outcome-confirmation');
    await user.click(screen.getByRole('button', { name: /Declined/ }));
    await waitFor(() => expect(h.logOutcome).toHaveBeenCalledTimes(2));
    expect(await screen.findByTestId('outcome-confirmation')).toHaveTextContent('Declined logged');
  });

  it('shows an error state when logging fails', async () => {
    h.logOutcome.mockResolvedValueOnce({ error: 'network down' });
    const user = userEvent.setup();
    renderBar();
    await user.click(screen.getByRole('button', { name: /Added to basket/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/Couldn.t save/);
  });
});
