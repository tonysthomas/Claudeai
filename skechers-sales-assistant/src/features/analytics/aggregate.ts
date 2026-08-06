// Pure aggregation of analytics events → summary metrics. No I/O; fully
// unit-testable. Denominators are the total logged events (per the Phase 10
// spec). Acceptance = added_to_basket + customer_interested.
import {
  EVENT_ACTIONS,
  type AnalyticsEvent,
  type AnalyticsSummary,
  type CategoryPerformance,
  type EventAction,
  type NeedPerformance,
  type OutcomeCount,
  type PairPerformance,
  type RecoCategory,
} from './types';

const ACCEPTED: ReadonlySet<EventAction> = new Set(['added_to_basket', 'customer_interested']);

function rate(n: number, d: number): number {
  return d > 0 ? n / d : 0;
}

export function aggregateEvents(events: AnalyticsEvent[]): AnalyticsSummary {
  const total = events.length;

  const counts = Object.fromEntries(EVENT_ACTIONS.map((a) => [a, 0])) as Record<EventAction, number>;
  for (const e of events) counts[e.action] += 1;

  const accepted = counts.added_to_basket + counts.customer_interested;

  const outcomes: OutcomeCount[] = EVENT_ACTIONS.map((action) => ({
    action,
    count: counts[action],
    pct: rate(counts[action], total),
  }));

  // Group helper for pair / need / category performance.
  const acc = (e: AnalyticsEvent) => (ACCEPTED.has(e.action) ? 1 : 0);

  const pairMap = new Map<string, PairPerformance>();
  for (const e of events) {
    const key = `${e.sourceName}→${e.targetName}`;
    const p = pairMap.get(key) ?? { sourceName: e.sourceName, targetName: e.targetName, accepted: 0, total: 0, rate: 0 };
    p.total += 1;
    p.accepted += acc(e);
    pairMap.set(key, p);
  }
  const topPairs = [...pairMap.values()]
    .map((p) => ({ ...p, rate: rate(p.accepted, p.total) }))
    .sort((a, b) => b.accepted - a.accepted || b.rate - a.rate || a.sourceName.localeCompare(b.sourceName))
    .slice(0, 5);

  const needMap = new Map<string, NeedPerformance>();
  for (const e of events) {
    const p = needMap.get(e.need) ?? { need: e.need, accepted: 0, total: 0, rate: 0 };
    p.total += 1;
    p.accepted += acc(e);
    needMap.set(e.need, p);
  }
  const byNeed = [...needMap.values()]
    .map((p) => ({ ...p, rate: rate(p.accepted, p.total) }))
    .sort((a, b) => b.rate - a.rate || a.need.localeCompare(b.need));

  const catMap = new Map<RecoCategory, CategoryPerformance>();
  for (const e of events) {
    const p = catMap.get(e.category) ?? { category: e.category, accepted: 0, total: 0, rate: 0 };
    p.total += 1;
    p.accepted += acc(e);
    catMap.set(e.category, p);
  }
  const byCategory = [...catMap.values()]
    .map((p) => ({ ...p, rate: rate(p.accepted, p.total) }))
    .sort((a, b) => b.rate - a.rate || a.category.localeCompare(b.category));

  return {
    total,
    accepted,
    acceptanceRate: rate(accepted, total),
    addedToBasket: counts.added_to_basket,
    attachRate: rate(counts.added_to_basket, total),
    declined: counts.customer_declined,
    declineRate: rate(counts.customer_declined, total),
    unavailable: counts.product_unavailable,
    unavailableRate: rate(counts.product_unavailable, total),
    notRelevant: counts.not_relevant,
    notRelevantRate: rate(counts.not_relevant, total),
    outcomes,
    byNeed,
    byCategory,
    topPairs,
  };
}

/** Format a 0..1 rate as a whole-number percent string. */
export function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}
