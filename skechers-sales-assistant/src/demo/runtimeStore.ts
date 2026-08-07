// Runtime store for LIVE-INGESTED demo products. In the offline browser demo
// there is no backend, so a search-miss for a valid SKU is resolved by running
// the same derive + fallback-recommendation logic client-side (authorized
// samples / clearly-labelled derived demo records — never scraped) and keeping
// the result in memory for the session. In production this path instead calls a
// backend ingest endpoint (see src/lib/products.ts).
import type { Product } from '../types/db';
import type { RecommendationCandidate } from '../features/recommendations/types';
import { deriveProductFromSku } from '../lib/ingest/deriveProduct';
import { buildFallbackCandidates } from '../lib/ingest/fallbackRelationships';
import { isLikelySku } from '../lib/ingest/skuParse';

const products: Product[] = [];
const candidates = new Map<string, RecommendationCandidate[]>();

/** Live-ingested products added this session. */
export function runtimeProducts(): Product[] {
  return products;
}

/** Fallback recommendations generated for a live-ingested product. */
export function runtimeCandidatesFor(sku: string): RecommendationCandidate[] | undefined {
  return candidates.get(sku);
}

/**
 * Ingest a SKU into the runtime store (demo). Returns the product (existing or
 * newly derived) or null if the input is not a valid SKU. `catalog` supplies the
 * approved products the fallback mapper may recommend.
 */
export function ingestSkuIntoRuntime(input: string, catalog: Product[]): Product | null {
  if (!isLikelySku(input)) return null;
  const derived = deriveProductFromSku(input, { region: 'AE', currency: 'AED' });
  if (!derived) return null;

  const already = products.find((p) => p.sku === derived.product.sku) ?? catalog.find((p) => p.sku === derived.product.sku);
  if (already) return already;

  products.push(derived.product);
  const pool = [...catalog, ...products];
  candidates.set(derived.product.sku, buildFallbackCandidates(derived.product, pool, derived.segment));
  return derived.product;
}
