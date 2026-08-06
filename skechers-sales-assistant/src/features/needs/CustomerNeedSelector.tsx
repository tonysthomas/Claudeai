// Customer-need selection. Prop-driven so it is easy to test. Selecting a need
// stores it (via onSelect) and shows a confirmation. No recommendations here.
import type { CustomerNeed } from '../../types/db';

interface CustomerNeedSelectorProps {
  needs: ReadonlyArray<Pick<CustomerNeed, 'code' | 'name'>>;
  selectedCode: string | null;
  onSelect: (code: string) => void;
}

export function CustomerNeedSelector({ needs, selectedCode, onSelect }: CustomerNeedSelectorProps) {
  const selected = needs.find((n) => n.code === selectedCode) ?? null;
  return (
    <section aria-labelledby="need-heading" className="flex flex-col gap-3">
      <h2 id="need-heading" className="text-sm font-semibold text-slate-700">
        What does the customer need?
      </h2>
      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Customer needs">
        {needs.map((need) => {
          const isSelected = need.code === selectedCode;
          return (
            <button
              key={need.code}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(need.code)}
              className={
                'rounded-xl border px-3 py-3 text-sm font-medium transition ' +
                (isSelected
                  ? 'border-brand-accent bg-brand-accent text-white shadow'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-brand-accent')
              }
            >
              {need.name}
            </button>
          );
        })}
      </div>
      {selected && (
        <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Selected: <span className="font-semibold">{selected.name}</span>. See recommendations below.
        </p>
      )}
    </section>
  );
}
