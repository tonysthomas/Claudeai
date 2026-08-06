// Full product detail — grouped info, image with fallback, demo labels.
import { formatPrice, orDash } from '../../lib/format';
import type { Product } from '../../types/db';
import { ProductImage } from './ProductImage';

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-[11px] uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="text-sm text-slate-800">{value}</dd>
    </div>
  );
}

export function ProductDetailView({ product }: { product: Product }) {
  return (
    <article className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <ProductImage product={product} className="h-56 w-full bg-slate-100 object-contain p-4" />
        <div className="border-t border-slate-100 p-4">
          <h1 className="text-lg font-semibold text-slate-900">{product.name}</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {product.sku}
            {product.style_number ? ` · ${product.style_number}` : ''}
          </p>
          <p className="mt-2 text-lg font-bold text-slate-900">{formatPrice(product.price, product.currency)}</p>
        </div>
      </div>

      {product.description && (
        <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-700">
          {product.description}
        </p>
      )}

      <dl className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white p-4">
        <Field label="Category" value={orDash(product.category)} />
        <Field label="Gender" value={orDash(product.gender)} />
        <Field label="Color" value={orDash(product.color)} />
        <Field label="Size range" value={orDash(product.size_range)} />
        <Field label="Technology" value={orDash(product.technology)} />
        <Field label="Activity" value={orDash(product.activity_type)} />
        <Field label="Region" value={orDash(product.region)} />
        <Field label="Currency" value={orDash(product.currency)} />
        <Field label="Data status" value={orDash(product.data_status)} />
        <Field label="Approval status" value={orDash(product.approval_status)} />
      </dl>

      {product.key_features && product.key_features.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">Key features</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {product.key_features.map((f) => (
              <li key={f} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
