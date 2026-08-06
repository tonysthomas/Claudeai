import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/ui/Layout';
import { SearchPage } from './features/products/SearchPage';
import { ProductPage } from './features/products/ProductPage';

export function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/product/:sku" element={<ProductPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
