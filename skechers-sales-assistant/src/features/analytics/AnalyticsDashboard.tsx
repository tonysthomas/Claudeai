// Performance analytics dashboard (DEMO MODE ONLY). Presentational: it renders a
// pre-computed AnalyticsSummary. All numbers are synthetic and clearly labeled
// as demo — never real store sales. No customer PII is present or displayed.
import { pct } from './aggregate';
import type { AnalyticsSummary, EventAction } from './types';
import { EmptyState } from '../../components/ui/states';
import { CANONICAL_NEEDS } from '../../lib/customerNeeds';

const ACTION_LABELS: Record<EventAction, string> = {
  displayed: 'Displayed',
  opened: 'Opened',
  presented: 'Presented',
  customer_interested: 'Interested',
  added_to_basket: 'Added to basket',
  customer_declined: 'Declined',
  product_unavailable: 'Unavailable',
  not_relevant: 'Not relevant',
};

const CATEGORY_LABELS: Record<string, string> = {
  upgrade: 'Premium upgrade',
  alternative: 'Alternative',
  socks: 'Socks',
  shoe_care: 'Shoe care',
};

function needLabel(code: string): string {
  return CANONICAL_NEEDS.find((n) => n.code === code)?.name ?? code;
}

function Card({ icon, label, value, sub }: { icon: string; label: string; value: string; sub: string }) {
  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-3">
      <span className="text-lg" aria-hidden>{icon}</span>
      <span className="mt-1 text-2xl font-semibold text-slate-900">{value}</span>
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <span className="text-[11px] text-slate-400">{sub}</span>
    </div>
  );
}

function Bar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full bg-brand-accent" style={{ width: `${Math.round(value * 100)}%` }} aria-hidden />
    </div>
  );
}

export function AnalyticsDashboard({ summary }: { summary: AnalyticsSummary }) {
  if (summary.total === 0) {
    return (
      <EmptyState title="No recommendation activity yet">
        Once associates start recording outcomes, aggregated performance will appear here.
      </EmptyState>
    );
  }

  return (
    <section aria-label="Performance analytics" data-testid="analytics-dashboard" className="flex flex-col gap-5">
      <div
        role="note"
        className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"
      >
        <span className="font-semibold">DEMO — synthetic analytics.</span> These figures are
        generated from sample data for demonstration only. They do not reflect real store
        sales, associates, or customers, and contain no personal information.
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card icon="📊" label="Recommendations logged" value={String(summary.total)} sub="total events (demo)" />
        <Card icon="🎯" label="Acceptance rate" value={pct(summary.acceptanceRate)} sub={`${summary.accepted} interested / added`} />
        <Card icon="🛒" label="Attach rate" value={pct(summary.attachRate)} sub={`${summary.addedToBasket} added to basket`} />
        <Card icon="❌" label="Declined" value={pct(summary.declineRate)} sub={`${summary.declined} declined`} />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-slate-700">Outcome distribution</h2>
        <ul className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3">
          {summary.outcomes.map((o) => (
            <li key={o.action} className="grid grid-cols-[7.5rem_1fr_3.5rem] items-center gap-3 text-xs">
              <span className="text-slate-600">{ACTION_LABELS[o.action]}</span>
              <Bar value={o.pct} />
              <span className="text-right tabular-nums text-slate-500">{o.count} · {pct(o.pct)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-slate-700">Acceptance by customer need</h2>
        <ul className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3">
          {summary.byNeed.map((n) => (
            <li key={n.need} className="grid grid-cols-[7.5rem_1fr_3.5rem] items-center gap-3 text-xs">
              <span className="text-slate-600">{needLabel(n.need)}</span>
              <Bar value={n.rate} />
              <span className="text-right tabular-nums text-slate-500">{pct(n.rate)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-slate-700">Acceptance by recommendation type</h2>
        <ul className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3">
          {summary.byCategory.map((c) => (
            <li key={c.category} className="grid grid-cols-[7.5rem_1fr_3.5rem] items-center gap-3 text-xs">
              <span className="text-slate-600">{CATEGORY_LABELS[c.category] ?? c.category}</span>
              <Bar value={c.rate} />
              <span className="text-right tabular-nums text-slate-500">{pct(c.rate)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-slate-700">Top performing pairings</h2>
        <ul className="flex flex-col divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
          {summary.topPairs.map((p) => (
            <li key={`${p.sourceName}→${p.targetName}`} className="flex items-center justify-between gap-3 p-3 text-xs">
              <span className="text-slate-700">
                {p.sourceName} <span className="text-slate-400" aria-hidden>→</span> {p.targetName}
              </span>
              <span className="flex-none tabular-nums font-medium text-slate-600">
                {pct(p.rate)} <span className="text-slate-400">({p.accepted}/{p.total})</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-[11px] text-slate-400">
        Demo analytics — synthetic aggregate data, for demonstration only. No customer
        personal information is collected or shown.
      </p>
    </section>
  );
}
