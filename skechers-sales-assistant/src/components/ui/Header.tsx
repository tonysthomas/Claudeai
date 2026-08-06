// App header: application name + a demo badge (never presents as official Skechers).
export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <div className="flex flex-col">
          <span className="text-base font-semibold text-brand">Skechers Sales Assistant</span>
          <span className="text-[11px] uppercase tracking-wide text-slate-400">Retail associate tool</span>
        </div>
        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700" title="Synthetic demo data — not official Skechers data">
          DEMO
        </span>
      </div>
    </header>
  );
}
