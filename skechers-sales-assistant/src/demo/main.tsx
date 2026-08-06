// Entry point for the self-contained browser demo. Same App as production, but
// uses MemoryRouter (no server/history needed) and the in-memory data source
// (wired via the demo Vite config's module redirect).
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../App';
import { AuthProvider } from '../features/auth/AuthContext';
import { SelectionProvider } from '../features/selection/SelectionContext';
import '../index.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider demoMode>
        <MemoryRouter initialEntries={['/']}>
          <SelectionProvider>
            <App />
          </SelectionProvider>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
