// Structured, deterministic sales guidance for a recommendation (DEMO MODE
// ONLY). Synthetic content composed with the recommendation's already-approved
// stored reason/benefit. No AI, no external content, no medical/biomechanical
// claims. Follows the Discover → Explain → Respond → Close framework.
import type { RecommendationType } from '../recommendations/types';

export interface GuidanceContent {
  selected_product_id: string;
  recommended_product_id: string;
  customer_need: string;
  recommendation_type: RecommendationType;
  // 1. Discover
  discovery_question: string;
  // 2. Explain
  customer_friendly_explanation: string;
  stored_reason: string;
  customer_benefit: string;
  // 3. Respond to concern
  common_objection: string;
  suggested_response: string;
  // 4. Close
  closing_question: string;
  content_status: 'demo';
  source_type: 'synthetic';
}
