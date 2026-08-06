import type { ReactNode } from 'react';
import { Header } from './Header';

/** Mobile-first app shell: header + a centered, phone-width main column. */
export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-4 pb-24">{children}</main>
    </div>
  );
}
