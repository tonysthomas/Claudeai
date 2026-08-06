// Associate-recorded outcomes for a recommendation. These map to the
// recommendation_events.action values allowed by the Phase 2 schema.
export type OutcomeAction =
  | 'added_to_basket'
  | 'customer_interested'
  | 'customer_declined'
  | 'product_unavailable'
  | 'not_relevant';

export interface OutcomeOption {
  action: OutcomeAction;
  label: string;
  icon: string;
}

export const OUTCOME_OPTIONS: OutcomeOption[] = [
  { action: 'added_to_basket', label: 'Added to basket', icon: '🛒' },
  { action: 'customer_interested', label: 'Interested', icon: '👍' },
  { action: 'customer_declined', label: 'Declined', icon: '👎' },
  { action: 'product_unavailable', label: 'Unavailable', icon: '❌' },
  { action: 'not_relevant', label: 'Not relevant', icon: '⏩' },
];

export function outcomeLabel(action: OutcomeAction): string {
  return OUTCOME_OPTIONS.find((o) => o.action === action)?.label ?? action;
}
