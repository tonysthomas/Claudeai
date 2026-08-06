// Deterministic, rules-based recommendation engine. Pure function — no I/O, no
// AI, no generated claims. Given a selected product, a customer need, and the
// candidate relationships (each joined to its target product + availability), it
// returns up to three prioritized recommendations: one premium upgrade, one
// alternative, and one socks/shoe-care add-on.
import type { Product } from '../../types/db';
import type {
  Recommendation,
  RecommendationCandidate,
  RecommendationType,
} from './types';

const APPROVED_STATUSES = new Set(['approved', 'demo']);
const ADD_ON_CATEGORIES = new Set(['socks', 'shoe_care']);

const TYPE_LABEL: Record<RecommendationType, string> = {
  premium_upgrade: 'Premium upgrade',
  alternative: 'Alternative',
  add_on: 'Add-on',
};

// Fixed slot order → at most one recommendation per slot, max three total.
const SLOT_ORDER: RecommendationType[] = ['premium_upgrade', 'alternative', 'add_on'];

/** Is a candidate relevant to the selected need (matches need, its activity, or is general)? */
function isNeedRelevant(candidate: RecommendationCandidate, need: string | null): boolean {
  const r = candidate.relationship;
  if (!need) return true;
  return r.customer_need === need || r.customer_need === null || r.activity_type === need;
}

/** Which display slot (if any) a candidate belongs to. */
function slotFor(candidate: RecommendationCandidate): RecommendationType | null {
  const t = candidate.relationship.relationship_type;
  if (t === 'upgrade_to') return 'premium_upgrade';
  if (t === 'alternative_to') return 'alternative';
  if ((t === 'pairs_with' || t === 'recommended_add_on') && ADD_ON_CATEGORIES.has(candidate.product.category)) {
    return 'add_on';
  }
  return null;
}

/**
 * Build the prioritized recommendation list.
 *
 * Rules (deterministic):
 *  1. Exclude the selected product itself (never recommend to itself).
 *  2. Keep only active, approved/demo relationships in the product's region
 *     whose target is not out of stock.
 *  3. Drop `recommended_for_customer_need` candidates for a different need.
 *  4. Slot candidates into premium upgrade / alternative / socks-or-care add-on.
 *  5. Within a slot, order: need-relevant first → priority asc → price asc →
 *     SKU asc (fully deterministic tie-breaks).
 *  6. Take the top one per slot, deduping target products; at most three.
 *  7. reason and customer_benefit are copied verbatim from stored data.
 */
export function buildRecommendations(
  selected: Product,
  need: string | null,
  candidates: RecommendationCandidate[],
): Recommendation[] {
  const eligible = candidates.filter((c) => {
    const r = c.relationship;
    if (c.product.id === selected.id) return false; // rule 1
    if (!r.active) return false;
    if (!APPROVED_STATUSES.has(r.approval_status)) return false;
    if (r.region !== selected.region) return false;
    if (c.availability === 'out') return false; // rule 2
    if (r.relationship_type === 'recommended_for_customer_need' && need && r.customer_need && r.customer_need !== need) {
      return false; // rule 3
    }
    return true;
  });

  const bySlot: Record<RecommendationType, RecommendationCandidate[]> = {
    premium_upgrade: [],
    alternative: [],
    add_on: [],
  };
  for (const c of eligible) {
    const slot = slotFor(c);
    if (slot) bySlot[slot].push(c);
  }

  const compare = (a: RecommendationCandidate, b: RecommendationCandidate): number => {
    const na = isNeedRelevant(a, need) ? 0 : 1;
    const nb = isNeedRelevant(b, need) ? 0 : 1;
    if (na !== nb) return na - nb;
    if (a.relationship.priority !== b.relationship.priority) return a.relationship.priority - b.relationship.priority;
    const pa = a.product.price ?? Number.POSITIVE_INFINITY;
    const pb = b.product.price ?? Number.POSITIVE_INFINITY;
    if (pa !== pb) return pa - pb;
    return a.product.sku.localeCompare(b.product.sku);
  };

  const result: Recommendation[] = [];
  const seenProducts = new Set<string>();
  for (const slot of SLOT_ORDER) {
    const sorted = [...bySlot[slot]].sort(compare);
    for (const c of sorted) {
      if (seenProducts.has(c.product.id)) continue; // rule 6 dedupe
      seenProducts.add(c.product.id);
      result.push({
        relationshipId: c.relationship.id,
        type: slot,
        typeLabel: TYPE_LABEL[slot],
        product: c.product,
        reason: c.relationship.reason,
        customerBenefit: c.relationship.customer_benefit,
        priority: c.relationship.priority,
        availability: c.availability,
      });
      break; // one per slot
    }
  }
  return result.slice(0, 3);
}
