// Route guard. In DEMO_MODE the synthetic associate is always authenticated, so
// it passes through (keeping local dev + tests working). In production it shows a
// loading state while the session is checked, then redirects to /login if there
// is no session.
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { LoadingState } from '../../components/ui/states';
import { useAuth } from './AuthContext';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { loading, isAuthenticated } = useAuth();
  if (loading) return <LoadingState label="Checking session…" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
