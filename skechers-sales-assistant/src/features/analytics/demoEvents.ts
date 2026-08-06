// Synthetic analytics events (DEMO MODE ONLY). A fixed, deterministic dataset
// that stands in for aggregated `recommendation_events` so the management
// dashboard has something realistic to render offline. Every row is invented —
// no customer PII, no real store data, no real Skechers sales. The numbers are
// illustrative only and must never be presented as actual performance.
import type { AnalyticsEvent, EventAction, RecoCategory } from './types';

interface PairSpec {
  sourceName: string;
  targetName: string;
  category: RecoCategory;
  need: string;
  counts: Partial<Record<EventAction, number>>;
}

// Fixed per-pair outcome counts. Chosen so categories and needs differ in
// acceptance, giving the dashboard a plausible spread to display.
const PAIR_SPECS: PairSpec[] = [
  {
    sourceName: 'Demo Walk Comfort 1', targetName: 'Demo Walk Comfort 2',
    category: 'upgrade', need: 'walking',
    counts: { displayed: 24, presented: 20, customer_interested: 6, added_to_basket: 7, customer_declined: 5, product_unavailable: 1, not_relevant: 1 },
  },
  {
    sourceName: 'Demo Work Cushion 1', targetName: 'Demo Work Cushion 2',
    category: 'upgrade', need: 'work_long_hours',
    counts: { displayed: 18, presented: 15, customer_interested: 4, added_to_basket: 5, customer_declined: 4, product_unavailable: 2 },
  },
  {
    sourceName: 'Demo Sport Fit Runner 1', targetName: 'Demo Sport Fit Runner 2',
    category: 'upgrade', need: 'fitness',
    counts: { displayed: 16, presented: 13, customer_interested: 3, added_to_basket: 4, customer_declined: 5, not_relevant: 1 },
  },
  {
    sourceName: 'Demo Sport Fit Runner 1', targetName: 'Demo Trail Active 1',
    category: 'alternative', need: 'fitness',
    counts: { displayed: 14, presented: 11, customer_interested: 3, added_to_basket: 2, customer_declined: 5, not_relevant: 1 },
  },
  {
    sourceName: 'Demo Walk Comfort 1', targetName: 'Demo Performance Sock 1',
    category: 'socks', need: 'walking',
    counts: { displayed: 22, presented: 19, customer_interested: 5, added_to_basket: 9, customer_declined: 4, not_relevant: 1 },
  },
  {
    sourceName: 'Demo Sport Fit Runner 1', targetName: 'Demo Performance Sock 2',
    category: 'socks', need: 'fitness',
    counts: { displayed: 15, presented: 12, customer_interested: 3, added_to_basket: 6, customer_declined: 3 },
  },
  {
    sourceName: 'Demo Work Cushion 1', targetName: 'Demo Cushion Ankle Sock 1',
    category: 'socks', need: 'work_long_hours',
    counts: { displayed: 13, presented: 10, customer_interested: 2, added_to_basket: 5, customer_declined: 3 },
  },
  {
    sourceName: 'Demo Walk Comfort 1', targetName: 'Demo Fresh Insole 1',
    category: 'shoe_care', need: 'walking',
    counts: { displayed: 12, presented: 9, customer_interested: 2, added_to_basket: 3, customer_declined: 4, not_relevant: 1 },
  },
  {
    sourceName: 'Demo Work Cushion 1', targetName: 'Demo Shoe Care Kit 1',
    category: 'shoe_care', need: 'work_long_hours',
    counts: { displayed: 10, presented: 7, customer_interested: 1, added_to_basket: 2, customer_declined: 4, product_unavailable: 1 },
  },
];

function expand(spec: PairSpec): AnalyticsEvent[] {
  const out: AnalyticsEvent[] = [];
  for (const [action, count] of Object.entries(spec.counts) as [EventAction, number][]) {
    for (let i = 0; i < count; i += 1) {
      out.push({ action, sourceName: spec.sourceName, targetName: spec.targetName, category: spec.category, need: spec.need });
    }
  }
  return out;
}

/** Deterministic synthetic dataset for the demo analytics dashboard. */
export const SYNTHETIC_ANALYTICS_EVENTS: AnalyticsEvent[] = PAIR_SPECS.flatMap(expand);
