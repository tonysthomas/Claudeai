// Data access for recommendations. Reads product_relationships (approved edges),
// their target products, and inventory availability. Also logs anonymous
// "displayed" events (no customer PII).
import { supabase } from './supabase';
import { PRODUCT_COLUMNS, type Product } from '../types/db';
import type { Availability, RecommendationCandidate, RelationshipRow } from '../features/recommendations/types';
import type { OutcomeAction } from '../features/outcomes/types';

const REL_COLUMNS =
  'id, source_product_id, target_product_id, relationship_type, priority, reason, customer_benefit, activity_type, customer_need, region, active, approval_status';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface InventoryRow {
  product_id: string;
  quantity: number;
  availability_status: string;
}

/** Reduce inventory rows to one availability value per product. */
export function computeAvailability(rows: InventoryRow[]): Map<string, Availability> {
  const agg = new Map<string, { available: boolean; limited: boolean }>();
  for (const row of rows) {
    const cur = agg.get(row.product_id) ?? { available: false, limited: false };
    if (row.availability_status !== 'demo_out' && (row.quantity ?? 0) > 0) cur.available = true;
    if (row.availability_status === 'demo_low') cur.limited = true;
    agg.set(row.product_id, cur);
  }
  const out = new Map<string, Availability>();
  for (const [id, v] of agg) out.set(id, v.available ? (v.limited ? 'limited' : 'available') : 'out');
  return out;
}

/**
 * Load approved recommendation candidates for a source product. Two queries
 * (relationships → target products) plus inventory, joined in memory — avoids
 * relying on a specific FK-embedding name.
 */
export async function getRecommendationCandidates(product: Product): Promise<RecommendationCandidate[]> {
  const { data: rels, error } = await supabase
    .from('product_relationships')
    .select(REL_COLUMNS)
    .eq('source_product_id', product.id)
    .eq('active', true)
    .in('approval_status', ['approved', 'demo'])
    .eq('region', product.region);
  if (error) throw new Error(error.message);

  const relationships = (rels ?? []) as RelationshipRow[];
  if (relationships.length === 0) return [];

  const targetIds = [...new Set(relationships.map((r) => r.target_product_id))];

  const { data: prods, error: pErr } = await supabase.from('products').select(PRODUCT_COLUMNS).in('id', targetIds);
  if (pErr) throw new Error(pErr.message);
  const productById = new Map((prods ?? []).map((p) => [(p as Product).id, p as Product]));

  const { data: inv } = await supabase
    .from('inventory')
    .select('product_id, quantity, availability_status')
    .in('product_id', targetIds);
  const availability = computeAvailability((inv ?? []) as InventoryRow[]);

  const candidates: RecommendationCandidate[] = [];
  for (const relationship of relationships) {
    const target = productById.get(relationship.target_product_id);
    if (!target) continue;
    candidates.push({ relationship, product: target, availability: availability.get(target.id) ?? 'unknown' });
  }
  return candidates;
}

/**
 * Record that recommendations were displayed. No customer PII. In production the
 * `associateId`/`storeId` come from the authenticated session/profile (RLS
 * enforces they match the caller); in DEMO_MODE they are null (anonymous, only
 * allowed while the database is in demo mode). Best-effort — never blocks the UI.
 */
export async function logRecommendationsDisplayed(params: {
  selected: Product;
  needId: string | null;
  associateId: string | null;
  storeId: string | null;
  recommendations: Array<{ relationshipId: string; product: Product }>;
}): Promise<void> {
  if (params.recommendations.length === 0) return;
  const needId = params.needId && UUID_RE.test(params.needId) ? params.needId : null;
  const associateId = params.associateId && UUID_RE.test(params.associateId) ? params.associateId : null;
  const storeId = params.storeId && UUID_RE.test(params.storeId) ? params.storeId : null;
  const rows = params.recommendations.map((r) => ({
    selected_product_id: params.selected.id,
    recommended_product_id: r.product.id,
    relationship_id: r.relationshipId,
    customer_need_id: needId,
    associate_id: associateId,
    store_id: storeId,
    action: 'displayed' as const,
    sale_completed: false,
  }));
  const { error } = await supabase.from('recommendation_events').insert(rows);
  if (error) {
    // eslint-disable-next-line no-console
    console.warn('[recommendations] display log failed:', error.message);
  }
}

/**
 * Record an associate's OUTCOME for a single recommendation (Phase 7). Same
 * RLS-safe, PII-free rules as display logging: in production the associate/store
 * come from the session (RLS enforces they match); in DEMO_MODE they are null.
 * Returns an error string on failure so the UI can surface a retry.
 */
export async function logRecommendationOutcome(params: {
  selected: Product;
  recommended: Product;
  relationshipId: string | null;
  needId: string | null;
  associateId: string | null;
  storeId: string | null;
  action: OutcomeAction;
}): Promise<{ error: string | null }> {
  const uuidOrNull = (v: string | null) => (v && UUID_RE.test(v) ? v : null);
  const { error } = await supabase.from('recommendation_events').insert({
    selected_product_id: params.selected.id,
    recommended_product_id: params.recommended.id,
    relationship_id: uuidOrNull(params.relationshipId),
    customer_need_id: uuidOrNull(params.needId),
    associate_id: uuidOrNull(params.associateId),
    store_id: uuidOrNull(params.storeId),
    action: params.action,
    sale_completed: params.action === 'added_to_basket',
  });
  return { error: error ? error.message : null };
}
