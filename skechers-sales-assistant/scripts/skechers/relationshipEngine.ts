// Automatic relationship rule engine (Method 1). Turns a batch of normalized
// ingested products into APPROVED-BUSINESS-RULE recommendation edges. This is the
// "generated from approved business rules" path CLAUDE.md permits — it never
// invents product facts; it only wires typed relationships between real products
// already in the batch, with deterministic, non-medical reasons/benefits.

export interface IngestProduct {
  sku: string;
  name: string;
  category: string; // shoes | socks | shoe_care | accessories
  subcategory: string | null; // walking | work | ...
  activity_type: string | null; // walking | work | running | casual
  technology: string | null;
  price: number | null;
  priceTier: 'value' | 'core' | 'premium';
  region: string;
}

export interface GeneratedRelationship {
  sourceSku: string;
  targetSku: string;
  relationship_type:
    | 'upgrade_to'
    | 'alternative_to'
    | 'pairs_with'
    | 'recommended_add_on'
    | 'lower_price_option'
    | 'higher_price_option';
  priority: number;
  reason: string;
  customer_benefit: string;
  customer_need: string | null;
  activity_type: string | null;
}

const nameHas = (p: IngestProduct, ...needles: string[]) => {
  const hay = `${p.name} ${p.subcategory ?? ''} ${p.technology ?? ''}`.toLowerCase();
  return needles.some((n) => hay.includes(n));
};

/**
 * Fallback universal mapper: for ANY footwear product, generate up to 3 valid
 * recommendations from an anchor pool — a higher-tier upgrade, a segment-matched
 * add-on sock, and a material-matched shoe-care item. Used when a product has no
 * curated relationships (e.g. a live-ingested arbitrary SKU).
 */
export function generateFallbackRelationships(product: IngestProduct, anchors: IngestProduct[]): GeneratedRelationship[] {
  const price = (p: IngestProduct) => p.price ?? 0;
  const need = needFor(product);
  const out: GeneratedRelationship[] = [];

  const shoes = anchors.filter((p) => p.category === 'shoes' && p.sku !== product.sku && p.price !== null);
  const dearer = shoes.filter((p) => price(p) > price(product)).sort((a, b) => price(a) - price(b));
  const upgrade = dearer[0] ?? [...shoes].sort((a, b) => price(b) - price(a))[0];
  if (upgrade) {
    out.push({ sourceSku: product.sku, targetSku: upgrade.sku, relationship_type: 'upgrade_to', priority: 1,
      reason: 'A higher-tier Skechers option.', customer_benefit: 'A step up in cushioning and materials.', customer_need: need, activity_type: product.activity_type });
  }

  const socks = anchors.filter((p) => p.category === 'socks' && p.sku !== product.sku);
  const kids = /kids?/.test(`${product.subcategory} ${product.name}`.toLowerCase());
  const sock =
    (kids ? socks.find((p) => nameHas(p, 'kid', 'youth', 'no-show')) : undefined) ??
    (product.subcategory === 'work' ? socks.find((p) => nameHas(p, 'work')) ?? socks.find((p) => nameHas(p, 'crew')) : undefined) ??
    (nameHas(product, 'slip-in') ? socks.find((p) => nameHas(p, 'no-show')) : undefined) ??
    socks.find((p) => nameHas(p, 'performance')) ??
    socks[0];
  if (sock) {
    out.push({ sourceSku: product.sku, targetSku: sock.sku, relationship_type: 'pairs_with', priority: 2,
      reason: 'Pairs with Skechers socks.', customer_benefit: 'Comfort and a better fit during wear.', customer_need: need, activity_type: product.activity_type });
  }

  const care = anchors.filter((p) => p.category === 'shoe_care');
  const knit = nameHas(product, 'knit', 'mesh', 'stretch', 'slip-in');
  const careItem = (knit ? care.find((p) => nameHas(p, 'protector', 'water', 'stain', 'spray')) : care.find((p) => nameHas(p, 'clean', 'foam'))) ?? care[0];
  if (careItem) {
    out.push({ sourceSku: product.sku, targetSku: careItem.sku, relationship_type: 'recommended_add_on', priority: 3,
      reason: 'Protect and care for the shoes.', customer_benefit: 'Keeps them looking new for longer.', customer_need: null, activity_type: null });
  }

  return out;
}

function needFor(p: IngestProduct): string | null {
  const key = `${p.subcategory ?? ''} ${p.activity_type ?? ''}`.toLowerCase();
  if (key.includes('walk')) return 'walking';
  if (key.includes('work')) return 'work_long_hours';
  if (key.includes('run') || key.includes('fitness')) return 'fitness';
  return null;
}

const has = (tech: string | null, needle: string) => (tech ?? '').toLowerCase().includes(needle);

/**
 * Generate relationships for a batch. Rules:
 *  - Walking shoe → add-on performance socks · care shoe-cleaner · upgrade to a
 *    premium cushion model.
 *  - technology CONTAINS 'Slip-ins' → add-on no-show socks.
 *  - Work activity → upgrade to a slip-resistant work model.
 *  - Price tiers → lower_price_option / higher_price_option among shoes.
 *  - Same-subcategory nearest price → alternative_to (populates the alt slot).
 */
export function generateRelationships(products: IngestProduct[]): GeneratedRelationship[] {
  const shoes = products.filter((p) => p.category === 'shoes');
  const socksPerf = products.find((p) => p.category === 'socks' && /performance/i.test(p.name));
  const socksNoShow = products.find((p) => p.category === 'socks' && /no-?show/i.test(p.name));
  const cleaner = products.find((p) => p.category === 'shoe_care');
  const premiumWalk = shoes.find((p) => (p.subcategory === 'walking' || p.activity_type === 'walking') && p.priceTier === 'premium');
  const workModel = shoes.find((p) => p.subcategory === 'work' || p.activity_type === 'work');

  const out: GeneratedRelationship[] = [];
  const seen = new Set<string>();
  const add = (r: GeneratedRelationship) => {
    if (r.sourceSku === r.targetSku) return;
    const key = `${r.sourceSku}->${r.targetSku}:${r.relationship_type}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(r);
  };

  const shoesByPrice = [...shoes].filter((s) => s.price !== null).sort((a, b) => (a.price ?? 0) - (b.price ?? 0));

  for (const s of shoes) {
    const need = needFor(s);
    const isWalking = s.subcategory === 'walking' || s.activity_type === 'walking';
    const isWork = s.subcategory === 'work' || s.activity_type === 'work';

    // Add-on: performance socks (walking shoes).
    if (isWalking && socksPerf) {
      add({ sourceSku: s.sku, targetSku: socksPerf.sku, relationship_type: 'pairs_with', priority: 1,
        reason: 'Pairs with performance socks.', customer_benefit: 'Moisture-wicking comfort during walks.', customer_need: need, activity_type: s.activity_type });
    }
    // Add-on: no-show socks (slip-ins technology).
    if (has(s.technology, 'slip-in') && socksNoShow) {
      add({ sourceSku: s.sku, targetSku: socksNoShow.sku, relationship_type: 'pairs_with', priority: 2,
        reason: 'Slip-in styles pair well with no-show socks.', customer_benefit: 'A low-profile fit that stays hidden.', customer_need: need, activity_type: s.activity_type });
    }
    // Care: shoe cleaner (all shoes).
    if (cleaner) {
      add({ sourceSku: s.sku, targetSku: cleaner.sku, relationship_type: 'recommended_add_on', priority: 3,
        reason: 'Add a shoe cleaner kit.', customer_benefit: 'Keeps shoes looking new for longer.', customer_need: null, activity_type: null });
    }
    // Upgrade: premium cushion model (walking).
    if (isWalking && premiumWalk) {
      add({ sourceSku: s.sku, targetSku: premiumWalk.sku, relationship_type: 'upgrade_to', priority: 1,
        reason: 'Premium cushioned upgrade for longer walks.', customer_benefit: 'More cushioning and support for extended wear.', customer_need: need, activity_type: s.activity_type });
    }
    // Upgrade: slip-resistant work model (work activity).
    if (isWork && workModel) {
      add({ sourceSku: s.sku, targetSku: workModel.sku, relationship_type: 'upgrade_to', priority: 1,
        reason: 'Slip-resistant work upgrade for long shifts.', customer_benefit: 'Added grip and support on hard floors.', customer_need: 'work_long_hours', activity_type: 'work' });
    }

    // Alternative + price options among shoes (nearest cheaper / more expensive).
    const idx = shoesByPrice.findIndex((x) => x.sku === s.sku);
    if (idx !== -1) {
      const cheaper = [...shoesByPrice.slice(0, idx)].reverse().find((x) => x.sku !== s.sku);
      const dearer = shoesByPrice.slice(idx + 1).find((x) => x.sku !== s.sku);
      if (cheaper) {
        add({ sourceSku: s.sku, targetSku: cheaper.sku, relationship_type: 'lower_price_option', priority: 5,
          reason: 'A lower-priced option.', customer_benefit: 'Similar style at a friendlier price.', customer_need: need, activity_type: s.activity_type });
      }
      if (dearer) {
        add({ sourceSku: s.sku, targetSku: dearer.sku, relationship_type: 'higher_price_option', priority: 5,
          reason: 'A higher-tier option.', customer_benefit: 'A step up in cushioning and materials.', customer_need: need, activity_type: s.activity_type });
        // Also expose the nearest dearer same-subcategory shoe as an alternative.
        const altSameSub = shoesByPrice.slice(idx + 1).find((x) => x.sku !== s.sku && x.subcategory === s.subcategory && x.sku !== premiumWalk?.sku);
        if (altSameSub) {
          add({ sourceSku: s.sku, targetSku: altSameSub.sku, relationship_type: 'alternative_to', priority: 4,
            reason: 'A similar-priced alternative.', customer_benefit: 'Comparable comfort in a different style.', customer_need: need, activity_type: s.activity_type });
        }
      }
    }
  }
  return out;
}
