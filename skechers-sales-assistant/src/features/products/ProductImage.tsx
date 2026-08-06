// Product image with a category-based placeholder fallback on load error.
import { useState } from 'react';
import { placeholderImage } from '../../lib/format';
import type { Product } from '../../types/db';

export function ProductImage({
  product,
  className,
}: {
  product: Pick<Product, 'image_url' | 'category' | 'name'>;
  className?: string;
}) {
  const fallback = placeholderImage(product.category);
  const [src, setSrc] = useState(product.image_url ?? fallback);
  return (
    <img
      src={src}
      alt={product.name}
      loading="lazy"
      onError={() => {
        if (src !== fallback) setSrc(fallback);
      }}
      className={className}
      data-testid="product-image"
    />
  );
}
