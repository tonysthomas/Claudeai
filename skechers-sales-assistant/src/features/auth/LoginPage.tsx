// Associate login (email/password). Redirects to the app once authenticated.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function LoginPage() {
  const { signIn, isAuthenticated, isDemo } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error: err } = await signIn(email, password);
    setSubmitting(false);
    if (err) setError(err);
  };

  return (
    <div className="mx-auto mt-6 max-w-sm">
      <h1 className="text-lg font-semibold text-slate-900">Associate sign in</h1>
      <p className="mt-1 text-sm text-slate-500">Sign in to use the sales assistant.</p>

      {isDemo && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Demo mode is on — you are signed in as a demo associate. Login is not required locally.
        </p>
      )}

      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3" aria-label="Sign in">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-600">Email</span>
          <input
            type="email" required autoComplete="username" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/30"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-600">Password</span>
          <input
            type="password" required autoComplete="current-password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/30"
          />
        </label>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button
          type="submit" disabled={submitting}
          className="rounded-lg bg-brand-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
