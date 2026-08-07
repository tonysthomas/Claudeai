// Normalizer: map an ExtractedSkechersProduct into the canonical import row the
// Phase 3 pipeline consumes, plus a derived price tier. Maps Skechers taxonomy
// (Footwear/Accessories → shoes/socks/shoe_care), normalizes gender/activity,
// and stamps provenance: source_type='skechers_official_web', source_url,
// source_identifier (style), source_version (synced_at), region, currency.
import type { ExtractedSkechersProduct } from './extractor';
import type { IngestOptions, NormalizedIngestRow, PriceTier } from './types';

/** Map Skechers category + subcategory to our internal product category. */
export function mapCategory(category: string, subcategory: string | null): string {
  const c = category.toLowerCase();
  const s = (subcategory ?? '').toLowerCase();
  if (c === 'accessories') {
    if (s.includes('sock')) return 'socks';
    if (s.includes('care') || s.includes('clean')) return 'shoe_care';
    return 'accessories';
  }
  // Footwear and anything else falls to shoes.
  return 'shoes';
}

/** Lowercase a Skechers subcategory into our subcategory slug. */
function mapSubcategory(subcategory: string | null): string | null {
  if (!subcategory) return null;
  return subcategory.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function mapGender(gender: string | null): string | null {
  if (!gender) return null;
  const g = gender.toLowerCase();
  if (g.startsWith('men')) return 'men';
  if (g.startsWith('women')) return 'women';
  if (g.startsWith('kid')) return 'kids';
  return 'unisex';
}

function mapActivity(activity: string | null, category: string): string | null {
  if (activity) return activity.toLowerCase();
  return category === 'shoes' ? 'casual' : null;
}

/** Regional price-tier thresholds (upper bounds for value/core). Falls back to a default band. */
const DEFAULT_TIER = { value: 60, core: 100 };
const PRICE_TIERS: Record<string, { value: number; core: number }> = {
  AE: { value: 200, core: 330 },
  US: { value: 60, core: 100 },
  DEMO: { value: 60, core: 100 },
};

export function priceTier(price: number | null, region: string): PriceTier {
  if (price === null) return 'core';
  const t = PRICE_TIERS[region] ?? DEFAULT_TIER;
  if (price < t.value) return 'value';
  if (price <= t.core) return 'core';
  return 'premium';
}

/**
 * Build the canonical import row. approval_status is left to the importer's safe
 * default (pending_review); the pipeline applies an explicit 'approved' action
 * only when --auto-approve is passed (never silently here).
 */
export function normalizeProduct(p: ExtractedSkechersProduct, opts: IngestOptions): NormalizedIngestRow {
  const category = mapCategory(p.category, p.subcategory);
  const region = p.source_region ?? opts.region;
  const currency = p.currency ?? opts.currency;
  const description = p.customer_description ?? p.description;

  const row: Record<string, unknown> = {
    sku: p.sku,
    style_number: p.style_number,
    name: p.name,
    category,
    subcategory: mapSubcategory(p.subcategory),
    gender: mapGender(p.gender),
    color: p.color,
    size_range: p.size_range,
    price: p.price,
    currency,
    region,
    image_url: p.image_url,
    product_url: p.product_url,
    description,
    key_features: p.key_features,
    technology: p.technology,
    activity_type: mapActivity(p.activity_type, category),
    // Provenance — Method 1.
    source_type: 'skechers_official_web',
    source_url: p.product_url,
    source_identifier: p.style_number,
    source_version: p.source_version ?? opts.syncedAt,
  };

  return { row, priceTier: priceTier(p.price, region), sku: p.sku };
}
