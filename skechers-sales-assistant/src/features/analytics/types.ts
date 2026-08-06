// Analytics types (DEMO MODE ONLY). Aggregations over synthetic
// recommendation_events. No customer PII — events carry only product/need/action.

export type EventAction =
  | 'displayed'
  | 'opened'
  | 'presented'
  | 'customer_interested'
  | 'added_to_basket'
  | 'customer_declined'
  | 'product_unavailable'
  | 'not_relevant';

export const EVENT_ACTIONS: EventAction[] = [
  'displayed',
  'opened',
  'presented',
  'customer_interested',
  'added_to_basket',
  'customer_declined',
  'product_unavailable',
  'not_relevant',
];

/** Coarse recommendation category for performance reporting. */
export type RecoCategory = 'upgrade' | 'alternative' | 'socks' | 'shoe_care';

/** A single (enriched) analytics event. Synthetic in demo mode. */
export interface AnalyticsEvent {
  action: EventAction;
  sourceName: string;
  targetName: string;
  category: RecoCategory;
  need: string; // customer-need code
}

export interface OutcomeCount {
  action: EventAction;
  count: number;
  pct: number; // 0..1 of total
}
export interface PairPerformance {
  sourceName: string;
  targetName: string;
  accepted: number;
  total: number;
  rate: number; // accepted / total
}
export interface NeedPerformance {
  need: string;
  accepted: number;
  total: number;
  rate: number;
}
export interface CategoryPerformance {
  category: RecoCategory;
  accepted: number;
  total: number;
  rate: number;
}

export interface AnalyticsSummary {
  total: number;
  accepted: number; // added_to_basket + customer_interested
  acceptanceRate: number;
  addedToBasket: number;
  attachRate: number; // added_to_basket / total
  declined: number;
  declineRate: number;
  unavailable: number;
  unavailableRate: number;
  notRelevant: number;
  notRelevantRate: number;
  outcomes: OutcomeCount[]; // all 8, fixed order
  byNeed: NeedPerformance[];
  byCategory: CategoryPerformance[];
  topPairs: PairPerformance[];
}
