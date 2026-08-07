// Universal fallback recommendation mapper. For ANY footwear product it selects
// up to three recommendations FROM AN EXISTING APPROVED CATALOG (never invents
// products): an upgrade (higher-priced shoe), a segment-matched add-on sock, and
// a material-matched shoe-care item. Pure + browser-safe; shared by the app's
// live search and the node ingestion pipeline. Reasons/benefits are factual,
// non-medical, generated from approved business rules.
import type { Product } from '../../types/db';
import type { RecommendationCandidate, RelationshipRow, RelationshipType } from '../../features/recommendations/types';
import type { SkuSegment } from './skuParse';

function edge(source: Product, target: Product, type: RelationshipType, reason: string, benefit: string, need: string | null): RelationshipRow {
  return {
    id: `${source.sku}->${target.sku}:${type}`,
    source_product_id: source.id,
    target_product_id: target.id,
    relationship_type: type,
    priority: 1,
    reason,
    customer_benefit: benefit,
    activity_type: source.activity_type,
    customer_need: need,
    region: source.region,
    active: true,
    approval_status: 'approved',
  };
}

const price = (p: Product) => p.price ?? 0;
const nameHas = (p: Product, ...needles: string[]) => {
  const hay = `${p.name} ${p.subcategory ?? ''} ${p.technology ?? ''}`.toLowerCase();
  return needles.some((n) => hay.includes(n));
};

/** Pick a segment-matched sock from the catalog, with sensible fallbacks. */
function pickSock(catalog: Product[], segment: SkuSegment, source: Product): Product | undefined {
  const socks = catalog.filter((p) => p.category === 'socks' && p.sku !== source.sku);
  if (socks.length === 0) return undefined;
  const byPref = (pred: (p: Product) => boolean) => socks.find(pred);
  if (segment.ageSegment === 'kids') return byPref((p) => nameHas(p, 'kid', 'youth')) ?? byPref((p) => nameHas(p, 'no-show', 'no show')) ?? socks[0];
  if (segment.subcategory === 'work') return byPref((p) => nameHas(p, 'work')) ?? byPref((p) => nameHas(p, 'crew')) ?? byPref((p) => nameHas(p, 'performance')) ?? socks[0];
  // slip-in / low-profile shoes → no-show; otherwise performance.
  if (nameHas(source, 'slip-in', 'slip in')) return byPref((p) => nameHas(p, 'no-show', 'no show')) ?? byPref((p) => nameHas(p, 'performance')) ?? socks[0];
  return byPref((p) => nameHas(p, 'performance')) ?? socks[0];
}

/** Pick a material-matched shoe-care item, with fallbacks. */
function pickCare(catalog: Product[], source: Product): Product | undefined {
  const care = catalog.filter((p) => p.category === 'shoe_care');
  if (care.length === 0) return undefined;
  const knit = nameHas(source, 'knit', 'mesh', 'stretch', 'slip-in');
  if (knit) return care.find((p) => nameHas(p, 'protector', 'water', 'stain', 'spray')) ?? care[0];
  return care.find((p) => nameHas(p, 'clean', 'cleaner', 'foam')) ?? care[0];
}

/** Pick the nearest higher-priced shoe (upgrade); fall back to the most premium. */
function pickUpgrade(catalog: Product[], source: Product): Product | undefined {
  const shoes = catalog.filter((p) => p.category === 'shoes' && p.sku !== source.sku && p.price !== null);
  if (shoes.length === 0) return undefined;
  const dearer = shoes.filter((p) => price(p) > price(source)).sort((a, b) => price(a) - price(b));
  if (dearer[0]) return dearer[0];
  return [...shoes].sort((a, b) => price(b) - price(a))[0];
}

/**
 * Build up to three fallback recommendations for a footwear product. `catalog` is
 * the pool of existing approved products to recommend from.
 */
export function buildFallbackCandidates(source: Product, catalog: Product[], segment: SkuSegment): RecommendationCandidate[] {
  const need = segment.activityType === 'work' ? 'work_long_hours' : segment.activityType === 'walking' ? 'walking' : null;
  const out: RecommendationCandidate[] = [];

  const upgrade = pickUpgrade(catalog, source);
  if (upgrade) {
    out.push({ relationship: edge(source, upgrade, 'upgrade_to', 'A higher-tier Skechers option.', 'A step up in cushioning and materials.', need), product: upgrade, availability: 'available' });
  }
  const sock = pickSock(catalog, segment, source);
  if (sock) {
    out.push({ relationship: edge(source, sock, 'pairs_with', 'Pairs with Skechers socks.', 'Comfort and a better fit during wear.', need), product: sock, availability: 'available' });
  }
  const care = pickCare(catalog, source);
  if (care) {
    out.push({ relationship: edge(source, care, 'recommended_add_on', 'Protect and care for the shoes.', 'Keeps them looking new for longer.', null), product: care, availability: 'available' });
  }
  return out;
}
