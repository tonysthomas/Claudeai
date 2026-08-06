// AI Sales Coach types (Phase 11). The coach produces conversational selling
// advice grounded STRICTLY in approved product/relationship/need data. In
// DEMO_MODE a local mock provider stands in for an LLM — no external API calls,
// no customer PII. If the provider fails, times out, or trips a guardrail, the
// service falls back to the Phase 9 deterministic templates.
import type { RecommendationType } from '../recommendations/types';

/** A product reduced to ONLY its approved, groundable attributes. */
export interface CoachProductContext {
  name: string;
  category: string;
  technology: string | null;
  keyFeatures: string[];
  price: number | null;
  currency: string;
}

/**
 * The complete, self-contained grounding context handed to the coach. Every
 * field originates from approved catalogue/relationship/need data — the coach
 * may rephrase these facts but must never introduce anything outside this object.
 */
export interface CoachContext {
  need: { code: string; name: string };
  selected: CoachProductContext;
  recommended: CoachProductContext;
  recommendationType: RecommendationType;
  relationshipReason: string; // approved stored reason
  customerBenefit: string; // approved stored benefit
  priceDelta: number | null; // recommended.price - selected.price (when both known)
}

export type CoachSectionKey = 'discovery' | 'feature_benefit' | 'objection' | 'closing';

export interface CoachSection {
  key: CoachSectionKey;
  title: string;
  body: string;
}

export type CoachSource = 'ai_demo' | 'fallback_template';

export interface CoachResponse {
  sections: CoachSection[];
  grounded: true; // always true: output is validated against the context
  source: CoachSource;
  provider: string;
  /** Present only when source is 'fallback_template'. */
  fallbackReason?: string;
}

/** The intent the coach inferred from a free-text associate question. */
export type CoachIntent =
  | 'discovery'
  | 'feature_benefit'
  | 'comparison'
  | 'price_objection'
  | 'style_objection'
  | 'fit_objection'
  | 'add_on'
  | 'closing'
  | 'general';

/** A grounded answer to one associate question. */
export interface CoachAnswer {
  question: string;
  answer: string;
  intent: CoachIntent;
  grounded: true;
  source: CoachSource;
  provider: string;
  /** Present only when source is 'fallback_template'. */
  fallbackReason?: string;
}

/** A pluggable coaching provider. The demo ships a local mock; production wires none. */
export interface CoachProvider {
  name: string;
  /** Generate the four-section coaching overview. */
  generate(context: CoachContext, signal?: AbortSignal): Promise<CoachResponse>;
  /** Answer a free-text associate question, grounded strictly in the context. */
  answer(context: CoachContext, question: string, signal?: AbortSignal): Promise<CoachAnswer>;
}

export interface AskResult {
  answer: CoachAnswer;
  usedFallback: boolean;
  error: string | null;
}

export interface CoachResult {
  response: CoachResponse;
  usedFallback: boolean;
  error: string | null;
}

/** Thumbs feedback on a coaching tip (demo-only, anonymous, no PII, not persisted). */
export type CoachFeedback = 'up' | 'down';
