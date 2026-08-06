import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProductDetailView } from '../../src/features/products/ProductDetailView';
import { demoProduct } from './fixtures';

describe('ProductDetailView', () => {
  it('renders grouped product information', () => {
    render(<ProductDetailView product={demoProduct} />);
    expect(screen.getByRole('heading', { name: 'Demo Walk Comfort 1' })).toBeInTheDocument();
    expect(screen.getByText('Synthetic demo walking shoe for everyday comfort.')).toBeInTheDocument();
    // grouped fields
    expect(screen.getByText('Technology')).toBeInTheDocument();
    expect(screen.getByText('Demo Air Cushion')).toBeInTheDocument();
    expect(screen.getByText('Activity')).toBeInTheDocument();
    expect(screen.getByText('Approval status')).toBeInTheDocument();
    // key features
    expect(screen.getByText('Cushioned midsole')).toBeInTheDocument();
    expect(screen.getByText('Breathable upper')).toBeInTheDocument();
    // demo-labeled price
    expect(screen.getByText(/Demo DEMO 59\.99/)).toBeInTheDocument();
  });
});
