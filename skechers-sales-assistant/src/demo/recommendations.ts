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
const EDGES: Record<string, RelationshipRow[]> = {
  'SHOE-WALK-001': [
    rel('SHOE-WALK-001', 'SHOE-WALK-002', 'upgrade_to', 'Premium walking upgrade with more cushioning.', 'Softer, longer-lasting comfort on long walks.', 'walking'),
    rel('SHOE-WALK-001', 'SHOE-FIT-001', 'alternative_to', 'A sportier alternative with responsive foam.', 'More energy return if they also train.', null),
    rel('SHOE-WALK-001', 'SOCK-PERF-001', 'pairs_with', 'Pairs with performance socks.', 'Moisture control keeps feet dry on walks.', 'walking'),
    rel('SHOE-WALK-001', 'CARE-KIT-001', 'recommended_add_on', 'Add a shoe-care kit.', 'Keeps shoes looking new for longer.', null),
  ],
  'SHOE-WORK-001': [
    rel('SHOE-WORK-001', 'SHOE-WALK-002', 'upgrade_to', 'Step up to premium cushioning.', 'More comfort across long shifts.', 'work_long_hours'),
    rel('SHOE-WORK-001', 'SOCK-PERF-001', 'pairs_with', 'Pairs with performance socks.', 'Cushioned comfort through long shifts.', null),
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
