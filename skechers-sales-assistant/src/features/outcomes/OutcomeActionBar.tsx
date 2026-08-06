// Touch-friendly outcome action bar shown under each recommendation. Purely
// presentational: the parent owns the selected action + save status.
import { OUTCOME_OPTIONS, outcomeLabel, type OutcomeAction } from './types';

export type OutcomeStatus = 'idle' | 'saving' | 'saved' | 'error';

interface Props {
  selected: OutcomeAction | null;
  status: OutcomeStatus;
  onAction: (action: OutcomeAction) => void;
  errorMessage?: string;
}

export function OutcomeActionBar({ selected, status, onAction, errorMessage }: Props) {
  return (
    <div className="mt-2 border-t border-slate-100 pt-2">
      <div role="group" aria-label="Record outcome" className="flex flex-wrap gap-1.5">
        {OUTCOME_OPTIONS.map((o) => {
          const isSel = selected === o.action;
          return (
            <button
              key={o.action}
              type="button"
              aria-pressed={isSel}
              onClick={() => onAction(o.action)}
              className={
                'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition ' +
                (isSel
                  ? 'border-brand-accent bg-brand-accent text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-brand-accent')
              }
            >
              <span aria-hidden>{o.icon}</span>
              {o.label}
            </button>
          );
        })}
      </div>
      <div className="mt-1 min-h-[18px]" aria-live="polite">
        {status === 'saving' && <span role="status" className="text-[11px] text-slate-400">Saving…</span>}
        {status === 'saved' && selected && (
          <span role="status" className="text-[11px] font-medium text-emerald-600" data-testid="outcome-confirmation">
            ✓ {outcomeLabel(selected)} logged
          </span>
        )}
        {status === 'error' && (
          <span role="alert" className="text-[11px] text-red-600">
            Couldn’t save{errorMessage ? ` (${errorMessage})` : ''} — tap to retry
          </span>
        )}
      </div>
    </div>
  );
}
