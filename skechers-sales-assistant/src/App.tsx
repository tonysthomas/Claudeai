import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/ui/Layout';
import { LoginPage } from './features/auth/LoginPage';
import { RequireAuth } from './features/auth/RequireAuth';
import { ProductSearch } from './features/search/ProductSearch';
import { ProductPage } from './features/products/ProductPage';
import { AnalyticsPage } from './features/analytics/AnalyticsPage';

export function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <ProductSearch />
            </RequireAuth>
          }
        />
        <Route
          path="/product/:sku"
          element={
            <RequireAuth>
              <ProductPage />
            </RequireAuth>
          }
        />
        <Route
          path="/analytics"
          element={
            <RequireAuth>
              <AnalyticsPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
