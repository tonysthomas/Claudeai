// App header: application name, associate + store context, a demo Assistant ⇄
// Analytics tab toggle, and sign-out.
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';

function tabClass(isActive: boolean): string {
  return [
    'rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
    isActive ? 'bg-white text-brand shadow-sm' : 'text-slate-500 hover:text-slate-700',
  ].join(' ');
}

export function Header() {
  const { isAuthenticated, isDemo, profile, store, signOut } = useAuth();
  const { pathname } = useLocation();
  const onAnalytics = pathname.startsWith('/analytics');
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 flex-col">
          <Link to="/" className="truncate text-base font-semibold text-brand">
            Skechers Sales Assistant
          </Link>
          {isAuthenticated && profile ? (
            <span className="truncate text-[11px] text-slate-500" data-testid="associate-context">
              {profile.display_name ?? 'Associate'}
              {store ? ` · ${store.name}` : ''}
            </span>
          ) : (
            <span className="text-[11px] uppercase tracking-wide text-slate-400">Retail associate tool</span>
          )}
        </div>
        <div className="flex flex-none items-center gap-2">
          {isAuthenticated && isDemo && (
            <nav aria-label="Views" className="flex items-center gap-0.5 rounded-lg bg-slate-100 p-0.5" data-testid="view-tabs">
              <Link to="/" className={tabClass(!onAnalytics)} aria-current={!onAnalytics ? 'page' : undefined}>
                Assistant
              </Link>
              <Link to="/analytics" className={tabClass(onAnalytics)} aria-current={onAnalytics ? 'page' : undefined}>
                Analytics
              </Link>
            </nav>
          )}
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700" title="Synthetic demo data — not official Skechers data">
            DEMO
          </span>
          {isAuthenticated && !isDemo && (
            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-lg border border-slate-300 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
            >
              Sign out
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
