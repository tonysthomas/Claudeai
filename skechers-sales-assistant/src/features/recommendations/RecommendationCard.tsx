// A single recommendation card. Shows only stored data — no generated claims —
// with an outcome feedback bar (Phase 7) and demo-only sales guidance (Phase 9).
import { useState } from 'react';
import { formatPrice, isDemoMode } from '../../lib/format';
import { OutcomeFeedback } from '../outcomes/OutcomeFeedback';
import { buildGuidance } from '../guidance/content';
import { GuidancePanel } from '../guidance/GuidancePanel';
import type { CustomerNeed, Product } from '../../types/db';
import { ProductImage } from '../products/ProductImage';
import type { Recommendation } from './types';

const AVAIL_LABEL: Record<string, string> = {
  available: 'In stock (demo)',
  limited: 'Limited (demo)',
  out: 'Out of stock (demo)',
  unknown: 'Availability N/A',
};

export function RecommendationCard({
  rec,
  selected,
  need,
}: {
  rec: Recommendation;
  selected: Product;
  need: CustomerNeed;
}) {
  const [showGuidance, setShowGuidance] = useState(false);
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm" data-testid="recommendation-card">
      <div className="flex gap-3">
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
      </div>
      <OutcomeFeedback selected={selected} recommended={rec.product} relationshipId={rec.relationshipId} need={need} />

      {/* Sales guidance is DEMO MODE ONLY (synthetic content). */}
      {isDemoMode && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowGuidance((s) => !s)}
            aria-expanded={showGuidance}
            className="text-xs font-medium text-brand-accent"
          >
            {showGuidance ? 'Hide sales guidance' : '💬 Show sales guidance'}
          </button>
          {showGuidance && (
            <GuidancePanel guidance={buildGuidance(rec, need, selected.id)} coach={{ rec, selected, need }} />
          )}
        </div>
      )}
    </article>
  );
}
