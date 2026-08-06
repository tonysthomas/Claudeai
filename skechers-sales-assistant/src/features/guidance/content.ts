// Deterministic synthetic guidance templates (DEMO MODE ONLY). Keyed by customer
// need and recommendation type. Language stays on comfort / feel / style / value
// / protection — no medical, biomechanical, or unsupported claims.
import type { CustomerNeed } from '../../types/db';
import type { Recommendation, RecommendationType } from '../recommendations/types';
import type { GuidanceContent } from './types';

// 1. Discover — a question keyed by the selected customer need.
const DISCOVERY: Record<string, string> = {
  everyday_comfort: 'What will they mostly be wearing these for day to day?',
  walking: 'About how much walking do they do on a typical day?',
  work_long_hours: 'How many hours are they on their feet during a shift?',
  fitness: 'What kind of workouts or training are they doing?',
  travel: 'Are they after something light and easy to pack?',
  style: 'What look are they going for with these?',
  budget: 'What sort of budget are they hoping to stay within today?',
  maximum_cushioning: 'Do they prefer a soft, plush feel underfoot?',
  support: 'Do they like a more secure, structured fit?',
};
const DISCOVERY_DEFAULT = 'What matters most to them in a shoe today?';

// 2. Explain — a customer-friendly framing keyed by recommendation type.
const EXPLANATION: Record<RecommendationType, (name: string) => string> = {
  premium_upgrade: (name) =>
    `“${name} is a step up from the pair they picked — a bit more cushioning and premium materials for a nicer everyday feel.”`,
  alternative: (name) =>
    `“If they’re weighing it up, ${name} is a great alternative — a similar fit with a slightly different look and feel.”`,
  add_on: (name) =>
    `“${name} pairs perfectly with their shoes to round out the setup and keep them comfortable and looking after their purchase.”`,
};

// 3. Respond to concern — a common objection + a suggested response by type.
const OBJECTION: Record<RecommendationType, { objection: string; response: string }> = {
  premium_upgrade: {
    objection: '“It’s a bit more than I wanted to spend.”',
    response:
      '“Totally understandable — the extra cushioning and materials also tend to last well, so a lot of customers feel it’s worth it over time. Want to feel the difference?”',
  },
  alternative: {
    objection: '“How is this different from the first pair?”',
    response:
      '“Great question — same comfortable fit, just a different style and colourway. Happy to set them side by side so they can compare.”',
  },
  add_on: {
    objection: '“Do I really need these as well?”',
    response:
      '“No pressure at all — the right socks and care just help the shoes feel good and stay looking new. Many customers pick them up together.”',
  },
};

// 4. Close — a closing question keyed by the customer need.
const CLOSING: Record<string, string> = {
  walking: 'Would they like to walk around in a pair to see how they feel?',
  work_long_hours: 'Shall we get their size so they’re set for their next shift?',
  fitness: 'Want to try a pair on before their next session?',
  budget: 'Would they like me to add these to the basket at this price?',
};
const CLOSING_DEFAULT = 'Would they like to try these on today?';

/**
 * Build the full guidance object for a recommendation + need. Pure and
 * deterministic; reuses the recommendation's stored (approved) reason/benefit.
 */
export function buildGuidance(rec: Recommendation, need: CustomerNeed, selectedProductId: string): GuidanceContent {
  return {
    selected_product_id: selectedProductId,
    recommended_product_id: rec.product.id,
    customer_need: need.code,
    recommendation_type: rec.type,
    discovery_question: DISCOVERY[need.code] ?? DISCOVERY_DEFAULT,
    customer_friendly_explanation: EXPLANATION[rec.type](rec.product.name),
    stored_reason: rec.reason,
    customer_benefit: rec.customerBenefit,
    common_objection: OBJECTION[rec.type].objection,
    suggested_response: OBJECTION[rec.type].response,
    closing_question: CLOSING[need.code] ?? CLOSING_DEFAULT,
    content_status: 'demo',
    source_type: 'synthetic',
  };
}
