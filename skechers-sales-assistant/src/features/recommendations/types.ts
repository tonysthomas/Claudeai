import type { Product } from '../../types/db';

export type RelationshipType =
  | 'upgrade_to'
  | 'alternative_to'
  | 'pairs_with'
  | 'recommended_add_on'
  | 'lower_price_option'
  | 'higher_price_option'
  | 'best_for_activity'
  | 'recommended_for_customer_need';

/** A row from product_relationships. */
export interface RelationshipRow {
  id: string;
  source_product_id: string;
  target_product_id: string;
  relationship_type: RelationshipType;
  priority: number;
  reason: string;
  customer_benefit: string;
  activity_type: string | null;
  customer_need: string | null;
  region: string;
  active: boolean;
  approval_status: string;
}

export type Availability = 'available' | 'limited' | 'out' | 'unknown';

/** A relationship joined to its target product and computed availability. */
export interface RecommendationCandidate {
  relationship: RelationshipRow;
  product: Product;
  availability: Availability;
}

/** Display category for a recommendation. */
export type RecommendationType = 'premium_upgrade' | 'alternative' | 'add_on';

/** The engine's output — all fields come from stored data (nothing generated). */
export interface Recommendation {
  relationshipId: string;
  type: RecommendationType;
  typeLabel: string;
  product: Product;
  reason: string;
  customerBenefit: string;
  priority: number;
  availability: Availability;
}
