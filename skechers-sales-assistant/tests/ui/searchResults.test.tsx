import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SearchResultsView } from '../../src/features/products/SearchResultsView';
import { demoProduct } from './fixtures';

const noop = vi.fn();

describe('SearchResultsView states', () => {
  it('shows the empty search state before searching', () => {
    render(<SearchResultsView status="idle" query="" products={[]} onSelect={noop} />);
    expect(screen.getByText('Search for a product')).toBeInTheDocument();
  });

  it('shows the loading state', () => {
    render(<SearchResultsView status="loading" query="walk" products={[]} onSelect={noop} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Searching products…')).toBeInTheDocument();
  });

  it('shows the error state with the message', () => {
    render(<SearchResultsView status="error" query="walk" products={[]} errorMessage="boom" onSelect={noop} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('boom')).toBeInTheDocument();
  });

  it('shows "Product not found" when there are no matches', () => {
    render(<SearchResultsView status="success" query="zzz" products={[]} onSelect={noop} />);
    expect(screen.getByText('Product not found')).toBeInTheDocument();
  });

  it('renders results and reports selection', async () => {
    const onSelect = vi.fn();
    render(<SearchResultsView status="success" query="walk" products={[demoProduct]} onSelect={onSelect} />);
    const card = screen.getByText('Demo Walk Comfort 1');
    expect(card).toBeInTheDocument();
    card.closest('button')!.click();
    expect(onSelect).toHaveBeenCalledWith(demoProduct);
  });
});
