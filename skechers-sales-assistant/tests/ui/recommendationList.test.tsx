import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthProvider } from '../../src/features/auth/AuthContext';
import { RecommendationListView } from '../../src/features/recommendations/RecommendationListView';
import type { Recommendation } from '../../src/features/recommendations/types';
import type { CustomerNeed } from '../../src/types/db';
import { demoProduct } from './fixtures';

const need: CustomerNeed = { id: 'n1', code: 'walking', name: 'Walking', description: null, active: true };
const view = (node: React.ReactNode) => render(<AuthProvider demoMode>{node}</AuthProvider>);

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
    view(<RecommendationListView status="loading" recommendations={[]} selected={demoProduct} need={need} />);
    expect(screen.getByText('Finding recommendations…')).toBeInTheDocument();
  });

  it('renders the error state', () => {
    view(<RecommendationListView status="error" recommendations={[]} selected={demoProduct} need={need} errorMessage="nope" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('nope')).toBeInTheDocument();
  });

  it('renders the empty state', () => {
    view(<RecommendationListView status="success" recommendations={[]} selected={demoProduct} need={need} />);
    expect(screen.getByText('No approved recommendations')).toBeInTheDocument();
  });

  it('renders a recommendation card with all stored fields', () => {
    view(<RecommendationListView status="success" recommendations={[rec]} selected={demoProduct} need={need} />);
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
