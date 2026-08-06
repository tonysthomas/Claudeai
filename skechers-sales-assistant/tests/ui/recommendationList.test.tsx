import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecommendationListView } from '../../src/features/recommendations/RecommendationListView';
import type { Recommendation } from '../../src/features/recommendations/types';
import { demoProduct } from './fixtures';

const rec: Recommendation = {
  relationshipId: 'r1',
  type: 'premium_upgrade',
  typeLabel: 'Premium upgrade',
  product: { ...demoProduct, id: 'walk2', sku: 'SHOE-WALK-002', name: 'Demo Walk Comfort 2', price: 89.99 },
  reason: 'Premium walking upgrade with more cushioning.',
  customerBenefit: 'Softer, longer-lasting comfort on long walks.',
  priority: 1,
  availability: 'available',
};

describe('RecommendationListView states', () => {
  it('renders the loading state', () => {
    render(<RecommendationListView status="loading" recommendations={[]} />);
    expect(screen.getByText('Finding recommendations…')).toBeInTheDocument();
  });

  it('renders the error state', () => {
    render(<RecommendationListView status="error" recommendations={[]} errorMessage="nope" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('nope')).toBeInTheDocument();
  });

  it('renders the empty state', () => {
    render(<RecommendationListView status="success" recommendations={[]} />);
    expect(screen.getByText('No approved recommendations')).toBeInTheDocument();
  });

  it('renders a recommendation card with all stored fields', () => {
    render(<RecommendationListView status="success" recommendations={[rec]} />);
    expect(screen.getByText('Premium upgrade')).toBeInTheDocument();
    expect(screen.getByText('Demo Walk Comfort 2')).toBeInTheDocument();
    expect(screen.getByText('SHOE-WALK-002')).toBeInTheDocument();
    expect(screen.getByText(/Demo DEMO 89\.99/)).toBeInTheDocument();
    expect(screen.getByText(/Premium walking upgrade with more cushioning\./)).toBeInTheDocument();
    expect(screen.getByText(/Softer, longer-lasting comfort on long walks\./)).toBeInTheDocument();
    expect(screen.getByText('Priority 1')).toBeInTheDocument();
    expect(screen.getByText('In stock (demo)')).toBeInTheDocument();
  });
});
