// Analytics page container (DEMO MODE ONLY). Aggregates the synthetic event
// dataset and hands the summary to the presentational dashboard. Outside demo
// mode there is no real aggregation pipeline yet, so the page is unavailable.
import { useMemo } from 'react';
import { isDemoMode } from '../../lib/format';
import { aggregateEvents } from './aggregate';
import { SYNTHETIC_ANALYTICS_EVENTS } from './demoEvents';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { EmptyState } from '../../components/ui/states';

export function AnalyticsPage() {
  const summary = useMemo(() => aggregateEvents(SYNTHETIC_ANALYTICS_EVENTS), []);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Performance analytics</h1>
        <p className="text-xs text-slate-500">Aggregated recommendation outcomes (demo).</p>
      </div>

      {isDemoMode ? (
        <AnalyticsDashboard summary={summary} />
      ) : (
        <EmptyState title="Analytics is a demo-only preview">
          The management analytics dashboard currently runs on synthetic demo data only. A
          production reporting pipeline over real recommendation outcomes is a later phase.
        </EmptyState>
      )}
    </div>
  );
}
