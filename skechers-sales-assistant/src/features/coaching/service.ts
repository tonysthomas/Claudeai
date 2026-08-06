// AI Sales Coach service (Phase 11). Orchestrates: build grounded context →
// call the provider (with a timeout) → validate output against the guardrails →
// on ANY failure fall back to the Phase 9 deterministic templates. In DEMO_MODE
// the provider is a local mock (no external calls, no PII). In production no
// provider is wired yet, so the service always returns the safe template.
import { isDemoMode } from '../../lib/format';
import { buildGuidance } from '../guidance/content';
import type { CustomerNeed, Product } from '../../types/db';
import type { Recommendation } from '../recommendations/types';
import { buildCoachContext } from './context';
import { guidanceToAnswer, guidanceToCoachResponse } from './fallback';
import { validateCoachAnswer, validateCoachResponse } from './guardrails';
import { classifyQuestion, mockCoachProvider } from './mockProvider';
import type { AskResult, CoachAnswer, CoachContext, CoachProvider, CoachResponse, CoachResult } from './types';

export const DEFAULT_COACH_TIMEOUT_MS = 4000;

/** Choose a provider for the current mode. Demo → local mock; production → none. */
export function selectCoachProvider(demoMode: boolean = isDemoMode): CoachProvider | null {
  return demoMode ? mockCoachProvider : null;
}

function timeout(ms: number, signal: AbortSignal): Promise<never> {
  return new Promise((_, reject) => {
    const t = setTimeout(() => reject(new Error(`coach timed out after ${ms}ms`)), ms);
    signal.addEventListener('abort', () => clearTimeout(t));
  });
}

export interface RunCoachOptions {
  provider: CoachProvider | null;
  fallback: CoachResponse;
  timeoutMs?: number;
}

/**
 * Core orchestration over an already-built context + fallback. Returns a result
 * that ALWAYS contains a usable response (AI or template). `usedFallback` and
 * `error` explain what happened.
 */
export async function runCoach(context: CoachContext, opts: RunCoachOptions): Promise<CoachResult> {
  const { provider, fallback, timeoutMs = DEFAULT_COACH_TIMEOUT_MS } = opts;

  if (!provider) {
    return { response: fallback, usedFallback: true, error: null };
  }

  const controller = new AbortController();
  try {
    const response = await Promise.race([
      provider.generate(context, controller.signal),
      timeout(timeoutMs, controller.signal),
    ]);
    controller.abort(); // stop the timer

    const check = validateCoachResponse(response, context);
    if (!check.ok) {
      return {
        response: { ...fallback, fallbackReason: `guardrail: ${check.violations.join(', ')}` },
        usedFallback: true,
        error: `guardrail violation: ${check.violations.join(', ')}`,
      };
    }
    return { response, usedFallback: false, error: null };
  } catch (e: unknown) {
    controller.abort();
    const message = e instanceof Error ? e.message : String(e);
    return {
      response: { ...fallback, fallbackReason: message },
      usedFallback: true,
      error: message,
    };
  }
}

export interface RunAskOptions {
  provider: CoachProvider | null;
  fallback: CoachAnswer;
  timeoutMs?: number;
}

/**
 * Core orchestration for a single free-text question. Always returns a usable
 * grounded answer (AI or template). `usedFallback` / `error` explain what happened.
 */
export async function runAsk(context: CoachContext, question: string, opts: RunAskOptions): Promise<AskResult> {
  const { provider, fallback, timeoutMs = DEFAULT_COACH_TIMEOUT_MS } = opts;

  if (!provider) {
    return { answer: fallback, usedFallback: true, error: null };
  }

  const controller = new AbortController();
  try {
    const answer = await Promise.race([
      provider.answer(context, question, controller.signal),
      timeout(timeoutMs, controller.signal),
    ]);
    controller.abort();

    const check = validateCoachAnswer(answer, context);
    if (!check.ok) {
      return {
        answer: { ...fallback, question, fallbackReason: `guardrail: ${check.violations.join(', ')}` },
        usedFallback: true,
        error: `guardrail violation: ${check.violations.join(', ')}`,
      };
    }
    return { answer, usedFallback: false, error: null };
  } catch (e: unknown) {
    controller.abort();
    const message = e instanceof Error ? e.message : String(e);
    return { answer: { ...fallback, question, fallbackReason: message }, usedFallback: true, error: message };
  }
}

export interface AskCoachParams {
  rec: Recommendation;
  selected: Product;
  need: CustomerNeed;
  question: string;
  provider?: CoachProvider | null;
  timeoutMs?: number;
}

/**
 * High-level entry point for a free-text question: builds the grounded context
 * and an intent-matched Phase 9 fallback answer, then runs the coach.
 */
export async function askCoach(params: AskCoachParams): Promise<AskResult> {
  const { rec, selected, need, question, timeoutMs } = params;
  const provider = params.provider !== undefined ? params.provider : selectCoachProvider();
  const context = buildCoachContext(rec, selected, need);
  const intent = classifyQuestion(question);
  const fallback = guidanceToAnswer(buildGuidance(rec, need, selected.id), question, intent, 'no AI provider configured');
  return runAsk(context, question, { provider, fallback, timeoutMs });
}

export interface GetCoachingParams {
  rec: Recommendation;
  selected: Product;
  need: CustomerNeed;
  provider?: CoachProvider | null;
  timeoutMs?: number;
}

/**
 * High-level entry point for the UI: builds the grounded context and the Phase 9
 * fallback, then runs the coach. Deterministic fallback is always available.
 */
export async function getCoaching(params: GetCoachingParams): Promise<CoachResult> {
  const { rec, selected, need, timeoutMs } = params;
  const provider = params.provider !== undefined ? params.provider : selectCoachProvider();
  const context = buildCoachContext(rec, selected, need);
  const fallback = guidanceToCoachResponse(buildGuidance(rec, need, selected.id), 'no AI provider configured');
  return runCoach(context, { provider, fallback, timeoutMs });
}
