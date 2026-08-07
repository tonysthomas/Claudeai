import { describe, it, expect } from 'vitest';
import { buildFallbackCandidates } from '../../src/lib/ingest/fallbackRelationships';
import { deriveProductFromSku } from '../../src/lib/ingest/deriveProduct';
import { inferSegment, parseSku } from '../../src/lib/ingest/skuParse';
import type { Product } from '../../src/types/db';

function prod(sku: string, name: string, category: string, price: number, extra: Partial<Product> = {}): Product {
  return {
    id: sku, sku, barcode: null, style_number: null, name, category, subcategory: null, gender: null,
    color: null, size_range: null, price, currency: 'AED', region: 'AE', image_url: null, product_url: null,
    description: null, key_features: null, technology: null, activity_type: null, data_status: 'demo',
    approval_status: 'approved', ...extra,
  };
}

const CATALOG: Product[] = [
  prod('SK-A', 'Skechers Cheap Walk', 'shoes', 150),
  prod('SK-B', 'Skechers Max Cushioning Elite', 'shoes', 389),
  prod('SK-PERF', 'Skechers Performance Crew Socks', 'socks', 45),
  prod('SK-NOSHOW', 'Skechers No-Show Socks', 'socks', 39),
  prod('SK-WORKSOCK', 'Skechers Work Crew Socks', 'socks', 49),
  prod('SK-CLEAN', 'Skechers Foam Cleaner', 'shoe_care', 55),
  prod('SK-PROTECT', 'Skechers Water & Stain Protector', 'shoe_care', 59),
];

function seg(sku: string) {
  return inferSegment(parseSku(sku));
}

describe('buildFallbackCandidates', () => {
  it('always returns 3 recommendations (upgrade + sock + care) for a footwear SKU', () => {
    const src = prod('SK-SRC', 'Skechers Walking Shoe', 'shoes', 239, { subcategory: 'walking', activity_type: 'walking' });
    const recs = buildFallbackCandidates(src, CATALOG, seg('232625'));
    expect(recs).toHaveLength(3);
    const types = recs.map((r) => r.relationship.relationship_type);
    expect(types).toContain('upgrade_to');
    expect(types).toContain('pairs_with');
    expect(types).toContain('recommended_add_on');
  });

  it('upgrade targets a higher-priced shoe', () => {
    const src = prod('SK-SRC', 'Skechers Walking Shoe', 'shoes', 239);
    const recs = buildFallbackCandidates(src, CATALOG, seg('232625'));
    const upgrade = recs.find((r) => r.relationship.relationship_type === 'upgrade_to');
    expect(upgrade?.product.price ?? 0).toBeGreaterThan(239);
  });

  it('segment-matches socks: slip-in → no-show, work → work socks', () => {
    const slipIn = prod('SK-SLIP', 'Skechers Slip-ins Walk', 'shoes', 259, { technology: 'Hands Free Slip-ins' });
    const slipRecs = buildFallbackCandidates(slipIn, CATALOG, seg('216202'));
    expect(slipRecs.find((r) => r.relationship.relationship_type === 'pairs_with')?.product.name).toMatch(/No-Show/);

    const work = prod('SK-WORK', 'Skechers Work Shoe', 'shoes', 289, { subcategory: 'work', activity_type: 'work' });
    const workRecs = buildFallbackCandidates(work, CATALOG, seg('77055'));
    expect(workRecs.find((r) => r.relationship.relationship_type === 'pairs_with')?.product.name).toMatch(/Work/);
  });

  it('material-matches care: knit/slip-in → protector', () => {
    const knit = prod('SK-KNIT', 'Skechers Slip-ins Knit', 'shoes', 259, { technology: 'stretch knit slip-in' });
    const recs = buildFallbackCandidates(knit, CATALOG, seg('216202'));
    expect(recs.find((r) => r.relationship.relationship_type === 'recommended_add_on')?.product.name).toMatch(/Protector/);
  });

  it('works end-to-end from a derived product', () => {
    const d = deriveProductFromSku('304351L')!; // known kids sample
    const recs = buildFallbackCandidates(d.product, CATALOG, d.segment);
    expect(recs.length).toBeGreaterThanOrEqual(2);
  });
});
