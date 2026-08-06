import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '../../src/features/products/ProductCard';
import { ProductImage } from '../../src/features/products/ProductImage';
import { demoProduct, demoProductNoImage } from './fixtures';

describe('ProductCard', () => {
  it('renders key product fields and a demo price', () => {
    render(<ProductCard product={demoProduct} onSelect={vi.fn()} />);
    expect(screen.getByText('Demo Walk Comfort 1')).toBeInTheDocument();
    expect(screen.getByText(/SHOE-WALK-001/)).toBeInTheDocument();
    expect(screen.getByText(/Demo DEMO 59\.99/)).toBeInTheDocument();
  });
});

describe('ProductImage fallback', () => {
  it('uses the category placeholder when there is no image_url', () => {
    render(<ProductImage product={demoProductNoImage} />);
    const img = screen.getByTestId('product-image') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe('/images/products/placeholder-shoe.svg');
  });

  it('falls back to the placeholder when the image fails to load', () => {
    const withBadImage = { ...demoProduct, image_url: 'https://example.test/missing.png' };
    render(<ProductImage product={withBadImage} />);
    const img = screen.getByTestId('product-image') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe('https://example.test/missing.png');
    fireEvent.error(img);
    expect(img.getAttribute('src')).toBe('/images/products/placeholder-shoe.svg');
  });
});
