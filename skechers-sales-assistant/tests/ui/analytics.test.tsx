import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { aggregateEvents, pct } from '../../src/features/analytics/aggregate';
import { AnalyticsDashboard } from '../../src/features/analytics/AnalyticsDashboard';
import { SYNTHETIC_ANALYTICS_EVENTS } from '../../src/features/analytics/demoEvents';
import type { AnalyticsEvent } from '../../src/features/analytics/types';

function ev(over: Partial<AnalyticsEvent>): AnalyticsEvent {
  return { action: 'displayed', sourceName: 'A', targetName: 'B', category: 'upgrade', need: 'walking', ...over };
}

describe('aggregateEvents', () => {
  it('counts totals, acceptance, attach, and decline rates', () => {
    const events: AnalyticsEvent[] = [
      ev({ action: 'added_to_basket' }),
      ev({ action: 'added_to_basket' }),
      ev({ action: 'customer_interested' }),
      ev({ action: 'customer_declined' }),
      ev({ action: 'not_relevant' }),
    ];
    const s = aggregateEvents(events);
    expect(s.total).toBe(5);
    expect(s.accepted).toBe(3); // 2 basket + 1 interested
    expect(s.acceptanceRate).toBeCloseTo(3 / 5);
    expect(s.addedToBasket).toBe(2);
    expect(s.attachRate).toBeCloseTo(2 / 5);
    expect(s.declined).toBe(1);
    expect(s.declineRate).toBeCloseTo(1 / 5);
    expect(s.notRelevant).toBe(1);
  });

  it('returns all eight outcomes in fixed order, even when zero', () => {
    const s = aggregateEvents([ev({ action: 'displayed' })]);
    expect(s.outcomes.map((o) => o.action)).toEqual([
      'displayed', 'opened', 'presented', 'customer_interested',
      'added_to_basket', 'customer_declined', 'product_unavailable', 'not_relevant',
    ]);
    expect(s.outcomes.find((o) => o.action === 'opened')?.count).toBe(0);
  });

  it('is safe on an empty dataset (no divide-by-zero)', () => {
    const s = aggregateEvents([]);
    expect(s.total).toBe(0);
    expect(s.acceptanceRate).toBe(0);
    expect(s.attachRate).toBe(0);
    expect(s.topPairs).toEqual([]);
  });

  it('ranks top pairs by accepted count and caps at five', () => {
    const events: AnalyticsEvent[] = [];
    for (let i = 0; i < 7; i += 1) {
      const name = `P${i}`;
      events.push(ev({ sourceName: name, targetName: `${name}t`, action: 'added_to_basket' }));
      // give higher-index pairs more acceptances
      for (let j = 0; j < i; j += 1) events.push(ev({ sourceName: name, targetName: `${name}t`, action: 'customer_interested' }));
    }
    const s = aggregateEvents(events);
    expect(s.topPairs).toHaveLength(5);
    const [first, second] = s.topPairs;
    expect(first?.sourceName).toBe('P6'); // most accepted
    expect(first?.accepted ?? 0).toBeGreaterThanOrEqual(second?.accepted ?? 0);
  });

  it('groups acceptance by need and by category', () => {
    const events: AnalyticsEvent[] = [
      ev({ need: 'walking', category: 'socks', action: 'added_to_basket' }),
      ev({ need: 'walking', category: 'socks', action: 'customer_declined' }),
      ev({ need: 'fitness', category: 'upgrade', action: 'added_to_basket' }),
    ];
    const s = aggregateEvents(events);
    const walking = s.byNeed.find((n) => n.need === 'walking');
    expect(walking?.total).toBe(2);
    expect(walking?.accepted).toBe(1);
    expect(s.byCategory.find((c) => c.category === 'upgrade')?.rate).toBeCloseTo(1);
  });
});

describe('pct', () => {
  it('formats a 0..1 rate as a whole-number percent', () => {
    expect(pct(0)).toBe('0%');
    expect(pct(0.5)).toBe('50%');
    expect(pct(0.333)).toBe('33%');
    expect(pct(1)).toBe('100%');
  });
});

describe('SYNTHETIC_ANALYTICS_EVENTS', () => {
  it('is a non-empty deterministic dataset covering all four categories', () => {
    expect(SYNTHETIC_ANALYTICS_EVENTS.length).toBeGreaterThan(50);
    const cats = new Set(SYNTHETIC_ANALYTICS_EVENTS.map((e) => e.category));
    expect(cats).toEqual(new Set(['upgrade', 'alternative', 'socks', 'shoe_care']));
  });
});

describe('AnalyticsDashboard', () => {
  it('renders the synthetic-data disclaimer and summary metrics', () => {
    const summary = aggregateEvents(SYNTHETIC_ANALYTICS_EVENTS);
    render(<AnalyticsDashboard summary={summary} />);
    const dash = screen.getByTestId('analytics-dashboard');
    expect(dash).toHaveTextContent(/DEMO — synthetic analytics/i);
    expect(dash).toHaveTextContent(/no personal information/i);
    expect(screen.getByText('Recommendations logged')).toBeInTheDocument();
    expect(screen.getByText('Acceptance rate')).toBeInTheDocument();
    expect(screen.getByText('Attach rate')).toBeInTheDocument();
    expect(screen.getByText('Top performing pairings')).toBeInTheDocument();
  });

  it('shows an empty state when there is no activity', () => {
    render(<AnalyticsDashboard summary={aggregateEvents([])} />);
    expect(screen.getByText(/No recommendation activity yet/i)).toBeInTheDocument();
    expect(screen.queryByTestId('analytics-dashboard')).not.toBeInTheDocument();
  });
});
