import { describe, it, expect } from 'vitest';
import { buildCoachContext, contextToPrompt } from '../../src/features/coaching/context';
import { checkProhibitedClaims, checkGrounding, validateCoachResponse } from '../../src/features/coaching/guardrails';
import { classifyQuestion, createMockCoachProvider, mockCoachProvider } from '../../src/features/coaching/mockProvider';
import { runCoach, runAsk, getCoaching, askCoach, selectCoachProvider } from '../../src/features/coaching/service';
import { guidanceToAnswer } from '../../src/features/coaching/fallback';
import { guidanceToCoachResponse } from '../../src/features/coaching/fallback';
import { buildGuidance } from '../../src/features/guidance/content';
import type { Product, CustomerNeed } from '../../src/types/db';
import type { Recommendation, RecommendationType } from '../../src/features/recommendations/types';
import type { CoachContext } from '../../src/features/coaching/types';

const selected: Product = {
  id: 'p1', sku: 'SHOE-WALK-001', barcode: null, style_number: null, name: 'Demo Walk Comfort 1',
  category: 'shoes', subcategory: 'walking', gender: 'unisex', color: 'Grey', size_range: 'US 7-12',
  price: 59.99, currency: 'DEMO', region: 'DEMO', image_url: null, product_url: null,
  description: null, key_features: ['Cushioned midsole', 'Breathable upper'], technology: 'Demo Air Cushion',
  activity_type: 'walking', data_status: 'demo', approval_status: 'demo',
};
const recommended: Product = {
  ...selected, id: 'p2', sku: 'SHOE-WALK-002', name: 'Demo Walk Comfort 2', price: 84.99,
  key_features: ['Plush cushioning', 'Premium knit upper'], technology: 'Demo Air Cushion Max',
};
const addOn: Product = {
  ...selected, id: 'p3', sku: 'CARE-INSOLE-001', name: 'Demo Fresh Insole 1', category: 'shoe_care',
  price: 12.99, key_features: ['Odour control', 'Extra cushioning'], technology: 'Demo Comfort Insole',
};
const need: CustomerNeed = { id: 'n1', code: 'walking', name: 'Walking', description: null, active: true };

function rec(type: RecommendationType, product: Product, reason: string, benefit: string): Recommendation {
  return { relationshipId: 'r1', type, typeLabel: type, product, reason, customerBenefit: benefit, priority: 1, availability: 'available' };
}
const upgradeRec = rec('premium_upgrade', recommended, 'Premium walking upgrade with more cushioning.', 'Softer, more comfortable on long walks.');
const addOnRec = rec('add_on', addOn, 'Pairs with their shoes to keep them fresh.', 'Keeps shoes comfortable and fresh for longer.');

describe('buildCoachContext', () => {
  it('assembles only approved product attributes and a price delta', () => {
    const ctx = buildCoachContext(upgradeRec, selected, need);
    expect(ctx.selected.name).toBe('Demo Walk Comfort 1');
    expect(ctx.recommended.technology).toBe('Demo Air Cushion Max');
    expect(ctx.recommended.keyFeatures).toEqual(['Plush cushioning', 'Premium knit upper']);
    expect(ctx.recommendationType).toBe('premium_upgrade');
    expect(ctx.relationshipReason).toBe('Premium walking upgrade with more cushioning.');
    expect(ctx.customerBenefit).toBe('Softer, more comfortable on long walks.');
    expect(ctx.priceDelta).toBeCloseTo(25.0);
    expect(ctx.need).toEqual({ code: 'walking', name: 'Walking' });
  });

  it('handles missing prices without inventing a delta', () => {
    const noPrice = { ...recommended, price: null };
    const ctx = buildCoachContext(rec('premium_upgrade', noPrice, 'r', 'b'), selected, need);
    expect(ctx.priceDelta).toBeNull();
  });
});

describe('contextToPrompt', () => {
  it('includes every product attribute and the guardrail rules', () => {
    const prompt = contextToPrompt(buildCoachContext(upgradeRec, selected, need));
    expect(prompt).toContain('Demo Walk Comfort 1');
    expect(prompt).toContain('Demo Walk Comfort 2');
    expect(prompt).toContain('Demo Air Cushion Max');
    expect(prompt).toContain('Plush cushioning, Premium knit upper');
    expect(prompt).toContain('+DEMO 25.00');
    expect(prompt).toContain('Premium walking upgrade with more cushioning.');
    expect(prompt).toMatch(/medical/i);
    expect(prompt).toMatch(/Do NOT invent/i);
  });
});

describe('guardrails', () => {
  it('rejects medical / health / biomechanical claims', () => {
    expect(checkProhibitedClaims('These cure plantar fasciitis and relieve pain.').ok).toBe(false);
    expect(checkProhibitedClaims('Clinically proven orthotic support.').ok).toBe(false);
    expect(checkProhibitedClaims('A softer, more comfortable feel on long walks.').ok).toBe(true);
  });

  it('flags a technology not present in the grounding context', () => {
    const ctx = buildCoachContext(upgradeRec, selected, need);
    const bad = checkGrounding('Demo Quantum Boost gives amazing energy return.', ctx);
    expect(bad.ok).toBe(false);
    const good = checkGrounding('Demo Air Cushion Max adds a plush step.', ctx);
    expect(good.ok).toBe(true);
  });

  it('validates a full response across all sections', async () => {
    const ctx = buildCoachContext(upgradeRec, selected, need);
    const resp = await mockCoachProvider.generate(ctx);
    expect(validateCoachResponse(resp, ctx).ok).toBe(true);
  });
});

describe('mock provider', () => {
  it('returns four grounded sections built from context facts', async () => {
    const ctx = buildCoachContext(upgradeRec, selected, need);
    const resp = await mockCoachProvider.generate(ctx);
    expect(resp.source).toBe('ai_demo');
    expect(resp.sections.map((s) => s.key)).toEqual(['discovery', 'feature_benefit', 'objection', 'closing']);
    const body = resp.sections.map((s) => s.body).join(' ');
    expect(body).toContain('Demo Walk Comfort 2');
    expect(body).toContain('Plush cushioning');
    expect(body).toContain('DEMO 25.00');
  });

  it('varies the closing line by recommendation type', async () => {
    const up = await mockCoachProvider.generate(buildCoachContext(upgradeRec, selected, need));
    const add = await mockCoachProvider.generate(buildCoachContext(addOnRec, selected, need));
    expect(up.sections.find((s) => s.key === 'closing')?.body).toMatch(/feel the difference/i);
    expect(add.sections.find((s) => s.key === 'closing')?.body).toMatch(/all set from day one/i);
  });
});

describe('service fallback', () => {
  const fallback = guidanceToCoachResponse(buildGuidance(upgradeRec, need, selected.id), 'test');
  const ctx: CoachContext = buildCoachContext(upgradeRec, selected, need);

  it('uses the AI response when the provider succeeds', async () => {
    const r = await runCoach(ctx, { provider: createMockCoachProvider(), fallback });
    expect(r.usedFallback).toBe(false);
    expect(r.error).toBeNull();
    expect(r.response.source).toBe('ai_demo');
  });

  it('falls back to Phase 9 templates when the provider errors', async () => {
    const r = await runCoach(ctx, { provider: createMockCoachProvider({ failMode: 'error' }), fallback });
    expect(r.usedFallback).toBe(true);
    expect(r.response.source).toBe('fallback_template');
    expect(r.error).toMatch(/error/i);
  });

  it('falls back on timeout', async () => {
    const r = await runCoach(ctx, { provider: createMockCoachProvider({ delayMs: 50 }), fallback, timeoutMs: 5 });
    expect(r.usedFallback).toBe(true);
    expect(r.response.source).toBe('fallback_template');
    expect(r.error).toMatch(/timed out/i);
  });

  it('falls back with no provider (production posture)', async () => {
    const r = await runCoach(ctx, { provider: null, fallback });
    expect(r.usedFallback).toBe(true);
    expect(r.error).toBeNull();
  });

  it('selectCoachProvider gives a mock in demo and null in production', () => {
    expect(selectCoachProvider(true)).not.toBeNull();
    expect(selectCoachProvider(false)).toBeNull();
  });

  it('getCoaching returns a usable grounded response end-to-end', async () => {
    const r = await getCoaching({ rec: upgradeRec, selected, need, provider: createMockCoachProvider() });
    expect(r.response.grounded).toBe(true);
    expect(r.response.sections).toHaveLength(4);
  });
});

describe('classifyQuestion', () => {
  it('maps free-text questions to coaching intents', () => {
    expect(classifyQuestion('Is it too expensive?')).toBe('price_objection');
    expect(classifyQuestion('They don’t like the colour')).toBe('style_objection');
    expect(classifyQuestion('Will the fit be too tight?')).toBe('fit_objection');
    expect(classifyQuestion('Why is this better than the first one?')).toBe('comparison');
    expect(classifyQuestion('What socks pair with this?')).toBe('add_on');
    expect(classifyQuestion('How should I close the sale?')).toBe('closing');
    expect(classifyQuestion('Tell me about it')).toBe('general');
  });
});

describe('mock provider answer()', () => {
  it('answers a price question grounded in the price delta and approved reason', async () => {
    const ctx = buildCoachContext(upgradeRec, selected, need);
    const a = await mockCoachProvider.answer(ctx, 'Is it worth the extra money?');
    expect(a.intent).toBe('price_objection');
    expect(a.answer).toContain('DEMO 25.00');
    expect(a.answer).toContain('Premium walking upgrade with more cushioning.');
    expect(a.source).toBe('ai_demo');
  });

  it('answers a comparison question grounded in technology + features', async () => {
    const ctx = buildCoachContext(upgradeRec, selected, need);
    const a = await mockCoachProvider.answer(ctx, 'Why is this better?');
    expect(a.answer).toContain('Demo Walk Comfort 2');
    expect(a.answer).toMatch(/Demo Air Cushion Max|Plush cushioning/);
  });

  it('never emits ungrounded or medical content for add-on questions', async () => {
    const ctx = buildCoachContext(addOnRec, selected, need);
    const a = await mockCoachProvider.answer(ctx, 'Do they really need the insole?');
    expect(a.answer).toContain('Demo Fresh Insole 1');
  });
});

describe('askCoach + runAsk', () => {
  it('returns the AI answer when the provider succeeds', async () => {
    const r = await askCoach({ rec: upgradeRec, selected, need, question: 'Why is this better?', provider: createMockCoachProvider() });
    expect(r.usedFallback).toBe(false);
    expect(r.answer.source).toBe('ai_demo');
    expect(r.answer.answer).toContain('Demo Walk Comfort 2');
  });

  it('falls back to an intent-matched Phase 9 answer when the provider errors', async () => {
    const r = await askCoach({ rec: upgradeRec, selected, need, question: 'How should I close?', provider: createMockCoachProvider({ failMode: 'error' }) });
    expect(r.usedFallback).toBe(true);
    expect(r.answer.source).toBe('fallback_template');
    expect(r.answer.answer).toMatch(/walk around in a pair/i); // Phase 9 walking closing
  });

  it('falls back with no provider (production posture)', async () => {
    const ctx = buildCoachContext(upgradeRec, selected, need);
    const fallback = guidanceToAnswer(buildGuidance(upgradeRec, need, selected.id), 'q', 'general', 'test');
    const r = await runAsk(ctx, 'q', { provider: null, fallback });
    expect(r.usedFallback).toBe(true);
    expect(r.error).toBeNull();
  });
});
