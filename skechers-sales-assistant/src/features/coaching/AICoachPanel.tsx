// "Ask AI Coach" panel (DEMO MODE ONLY) — a conversational Q&A. The associate
// types a question about the recommended product and the coach answers, grounded
// strictly in approved product/relationship/need data (local mock LLM in demo,
// no external calls, no customer PII). Any AI failure or guardrail trip falls
// back to the Phase 9 approved templates. Thumbs up/down records helpfulness
// locally (demo-only, anonymous, not persisted).
import { useCallback, useRef, useState } from 'react';
import { askCoach } from './service';
import type { CustomerNeed, Product } from '../../types/db';
import type { Recommendation } from '../recommendations/types';
import type { AskResult, CoachFeedback, CoachProvider } from './types';

interface Props {
  rec: Recommendation;
  selected: Product;
  need: CustomerNeed;
  /** Test/override seam; defaults to the mode-selected provider. */
  provider?: CoachProvider | null;
  onFeedback?: (feedback: CoachFeedback, result: AskResult) => void;
}

interface Turn {
  id: number;
  question: string;
  result: AskResult | null; // null while pending
  feedback: CoachFeedback | null;
}

const SUGGESTED = [
  'Why is this a good match?',
  'How do I handle the price?',
  'What if they’re unsure about the style?',
  'How should I close?',
];

export function AICoachPanel({ rec, selected, need, provider, onFeedback }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [pending, setPending] = useState(false);
  const nextId = useRef(1);

  const submit = useCallback(
    async (raw: string) => {
      const question = raw.trim();
      if (!question || pending) return;
      const id = nextId.current++;
      setInput('');
      setPending(true);
      setTurns((t) => [...t, { id, question, result: null, feedback: null }]);
      const result = await askCoach({ rec, selected, need, question, ...(provider !== undefined ? { provider } : {}) });
      setTurns((t) => t.map((turn) => (turn.id === id ? { ...turn, result } : turn)));
      setPending(false);
    },
    [rec, selected, need, provider, pending],
  );

  const sendFeedback = useCallback(
    (id: number, value: CoachFeedback) => {
      setTurns((t) =>
        t.map((turn) => {
          if (turn.id === id) {
            if (turn.result) onFeedback?.(value, turn.result);
            return { ...turn, feedback: value };
          }
          return turn;
        }),
      );
    },
    [onFeedback],
  );

  if (!open) {
    return (
      <div className="rounded-lg border border-dashed border-brand-accent/40 bg-white p-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-md bg-brand-accent px-3 py-2 text-xs font-semibold text-white"
          data-testid="ask-ai-coach"
        >
          🤖 Ask AI Coach
        </button>
        <p className="mt-1 text-center text-[10px] text-slate-400">
          Demo AI — ask about this product. Grounded in approved data, no customer data used.
        </p>
      </div>
    );
  }

  return (
    <section aria-label="AI Coach" data-testid="ai-coach-panel" className="rounded-lg border border-brand-accent/30 bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-700">🤖 AI Coach</span>
        <span
          className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
          title="Answers are generated only from approved product data — no invented facts"
          data-testid="grounded-badge"
        >
          Grounded in Approved Data
        </span>
      </div>

      <p className="mt-1 text-[11px] text-slate-500">
        Ask about <span className="font-medium text-slate-700">{rec.product.name}</span> and I’ll answer from its approved details.
      </p>

      {/* Conversation */}
      {turns.length > 0 && (
        <ul className="mt-2 flex flex-col gap-2" data-testid="coach-thread">
          {turns.map((turn) => (
            <li key={turn.id} className="flex flex-col gap-1">
              <p className="self-end rounded-lg rounded-br-sm bg-brand-accent/10 px-2.5 py-1.5 text-sm text-slate-800">
                {turn.question}
              </p>
              {turn.result ? (
                <div className="self-start rounded-lg rounded-bl-sm bg-slate-50 px-2.5 py-1.5" data-testid="coach-answer">
                  <p className="text-sm text-slate-800">{turn.result.answer.answer}</p>
                  {turn.result.usedFallback && (
                    <p className="mt-1 text-[10px] text-amber-600" data-testid="coach-fallback-note">
                      AI unavailable — showing standard approved guidance.
                    </p>
                  )}
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      Demo AI · {turn.result.answer.source === 'ai_demo' ? 'local mock' : 'template'}
                    </span>
                    {turn.feedback ? (
                      <span className="text-[11px] font-medium text-slate-500" data-testid="coach-feedback-ack">
                        Thanks {turn.feedback === 'up' ? '👍' : '👎'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => sendFeedback(turn.id, 'up')}
                          aria-label="Mark answer helpful"
                          className="rounded-md border border-slate-200 px-1.5 py-0.5 text-xs hover:bg-slate-100"
                        >
                          👍
                        </button>
                        <button
                          type="button"
                          onClick={() => sendFeedback(turn.id, 'down')}
                          aria-label="Mark answer not helpful"
                          className="rounded-md border border-slate-200 px-1.5 py-0.5 text-xs hover:bg-slate-100"
                        >
                          👎
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div role="status" aria-live="polite" data-testid="coach-loading" className="flex items-center gap-2 self-start rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-500">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-brand-accent" aria-hidden />
                  Thinking…
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Suggested questions (only before the first question) */}
      {turns.length === 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5" data-testid="coach-suggestions">
          {SUGGESTED.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => void submit(q)}
              className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] text-slate-600 hover:bg-slate-50"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        className="mt-2 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void submit(input);
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this product…"
          aria-label="Ask the AI Coach a question"
          data-testid="coach-input"
          className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-brand-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending || input.trim() === ''}
          data-testid="coach-send"
          className="flex-none rounded-lg bg-brand-accent px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
        >
          Ask
        </button>
      </form>

      <p className="mt-1 text-[10px] text-slate-400">Demo AI · grounded in approved product data · no customer data used.</p>
    </section>
  );
}
