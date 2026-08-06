// Grounding-context builder for the AI Sales Coach. Assembles a strict,
// self-contained context from ONLY approved data (selected product, recommended
// product, the approved relationship reason/benefit, and the customer need) and
// renders it into a prompt the coach must stay within. No I/O, fully testable.
import type { CustomerNeed, Product } from '../../types/db';
import type { Recommendation } from '../recommendations/types';
import type { CoachContext, CoachProductContext } from './types';

function toProductContext(p: Product): CoachProductContext {
  return {
    name: p.name,
    category: p.category,
    technology: p.technology,
    keyFeatures: p.key_features ?? [],
    price: p.price,
    currency: p.currency,
  };
}

/**
 * Build the coach grounding context. `selected` is the product the customer
 * already chose; `rec` is the recommended next product with its approved,
 * stored reason/benefit.
 */
export function buildCoachContext(rec: Recommendation, selected: Product, need: CustomerNeed): CoachContext {
  const sel = toProductContext(selected);
  const recd = toProductContext(rec.product);
  const priceDelta =
    sel.price !== null && recd.price !== null ? Math.round((recd.price - sel.price) * 100) / 100 : null;
  return {
    need: { code: need.code, name: need.name },
    selected: sel,
    recommended: recd,
    recommendationType: rec.type,
    relationshipReason: rec.reason,
    customerBenefit: rec.customerBenefit,
    priceDelta,
  };
}

function featureList(features: string[]): string {
  return features.length > 0 ? features.join(', ') : '(none recorded)';
}

function priceLine(ctx: CoachContext): string {
  if (ctx.priceDelta === null) return 'Price difference: not available.';
  const { currency } = ctx.recommended;
  if (ctx.priceDelta > 0) return `Price difference: +${currency} ${ctx.priceDelta.toFixed(2)} vs the selected pair (demo price).`;
  if (ctx.priceDelta < 0) return `Price difference: ${currency} ${ctx.priceDelta.toFixed(2)} vs the selected pair (demo price).`;
  return 'Price difference: same price as the selected pair (demo price).';
}

/**
 * Render the grounding context into a strict prompt. This is what a real LLM
 * provider would receive; the mock provider reads the structured context object
 * directly. The guardrail block encodes the non-negotiable rules.
 */
export function contextToPrompt(ctx: CoachContext): string {
  return [
    'You are a retail sales coach for a Skechers store associate.',
    'Use ONLY the approved product facts below. Do NOT invent products, prices,',
    'features, technologies, availability, or claims. Do NOT make any medical,',
    'health, therapeutic, or biomechanical claims. Keep language about comfort,',
    'feel, fit, style, value, and protection.',
    '',
    `Customer need: ${ctx.need.name} (${ctx.need.code})`,
    `Recommendation type: ${ctx.recommendationType}`,
    '',
    'SELECTED PRODUCT (already chosen by the customer):',
    `- Name: ${ctx.selected.name}`,
    `- Category: ${ctx.selected.category}`,
    `- Technology: ${ctx.selected.technology ?? '(none recorded)'}`,
    `- Key features: ${featureList(ctx.selected.keyFeatures)}`,
    '',
    'RECOMMENDED PRODUCT (the next-best approved product):',
    `- Name: ${ctx.recommended.name}`,
    `- Category: ${ctx.recommended.category}`,
    `- Technology: ${ctx.recommended.technology ?? '(none recorded)'}`,
    `- Key features: ${featureList(ctx.recommended.keyFeatures)}`,
    `- ${priceLine(ctx)}`,
    '',
    'APPROVED RELATIONSHIP CONTEXT:',
    `- Reason: ${ctx.relationshipReason}`,
    `- Customer benefit: ${ctx.customerBenefit}`,
    '',
    'Produce four short sections: a discovery question, a feature-to-benefit',
    'translation, an objection handling response, and a closing question.',
  ].join('\n');
}
