// "Ask AI Coach" panel (DEMO MODE ONLY). On demand it calls the coaching service
// (a local mock LLM in demo), shows a loading/streaming state, caches the result,
// and renders the grounded coaching tips with a "Grounded in Approved Data" badge.
// If the AI path fails or trips a guardrail, the service returns the safe Phase 9
// template and this panel labels it accordingly. Thumbs up/down records
// helpfulness locally (demo-only, anonymous, no PII, not persisted).
import { useCallback, useRef, useState } from 'react';
import { getCoaching } from './service';
import type { CustomerNeed, Product } from '../../types/db';
import type { Recommendation } from '../recommendations/types';
import type { CoachFeedback, CoachProvider, CoachResult } from './types';

interface Props {
  rec: Recommendation;
  selected: Product;
  need: CustomerNeed;
  /** Test/override seam; defaults to the mode-selected provider. */
  provider?: CoachProvider | null;
  onFeedback?: (feedback: CoachFeedback, result: CoachResult) => void;
}

type Phase = 'idle' | 'loading' | 'ready' | 'error';

export function AICoachPanel({ rec, selected, need, provider, onFeedback }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<CoachResult | null>(null);
  const [feedback, setFeedback] = useState<CoachFeedback | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const cached = useRef(false);

  const ask = useCallback(async () => {
    if (cached.current && result) {
      setPhase('ready');
      return;
    }
    setPhase('loading');
    setErrorMessage(null);
    try {
      const r = await getCoaching({ rec, selected, need, ...(provider !== undefined ? { provider } : {}) });
      cached.current = true;
      setResult(r);
      setPhase('ready');
    } catch (e: unknown) {
      // getCoaching is designed never to reject, but guard anyway.
      setErrorMessage(e instanceof Error ? e.message : String(e));
      setPhase('error');
    }
  }, [rec, selected, need, provider, result]);

  const sendFeedback = useCallback(
    (value: CoachFeedback) => {
      setFeedback(value);
      if (result) onFeedback?.(value, result);
    },
    [result, onFeedback],
  );

  if (phase === 'idle') {
    return (
      <div className="rounded-lg border border-dashed border-brand-accent/40 bg-white p-2">
        <button
          type="button"
          onClick={() => void ask()}
          className="flex w-full items-center justify-center gap-1.5 rounded-md bg-brand-accent px-3 py-2 text-xs font-semibold text-white"
          data-testid="ask-ai-coach"
        >
          🤖 Ask AI Coach
        </button>
        <p className="mt-1 text-center text-[10px] text-slate-400">
          Demo AI — grounded in approved product data. No customer data is used.
        </p>
      </div>
    );
  }

  if (phase === 'loading') {
    return (
      <div role="status" aria-live="polite" data-testid="coach-loading" className="flex items-center gap-2 rounded-lg border border-brand-accent/30 bg-white p-3 text-xs text-slate-500">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-accent" aria-hidden />
        AI Coach is thinking…
      </div>
    );
  }

  if (phase === 'error' || !result) {
    return (
      <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
        Couldn’t reach the AI Coach{errorMessage ? `: ${errorMessage}` : ''}.
      </div>
    );
  }

  const { response, usedFallback } = result;
  return (
    <section aria-label="AI Coach" data-testid="ai-coach-panel" className="rounded-lg border border-brand-accent/30 bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-700">🤖 AI Coach</span>
        <span
          className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
          title="Generated only from approved product data — no invented facts"
          data-testid="grounded-badge"
        >
          Grounded in Approved Data
        </span>
      </div>

      {usedFallback && (
        <p className="mt-1 text-[10px] text-amber-600" data-testid="coach-fallback-note">
          AI unavailable — showing standard approved guidance.
        </p>
      )}

      <ul className="mt-2 flex flex-col gap-2">
        {response.sections.map((s) => (
          <li key={s.key} className="rounded-md border border-slate-100 bg-slate-50 p-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{s.title}</p>
            <p className="mt-0.5 text-sm text-slate-800">{s.body}</p>
          </li>
        ))}
      </ul>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px] text-slate-400">Demo AI · {response.source === 'ai_demo' ? 'local mock' : 'template fallback'}</span>
        {feedback ? (
          <span className="text-[11px] font-medium text-slate-500" data-testid="coach-feedback-ack">
            Thanks for the feedback {feedback === 'up' ? '👍' : '👎'}
          </span>
        ) : (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400">Helpful?</span>
            <button
              type="button"
              onClick={() => sendFeedback('up')}
              aria-label="Mark coaching helpful"
              className="rounded-md border border-slate-200 px-1.5 py-0.5 text-xs hover:bg-slate-50"
            >
              👍
            </button>
            <button
              type="button"
              onClick={() => sendFeedback('down')}
              aria-label="Mark coaching not helpful"
              className="rounded-md border border-slate-200 px-1.5 py-0.5 text-xs hover:bg-slate-50"
            >
              👎
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
