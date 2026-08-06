import { describe, it, expect } from 'vitest';
import { buildRecommendations } from '../../src/features/recommendations/engine';
import type { RecommendationCandidate, RelationshipType } from '../../src/features/recommendations/types';
import type { Product } from '../../src/types/db';

function product(over: Partial<Product> & Pick<Product, 'id' | 'sku' | 'name' | 'category'>): Product {
  return {
    barcode: null, style_number: null, subcategory: null, gender: null, color: null,
    size_range: null, price: null, currency: 'DEMO', region: 'DEMO', image_url: null,
    product_url: null, description: null, key_features: null, technology: null,
    activity_type: null, data_status: 'demo', approval_status: 'demo', ...over,
  };
}

const SELECTED = product({ id: 'walk1', sku: 'SHOE-WALK-001', name: 'Demo Walk Comfort 1', category: 'shoes' });

function candidate(
  targetId: string,
  type: RelationshipType,
  over: Partial<RecommendationCandidate['relationship']> & { category?: string; price?: number } = {},
): RecommendationCandidate {
  const { category = 'shoes', price, ...rel } = over;
  return {
    relationship: {
      id: `${type}:${targetId}`, source_product_id: 'walk1', target_product_id: targetId,
      relationship_type: type, priority: rel.priority ?? 1, reason: `reason ${targetId}`,
      customer_benefit: `benefit ${targetId}`, activity_type: rel.activity_type ?? null,
      customer_need: rel.customer_need ?? null, region: rel.region ?? 'DEMO',
      active: rel.active ?? true, approval_status: rel.approval_status ?? 'demo',
    },
    product: product({ id: targetId, sku: targetId, name: targetId, category, price: price ?? null }),
    availability: 'available',
  };
}

describe('buildRecommendations', () => {
  it('returns one upgrade, one alternative, one add-on (max three)', () => {
    const recs = buildRecommendations(SELECTED, 'walking', [
      candidate('walk2', 'upgrade_to'),
      candidate('alt1', 'alternative_to'),
      candidate('sock1', 'pairs_with', { category: 'socks' }),
      candidate('care1', 'recommended_add_on', { category: 'shoe_care' }),
    ]);
    expect(recs).toHaveLength(3);
    expect(recs.map((r) => r.type)).toEqual(['premium_upgrade', 'alternative', 'add_on']);
    expect(recs[0]!.product.id).toBe('walk2');
    expect(recs[2]!.product.category === 'socks' || recs[2]!.product.category === 'shoe_care').toBe(true);
  });

  it('never recommends the selected product to itself', () => {
    const recs = buildRecommendations(SELECTED, null, [candidate('walk1', 'upgrade_to')]);
    expect(recs).toHaveLength(0);
  });

  it('excludes out-of-stock, inactive, and unapproved candidates', () => {
    const recs = buildRecommendations(SELECTED, null, [
      { ...candidate('a', 'upgrade_to'), availability: 'out' },
      candidate('b', 'alternative_to', { active: false }),
      candidate('c', 'pairs_with', { category: 'socks', approval_status: 'rejected' }),
    ]);
    expect(recs).toHaveLength(0);
  });

  it('deduplicates the same target product across relationships', () => {
    const recs = buildRecommendations(SELECTED, null, [
      candidate('dup', 'upgrade_to'),
      candidate('dup', 'alternative_to'),
    ]);
    expect(recs).toHaveLength(1);
    expect(recs[0]!.product.id).toBe('dup');
  });

  it('is deterministic: need-relevant first, then priority, then price, then sku', () => {
    const recs = buildRecommendations(SELECTED, 'walking', [
      candidate('AAA', 'upgrade_to', { priority: 2, price: 50, customer_need: 'walking' }),
      candidate('BBB', 'upgrade_to', { priority: 1, price: 90, customer_need: 'walking' }),
    ]);
    // BBB wins on lower priority number despite higher price
    expect(recs[0]!.product.id).toBe('BBB');
  });

  it('copies reason and customer benefit verbatim (no generated claims)', () => {
    const recs = buildRecommendations(SELECTED, null, [candidate('walk2', 'upgrade_to')]);
    expect(recs[0]!.reason).toBe('reason walk2');
    expect(recs[0]!.customerBenefit).toBe('benefit walk2');
  });

  it('drops recommended_for_customer_need candidates for a different need', () => {
    const recs = buildRecommendations(SELECTED, 'walking', [
      candidate('x', 'recommended_for_customer_need', { customer_need: 'budget' }),
    ]);
    expect(recs).toHaveLength(0);
  });
});
