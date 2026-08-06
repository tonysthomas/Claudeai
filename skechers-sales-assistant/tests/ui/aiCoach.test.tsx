import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AICoachPanel } from '../../src/features/coaching/AICoachPanel';
import { createMockCoachProvider } from '../../src/features/coaching/mockProvider';
import type { CustomerNeed } from '../../src/types/db';
import type { Recommendation, RecommendationType } from '../../src/features/recommendations/types';
import { demoProduct, demoProductNoImage } from './fixtures';

function rec(type: RecommendationType): Recommendation {
  return {
    relationshipId: 'r1', type, typeLabel: type,
    product: { ...demoProductNoImage, name: 'Demo Walk Comfort 2', price: 84.99, technology: 'Demo Air Cushion Max', key_features: ['Plush cushioning'] },
    reason: 'Premium walking upgrade.', customerBenefit: 'Softer comfort on long walks.', priority: 1, availability: 'available',
  };
}
const need: CustomerNeed = { id: 'n1', code: 'walking', name: 'Walking', description: null, active: true };

describe('AICoachPanel', () => {
  it('asks the coach and renders grounded coaching tips with a badge', async () => {
    const user = userEvent.setup();
    render(<AICoachPanel rec={rec('premium_upgrade')} selected={demoProduct} need={need} provider={createMockCoachProvider()} />);

    await user.click(screen.getByTestId('ask-ai-coach'));
    expect(await screen.findByTestId('ai-coach-panel')).toBeInTheDocument();
    expect(screen.getByTestId('grounded-badge')).toHaveTextContent(/Grounded in Approved Data/i);
    const panel = screen.getByTestId('ai-coach-panel');
    expect(panel).toHaveTextContent('Demo Walk Comfort 2');
    expect(panel).toHaveTextContent('Plush cushioning');
    expect(screen.queryByTestId('coach-fallback-note')).not.toBeInTheDocument();
  });

  it('records thumbs feedback', async () => {
    const user = userEvent.setup();
    const got: string[] = [];
    render(
      <AICoachPanel
        rec={rec('premium_upgrade')} selected={demoProduct} need={need}
        provider={createMockCoachProvider()} onFeedback={(f) => got.push(f)}
      />,
    );
    await user.click(screen.getByTestId('ask-ai-coach'));
    await screen.findByTestId('ai-coach-panel');
    await user.click(screen.getByLabelText('Mark coaching helpful'));
    expect(got).toEqual(['up']);
    expect(screen.getByTestId('coach-feedback-ack')).toHaveTextContent(/Thanks for the feedback/i);
  });

  it('falls back to approved guidance and labels it when the AI provider fails', async () => {
    const user = userEvent.setup();
    render(
      <AICoachPanel
        rec={rec('premium_upgrade')} selected={demoProduct} need={need}
        provider={createMockCoachProvider({ failMode: 'error' })}
      />,
    );
    await user.click(screen.getByTestId('ask-ai-coach'));
    expect(await screen.findByTestId('ai-coach-panel')).toBeInTheDocument();
    expect(screen.getByTestId('coach-fallback-note')).toHaveTextContent(/AI unavailable/i);
    // The fallback still shows the Phase 9 grounded content (the approved closing).
    expect(screen.getByTestId('ai-coach-panel')).toHaveTextContent(/walk around in a pair/i);
  });
});
