import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../src/features/auth/AuthContext';
import { Header } from '../../src/components/ui/Header';

function renderAt(path: string) {
  return render(
    <AuthProvider demoMode>
      <MemoryRouter initialEntries={[path]}>
        <Header />
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe('Header view tabs (demo)', () => {
  it('shows an Assistant ⇄ Analytics toggle in demo mode', () => {
    renderAt('/');
    const tabs = screen.getByTestId('view-tabs');
    expect(tabs).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Assistant' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Analytics' })).toHaveAttribute('href', '/analytics');
  });

  it('marks Assistant active on the home route', () => {
    renderAt('/');
    expect(screen.getByRole('link', { name: 'Assistant' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Analytics' })).not.toHaveAttribute('aria-current');
  });

  it('marks Analytics active on the analytics route (so you can toggle back)', () => {
    renderAt('/analytics');
    expect(screen.getByRole('link', { name: 'Analytics' })).toHaveAttribute('aria-current', 'page');
    // The Assistant tab is present and links home, giving a way back.
    expect(screen.getByRole('link', { name: 'Assistant' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Assistant' })).not.toHaveAttribute('aria-current');
  });
});
