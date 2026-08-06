import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../../src/features/auth/AuthContext';
import { buildGuidance } from '../../src/features/guidance/content';
import { GuidancePanel } from '../../src/features/guidance/GuidancePanel';
import { RecommendationCard } from '../../src/features/recommendations/RecommendationCard';
import type { Recommendation, RecommendationType } from '../../src/features/recommendations/types';
import type { CustomerNeed } from '../../src/types/db';
import { demoProduct } from './fixtures';

function rec(type: RecommendationType, name = 'Demo Walk Comfort 2'): Recommendation {
  return {
    relationshipId: 'r1', type, typeLabel: type,
    product: { ...demoProduct, id: 'walk2', sku: 'SHOE-WALK-002', name },
    reason: 'Premium walking upgrade.', customerBenefit: 'Softer comfort on long walks.',
    priority: 1, availability: 'available',
  };
}
const need = (code: string, name = code): CustomerNeed => ({ id: 'n1', code, name, description: null, active: true });

describe('buildGuidance (deterministic demo content)', () => {
  it('varies the discovery question by customer need', () => {
    expect(buildGuidance(rec('premium_upgrade'), need('walking'), 'p1').discovery_question).toMatch(/how much walking/i);
    expect(buildGuidance(rec('premium_upgrade'), need('work_long_hours'), 'p1').discovery_question).toMatch(/on their feet/i);
    expect(buildGuidance(rec('premium_upgrade'), need('fitness'), 'p1').discovery_question).toMatch(/workouts or training/i);
  });

  it('varies explanation + objection by recommendation type', () => {
    expect(buildGuidance(rec('premium_upgrade'), need('walking'), 'p1').customer_friendly_explanation).toMatch(/step up/i);
    expect(buildGuidance(rec('alternative'), need('walking'), 'p1').customer_friendly_explanation).toMatch(/alternative/i);
    expect(buildGuidance(rec('add_on'), need('walking'), 'p1').customer_friendly_explanation).toMatch(/pairs perfectly/i);
    expect(buildGuidance(rec('add_on'), need('walking'), 'p1').common_objection).toMatch(/really need/i);
  });

  it('reuses the stored reason + benefit and marks content demo/synthetic', () => {
    const g = buildGuidance(rec('premium_upgrade'), need('walking'), 'sel-1');
    expect(g.stored_reason).toBe('Premium walking upgrade.');
    expect(g.customer_benefit).toBe('Softer comfort on long walks.');
    expect(g.selected_product_id).toBe('sel-1');
    expect(g.recommended_product_id).toBe('walk2');
    expect(g.content_status).toBe('demo');
    expect(g.source_type).toBe('synthetic');
  });

  it('falls back for an unknown customer need', () => {
    const g = buildGuidance(rec('premium_upgrade'), need('unknown_code'), 'p1');
    expect(g.discovery_question).toMatch(/matters most/i);
    expect(g.closing_question).toMatch(/try these on today/i);
  });
});

describe('GuidancePanel', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
  });

  it('renders the four framework cards, a DEMO tag, and copy buttons', () => {
    const g = buildGuidance(rec('premium_upgrade'), need('walking'), 'p1');
    render(<GuidancePanel guidance={g} />);
    const panel = screen.getByTestId('guidance-panel');
    expect(panel).toHaveTextContent('DEMO');
    expect(screen.getByText('Discovery question')).toBeInTheDocument();
    expect(screen.getByText('Selling point')).toBeInTheDocument();
    expect(screen.getByText('Objection handling')).toBeInTheDocument();
    expect(screen.getByText('Closing question')).toBeInTheDocument();
    // stored reason/benefit shown in the selling point card
    expect(panel).toHaveTextContent('Premium walking upgrade.');
    expect(panel).toHaveTextContent('Softer comfort on long walks.');
    expect(screen.getAllByRole('button', { name: /^Copy / })).toHaveLength(4);
  });

  it('copies the section text to the clipboard', () => {
    const g = buildGuidance(rec('premium_upgrade'), need('walking'), 'p1');
    // Use fireEvent (not userEvent) so user-event's clipboard stub doesn't
    // replace our spy.
    render(<GuidancePanel guidance={g} />);
    fireEvent.click(screen.getByLabelText('Copy Discovery question'));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(g.discovery_question);
  });
});

describe('RecommendationCard — guidance toggle (demo)', () => {
  it('shows a guidance toggle and expands the panel', async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider demoMode>
        <RecommendationCard rec={rec('premium_upgrade')} selected={demoProduct} need={need('walking', 'Walking')} />
      </AuthProvider>,
    );
    expect(screen.queryByTestId('guidance-panel')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Show sales guidance/ }));
    expect(screen.getByTestId('guidance-panel')).toBeInTheDocument();
  });
});
