// Compact product card used in search results.
import { formatPrice } from '../../lib/format';
import type { Product } from '../../types/db';
import { ProductImage } from './ProductImage';

export function ProductCard({ product, onSelect }: { product: Product; onSelect: (p: Product) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(product)}
      className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-brand-accent hover:shadow"
    >
      <ProductImage product={product} className="h-16 w-16 flex-none rounded-lg bg-slate-100 object-cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-900">{product.name}</p>
        <p className="truncate text-xs text-slate-500">
          {product.sku}
          {product.style_number ? ` · ${product.style_number}` : ''} · {product.category}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800">{formatPrice(product.price, product.currency)}</span>
          {product.activity_type && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{product.activity_type}</span>
          )}
        </div>
      </div>
      <span aria-hidden className="flex-none text-slate-300">›</span>
    </button>
  );
}
