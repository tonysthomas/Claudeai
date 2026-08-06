import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../src/features/auth/AuthContext';
import { LoginPage } from '../../src/features/auth/LoginPage';
import { RequireAuth } from '../../src/features/auth/RequireAuth';

const h = vi.hoisted(() => {
  const DEMO_UID = '00000000-0000-0000-0000-000000000001';
  return {
    DEMO_UID,
    state: { session: null as null | { user: { id: string } }, cb: null as null | ((e: string, s: unknown) => void) },
    PROFILE: { id: 'p', auth_user_id: DEMO_UID, employee_number: 'DEMO-EMP-001', display_name: 'Demo Associate', store_id: 'store-1', role: 'associate', language: 'en', active: true },
    STORE: { id: 'store-1', name: 'Demo Store 1', region: 'DEMO' },
    signIn: vi.fn(),
    signOut: vi.fn(),
  };
});

vi.mock('../../src/lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: h.state.session } }),
      onAuthStateChange: (cb: (e: string, s: unknown) => void) => { h.state.cb = cb; return { data: { subscription: { unsubscribe() {} } } }; },
      signInWithPassword: h.signIn,
      signOut: h.signOut,
    },
    from: (table: string) => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: table === 'associate_profiles' ? h.PROFILE : h.STORE, error: null }) }) }) }),
  },
}));

function Probe() {
  const { profile, store, signOut } = useAuth();
  return (
    <div>
      <div>PROTECTED</div>
      <span data-testid="who">{profile?.display_name}</span>
      <span data-testid="store">{store?.name}</span>
      <button type="button" onClick={() => void signOut()}>sign out</button>
    </div>
  );
}

function renderAuth(demoMode: boolean, initial = '/') {
  return render(
    <AuthProvider demoMode={demoMode}>
      <MemoryRouter initialEntries={[initial]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<RequireAuth><Probe /></RequireAuth>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

beforeEach(() => {
  h.state.session = null;
  h.state.cb = null;
  h.signIn.mockReset();
  h.signOut.mockReset();
  h.signOut.mockImplementation(async () => { h.state.session = null; h.state.cb?.('SIGNED_OUT', null); });
});

describe('Auth — DEMO_MODE', () => {
  it('is authenticated as the synthetic associate without logging in', async () => {
    renderAuth(true);
    expect(await screen.findByText('PROTECTED')).toBeInTheDocument();
    expect(screen.getByTestId('who')).toHaveTextContent('Demo Associate');
    expect(screen.getByTestId('store')).toHaveTextContent('Demo Store 1');
  });
});

describe('Auth — production mode', () => {
  it('shows a session-loading state while checking', () => {
    renderAuth(false, '/');
    expect(screen.getByText('Checking session…')).toBeInTheDocument();
  });

  it('redirects unauthenticated users to /login', async () => {
    renderAuth(false, '/');
    expect(await screen.findByRole('heading', { name: 'Associate sign in' })).toBeInTheDocument();
  });

  it('signs in successfully, loads the profile + store, and reaches the app', async () => {
    h.signIn.mockImplementation(async () => {
      h.state.session = { user: { id: h.DEMO_UID } };
      h.state.cb?.('SIGNED_IN', h.state.session);
      return { error: null };
    });
    const user = userEvent.setup();
    renderAuth(false, '/login');
    await user.type(screen.getByLabelText('Email'), 'associate@example.test');
    await user.type(screen.getByLabelText('Password'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('PROTECTED')).toBeInTheDocument();
    expect(screen.getByTestId('who')).toHaveTextContent('Demo Associate');
    expect(screen.getByTestId('store')).toHaveTextContent('Demo Store 1');
  });

  it('shows an error on failed login', async () => {
    h.signIn.mockResolvedValue({ error: { message: 'Invalid login credentials' } });
    const user = userEvent.setup();
    renderAuth(false, '/login');
    await user.type(screen.getByLabelText('Email'), 'bad@example.test');
    await user.type(screen.getByLabelText('Password'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid login credentials');
  });

  it('logs out and returns to the login screen', async () => {
    h.state.session = { user: { id: h.DEMO_UID } };
    const user = userEvent.setup();
    renderAuth(false, '/');
    await screen.findByText('PROTECTED');
    await user.click(screen.getByRole('button', { name: 'sign out' }));
    expect(await screen.findByRole('heading', { name: 'Associate sign in' })).toBeInTheDocument();
  });
});
