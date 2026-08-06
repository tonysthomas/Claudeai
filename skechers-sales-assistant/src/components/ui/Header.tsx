// App header: application name, associate + store context, and sign-out.
import { useAuth } from '../../features/auth/AuthContext';

export function Header() {
  const { isAuthenticated, isDemo, profile, store, signOut } = useAuth();
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <div className="flex flex-col">
          <span className="text-base font-semibold text-brand">Skechers Sales Assistant</span>
          {isAuthenticated && profile ? (
            <span className="text-[11px] text-slate-500" data-testid="associate-context">
              {profile.display_name ?? 'Associate'}
              {store ? ` · ${store.name}` : ''}
            </span>
          ) : (
            <span className="text-[11px] uppercase tracking-wide text-slate-400">Retail associate tool</span>
          )}
        </div>
        <div className="flex items-center gap-2">
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
