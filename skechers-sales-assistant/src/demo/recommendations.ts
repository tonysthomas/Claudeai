// In-memory recommendation candidates for the self-contained browser demo.
import type { Product } from '../types/db';
import type { RecommendationCandidate, RelationshipRow, RelationshipType } from '../features/recommendations/types';
import { DEMO_PRODUCTS } from './products';

const bySku = new Map(DEMO_PRODUCTS.map((p) => [p.sku, p]));

function rel(
  source: string,
  target: string,
  type: RelationshipType,
  reason: string,
  benefit: string,
  need: string | null,
): RelationshipRow {
  return {
    id: `${source}->${target}:${type}`,
    source_product_id: source,
    target_product_id: target,
    relationship_type: type,
    priority: 1,
    reason,
    customer_benefit: benefit,
    activity_type: null,
    customer_need: need,
    region: 'DEMO',
    active: true,
    approval_status: 'demo',
  };
}

// Demo edges keyed by source SKU (target uses the product's own SKU as its id).
// Mirrors the seed's Phase 5 coverage: five shoes each yield upgrade + alt + add-on.
const EDGES: Record<string, RelationshipRow[]> = {
  'SHOE-WALK-001': [
    rel('SHOE-WALK-001', 'SHOE-WALK-002', 'upgrade_to', 'Premium walking upgrade with more cushioning.', 'Softer, longer-lasting comfort on long walks.', 'walking'),
    rel('SHOE-WALK-001', 'SHOE-EVERYDAY-001', 'alternative_to', 'Similar comfort in an easy slip-on style.', 'Easy on-and-off with all-day comfort.', 'everyday_comfort'),
    rel('SHOE-WALK-001', 'SOCK-PERF-001', 'pairs_with', 'Pairs with performance socks.', 'Moisture control keeps feet dry on walks.', 'walking'),
    rel('SHOE-WALK-001', 'CARE-KIT-001', 'recommended_add_on', 'Add a shoe-care kit.', 'Keeps shoes looking new for longer.', null),
  ],
  'SHOE-WORK-001': [
    rel('SHOE-WORK-001', 'SHOE-WORK-002', 'upgrade_to', 'Upgraded work shoe with enhanced support.', 'More protection and comfort across long shifts.', 'work_long_hours'),
    rel('SHOE-WORK-001', 'SHOE-EVERYDAY-001', 'alternative_to', 'A slip-on alternative for work.', 'Easy on/off with all-day comfort.', 'work_long_hours'),
    rel('SHOE-WORK-001', 'SOCK-CREW-001', 'pairs_with', 'Pairs with everyday crew socks.', 'Cushioned comfort through long shifts.', null),
    rel('SHOE-WORK-001', 'CARE-INSOLE-001', 'recommended_add_on', 'Add fresh insoles.', 'Extra freshness for long hours.', null),
  ],
  'SHOE-FIT-001': [
    rel('SHOE-FIT-001', 'SHOE-FIT-002', 'upgrade_to', 'Upgrade to the pro trainer.', 'More rebound and stability for tougher workouts.', 'fitness'),
    rel('SHOE-FIT-001', 'SHOE-MAXC-001', 'alternative_to', 'Alternative with maximum cushioning.', 'A softer ride if plushness is preferred.', 'maximum_cushioning'),
    rel('SHOE-FIT-001', 'SOCK-PERF-001', 'pairs_with', 'Pairs with performance socks.', 'Blister protection during training.', 'fitness'),
    rel('SHOE-FIT-001', 'CARE-INSOLE-001', 'recommended_add_on', 'Add fresh insoles.', 'Extra freshness for gym days.', 'fitness'),
  ],
  'SHOE-EVERYDAY-002': [
    rel('SHOE-EVERYDAY-002', 'SHOE-WALK-002', 'upgrade_to', 'Upgrade to premium cushioning.', 'Softer, longer-lasting comfort.', 'everyday_comfort'),
    rel('SHOE-EVERYDAY-002', 'SHOE-EVERYDAY-001', 'alternative_to', 'A slip-on alternative.', 'Easy on/off everyday wear.', 'everyday_comfort'),
    rel('SHOE-EVERYDAY-002', 'SOCK-PERF-001', 'pairs_with', 'Pairs with performance socks.', 'Keeps everyday feet fresh.', 'everyday_comfort'),
    rel('SHOE-EVERYDAY-002', 'CARE-KIT-001', 'recommended_add_on', 'Add a shoe-care kit.', 'Keeps everyday shoes fresh.', null),
  ],
  'SHOE-TRAIL-001': [
    rel('SHOE-TRAIL-001', 'SHOE-MAXC-001', 'upgrade_to', 'Upgrade to maximum cushioning.', 'Plusher ride on long trails.', 'maximum_cushioning'),
    rel('SHOE-TRAIL-001', 'SHOE-FIT-001', 'alternative_to', 'A road-runner alternative.', 'Lighter option for mixed terrain.', 'fitness'),
    rel('SHOE-TRAIL-001', 'SOCK-PERF-001', 'pairs_with', 'Pairs with performance socks.', 'Moisture control on the trail.', 'fitness'),
    rel('SHOE-TRAIL-001', 'CARE-KIT-001', 'recommended_add_on', 'Add a shoe-care kit.', 'Protects trail shoes.', null),
  ],
};

export async function getRecommendationCandidates(product: Product): Promise<RecommendationCandidate[]> {
  await new Promise((r) => setTimeout(r, 200));
  const edges = EDGES[product.sku] ?? [];
  const out: RecommendationCandidate[] = [];
  for (const relationship of edges) {
    const target = bySku.get(relationship.target_product_id);
    if (target) out.push({ relationship, product: target, availability: 'available' });
  }
  return out;
}

export async function logRecommendationsDisplayed(): Promise<void> {
  // no-op in the offline demo
}

export async function logRecommendationOutcome(): Promise<{ error: string | null }> {
  // no-op in the offline demo — the UI still shows its confirmation state
  await new Promise((r) => setTimeout(r, 120));
  return { error: null };
}
