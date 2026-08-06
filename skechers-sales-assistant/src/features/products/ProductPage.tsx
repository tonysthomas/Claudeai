// Product container: fetch by SKU, show detail + customer-need selection.
import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ErrorState, LoadingState } from '../../components/ui/states';
import { EmptyState } from '../../components/ui/states';
import { useCustomerNeeds } from '../needs/hooks';
import { CustomerNeedSelector } from '../needs/CustomerNeedSelector';
import { useSelection } from '../selection/SelectionContext';
import type { CustomerNeed } from '../../types/db';
import { ProductDetailView } from './ProductDetailView';
import { useProduct } from './hooks';

export function ProductPage() {
  const { sku } = useParams<{ sku: string }>();
  const product = useProduct(sku);
  const { needs } = useCustomerNeeds();
  const { selectedNeed, setSelectedProduct, setSelectedNeed } = useSelection();

  useEffect(() => {
    if (product.data) setSelectedProduct(product.data);
  }, [product.data, setSelectedProduct]);

  return (
    <div className="flex flex-col gap-5">
      <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium text-brand-accent">
        ‹ Back to search
      </Link>

      {product.isPending && <LoadingState label="Loading product…" />}
      {product.isError && (
        <ErrorState
          message={product.error instanceof Error ? product.error.message : 'Failed to load product'}
          onRetry={() => void product.refetch()}
        />
      )}
      {!product.isPending && !product.isError && !product.data && (
        <EmptyState title="Product not found">No demo product matches “{sku}”.</EmptyState>
      )}

      {product.data && (
        <>
          <ProductDetailView product={product.data} />
          <CustomerNeedSelector
            needs={needs}
            selectedCode={selectedNeed?.code ?? null}
            onSelect={(code) => {
              const match = needs.find((n) => n.code === code);
              // needs may be canonical (code/name only) — coerce to a CustomerNeed shape
              const need = (match ?? { code, name: code }) as CustomerNeed;
              setSelectedNeed({
                id: 'id' in need && need.id ? need.id : code,
                code: need.code,
                name: need.name,
                description: 'description' in need ? need.description : null,
                active: true,
              });
            }}
          />
        </>
      )}
    </div>
  );
}
