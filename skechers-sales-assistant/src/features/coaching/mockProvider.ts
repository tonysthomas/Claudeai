// Local mock "LLM" provider (DEMO MODE ONLY). It simulates a natural-language
// coaching model WITHOUT any external API call: it reads the structured, approved
// grounding context and composes conversational advice from those facts only.
// Output is therefore grounded by construction; the service still validates it
// through the guardrails before display. A configurable delay simulates latency,
// and the provider can be told to fail to exercise the fallback path.
import type { CoachAnswer, CoachContext, CoachIntent, CoachProvider, CoachResponse, CoachSection } from './types';
import type { RecommendationType } from '../recommendations/types';

function join(features: string[]): string {
  if (features.length === 0) return 'its comfort features';
  if (features.length === 1) return features[0] ?? 'its comfort features';
  return `${features.slice(0, -1).join(', ')} and ${features[features.length - 1]}`;
}

function techPhrase(ctx: CoachContext): string {
  const tech = ctx.recommended.technology;
  return tech ? `its ${tech} build` : 'the way it’s built';
}

function priceFraming(ctx: CoachContext): string {
  if (ctx.priceDelta === null || ctx.priceDelta === 0) return '';
  const { currency } = ctx.recommended;
  if (ctx.priceDelta > 0) return ` It’s about ${currency} ${ctx.priceDelta.toFixed(2)} more (demo price), and a lot of customers feel the extra comfort is worth it.`;
  return ` It’s actually ${currency} ${Math.abs(ctx.priceDelta).toFixed(2)} less (demo price), so it can be an easy yes.`;
}

const DISCOVERY_BY_NEED: Record<string, string> = {
  everyday_comfort: 'day-to-day, where will they be wearing these most?',
  walking: 'roughly how much walking are they doing on a normal day?',
  work_long_hours: 'how long are they usually on their feet during a shift?',
  fitness: 'what kind of training or workouts are these for?',
  travel: 'are they after something light and easy to pack?',
  style: 'what look are they going for with these?',
  budget: 'what sort of budget are they hoping to stay around today?',
  maximum_cushioning: 'do they like a soft, plush feel underfoot?',
  support: 'do they prefer a snug, secure fit?',
};

const CLOSING_BY_TYPE: Record<RecommendationType, (ctx: CoachContext) => string> = {
  premium_upgrade: (ctx) => `Want me to grab ${ctx.recommended.name} in their size so they can feel the difference?`,
  alternative: (ctx) => `Shall I set ${ctx.recommended.name} next to their first pick so they can compare?`,
  add_on: (ctx) => `Want me to add ${ctx.recommended.name} so they’re all set from day one?`,
};

function buildSections(ctx: CoachContext): CoachSection[] {
  const needQ = DISCOVERY_BY_NEED[ctx.need.code] ?? `what matters most to them for ${ctx.need.name.toLowerCase()}?`;

  const discovery: CoachSection = {
    key: 'discovery',
    title: 'Open the conversation',
    body: `Since they’re thinking about ${ctx.need.name.toLowerCase()}, ${needQ} That tells you whether ${ctx.recommended.name} is the right next step.`,
  };

  const featureBenefit: CoachSection = {
    key: 'feature_benefit',
    title: 'Feature → benefit',
    body: `Point to ${join(ctx.recommended.keyFeatures)} on ${ctx.recommended.name}. With ${techPhrase(ctx)}, that translates into: ${ctx.customerBenefit}`,
  };

  const objection: CoachSection = {
    key: 'objection',
    title: 'Handle the concern',
    body: `If they hesitate, keep it friendly: “${ctx.relationshipReason}”.${priceFraming(ctx)} No pressure — offer to let them feel it on foot.`,
  };

  const closing: CoachSection = {
    key: 'closing',
    title: 'Ask for the close',
    body: CLOSING_BY_TYPE[ctx.recommendationType](ctx),
  };

  return [discovery, featureBenefit, objection, closing];
}

// --- Free-text question answering ------------------------------------------

const INTENT_KEYWORDS: Array<{ intent: CoachIntent; words: string[] }> = [
  { intent: 'price_objection', words: ['price', 'cost', 'expensive', 'cheap', 'worth', 'money', 'afford', 'budget', 'pay', 'pricey', 'discount'] },
  { intent: 'style_objection', words: ['style', 'look', 'colour', 'color', 'design', 'ugly', 'fashion', 'plain', 'boring'] },
  { intent: 'fit_objection', words: ['fit', 'size', 'tight', 'loose', 'narrow', 'wide', 'snug', 'sizing', 'true to size'] },
  { intent: 'comparison', words: ['why', 'better', 'difference', 'different', 'compare', 'comparison', 'versus', 'vs', 'instead', 'over the'] },
  { intent: 'add_on', words: ['sock', 'care', 'insole', 'spray', 'clean', 'protect', 'pair with', 'add on', 'add-on', 'together', 'also'] },
  { intent: 'closing', words: ['close', 'closing', 'buy', 'checkout', 'basket', 'seal', 'commit', 'ask for the sale', 'decide'] },
  { intent: 'discovery', words: ['ask', 'question', 'find out', 'start', 'open', 'discover', 'what do they', 'how do i begin'] },
  { intent: 'feature_benefit', words: ['feature', 'benefit', 'technology', 'tech', 'special', 'good about', 'what does', 'why should', 'sell'] },
];

/** Classify a free-text question into a coaching intent (keyword heuristic). */
export function classifyQuestion(question: string): CoachIntent {
  const q = question.toLowerCase();
  for (const { intent, words } of INTENT_KEYWORDS) {
    if (words.some((w) => q.includes(w))) return intent;
  }
  return 'general';
}

function answerForIntent(intent: CoachIntent, ctx: CoachContext): string {
  const r = ctx.recommended;
  const feats = join(r.keyFeatures);
  switch (intent) {
    case 'price_objection':
      return `Lead with value, not the number: “${ctx.relationshipReason}”. ${priceFraming(ctx).trim() || `${r.name} is priced as a demo price.`} What they’re really paying for is ${ctx.customerBenefit.toLowerCase()} Offer to let them feel it on foot before deciding.`;
    case 'style_objection':
      return `${r.name} is a different look from their first pick — same idea, fresh styling. Point out ${feats}, and frame it as choice: set them side by side so they can see which they prefer. It still delivers ${ctx.customerBenefit.toLowerCase()}`;
    case 'fit_objection':
      return `Reassure on feel: ${r.name} uses ${techPhrase(ctx)} with ${feats}, so ${ctx.customerBenefit.toLowerCase()} Suggest they try their usual size on and walk a few steps to check the fit.`;
    case 'comparison':
      return `Versus ${ctx.selected.name}, ${r.name} steps up with ${techPhrase(ctx)} and ${feats}. In plain terms: “${ctx.relationshipReason}” — meaning ${ctx.customerBenefit.toLowerCase()}${priceFraming(ctx)}`;
    case 'add_on':
      return `Frame ${r.name} as finishing the setup: “${ctx.relationshipReason}”. With ${feats}, it ${ctx.customerBenefit.toLowerCase()} No pressure — most customers add it once they hear why.`;
    case 'closing':
      return CLOSING_BY_TYPE[ctx.recommendationType](ctx);
    case 'discovery':
      return `Open with their need first: ${DISCOVERY_BY_NEED[ctx.need.code] ?? `what matters most to them for ${ctx.need.name.toLowerCase()}?`} Their answer tells you whether ${r.name} is the right next step.`;
    case 'feature_benefit':
      return `Point to ${feats} on ${r.name}. With ${techPhrase(ctx)}, that translates into: ${ctx.customerBenefit}`;
    case 'general':
    default:
      return `Here’s the grounded angle on ${r.name}: “${ctx.relationshipReason}”. Highlight ${feats} — the benefit for the customer is that ${ctx.customerBenefit.toLowerCase()}${priceFraming(ctx)}`;
  }
}

async function simulateLatency(delayMs: number, signal?: AbortSignal): Promise<void> {
  if (delayMs <= 0) return;
  await new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, delayMs);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new Error('aborted'));
    });
  });
}

export interface MockProviderOptions {
  /** Simulated latency in ms (default 0 for tests). */
  delayMs?: number;
  /** Force a failure to exercise the fallback path. */
  failMode?: 'error' | 'timeout' | null;
}

/** Create a deterministic local mock coach provider. */
export function createMockCoachProvider(opts: MockProviderOptions = {}): CoachProvider {
  const { delayMs = 0, failMode = null } = opts;
  return {
    name: 'demo-local-mock',
    async generate(context: CoachContext, signal?: AbortSignal): Promise<CoachResponse> {
      if (failMode === 'error') throw new Error('mock provider error');
      await simulateLatency(delayMs, signal);
      if (failMode === 'timeout') throw new Error('mock provider timeout');
      return {
        sections: buildSections(context),
        grounded: true,
        source: 'ai_demo',
        provider: 'demo-local-mock',
      };
    },
    async answer(context: CoachContext, question: string, signal?: AbortSignal): Promise<CoachAnswer> {
      if (failMode === 'error') throw new Error('mock provider error');
      await simulateLatency(delayMs, signal);
      if (failMode === 'timeout') throw new Error('mock provider timeout');
      const intent = classifyQuestion(question);
      return {
        question,
        answer: answerForIntent(intent, context),
        intent,
        grounded: true,
        source: 'ai_demo',
        provider: 'demo-local-mock',
      };
    },
  };
}

/** Default demo provider instance (no latency, never fails). */
export const mockCoachProvider = createMockCoachProvider();
