// A single recommendation card. Shows only stored data — no generated claims.
import { formatPrice } from '../../lib/format';
import { ProductImage } from '../products/ProductImage';
import type { Recommendation } from './types';

const AVAIL_LABEL: Record<string, string> = {
  available: 'In stock (demo)',
  limited: 'Limited (demo)',
  out: 'Out of stock (demo)',
  unknown: 'Availability N/A',
};

export function RecommendationCard({ rec }: { rec: Recommendation }) {
  return (
    <article className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm" data-testid="recommendation-card">
      <ProductImage product={rec.product} className="h-16 w-16 flex-none rounded-lg bg-slate-100 object-cover" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-brand-accent/10 px-2 py-0.5 text-[11px] font-semibold text-brand-accent">
            {rec.typeLabel}
          </span>
          <span className="text-[11px] text-slate-400">Priority {rec.priority}</span>
        </div>
        <p className="mt-1 truncate font-medium text-slate-900">{rec.product.name}</p>
        <p className="truncate text-xs text-slate-500">{rec.product.sku}</p>
        <p className="mt-0.5 text-sm font-semibold text-slate-800">{formatPrice(rec.product.price, rec.product.currency)}</p>
        <p className="mt-1 text-sm text-slate-700">
          <span className="font-medium">Why:</span> {rec.reason}
        </p>
        <p className="text-sm text-slate-700">
          <span className="font-medium">Benefit:</span> {rec.customerBenefit}
        </p>
        <p className="mt-1 text-[11px] text-slate-500">{AVAIL_LABEL[rec.availability] ?? rec.availability}</p>
      </div>
    </article>
  );
}
