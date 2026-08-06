// Supabase browser client. Uses the PUBLIC anon key only — never the
// service-role key (that stays server-side). Values come from Vite env vars.
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL ?? '';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

if (!url || !anonKey) {
  // Don't crash imports (e.g. in tests) — warn so misconfiguration is visible.
  // Real calls will fail loudly until the env is set.
  // eslint-disable-next-line no-console
  console.warn('[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set — using placeholders.');
}

export const supabase = createClient(url || 'http://localhost:54321', anonKey || 'public-anon-demo-key', {
  auth: { persistSession: false },
});

export const isSupabaseConfigured = Boolean(url && anonKey);
