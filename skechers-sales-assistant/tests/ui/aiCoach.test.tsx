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

function setup(provider = createMockCoachProvider(), onFeedback?: (f: string) => void) {
  return render(
    <AICoachPanel
      rec={rec('premium_upgrade')} selected={demoProduct} need={need}
      provider={provider} onFeedback={onFeedback ? (f) => onFeedback(f) : undefined}
    />,
  );
}

describe('AICoachPanel (Q&A)', () => {
  it('opens a chat and answers a typed question grounded in the product', async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByTestId('ask-ai-coach'));
    const panel = screen.getByTestId('ai-coach-panel');
    expect(screen.getByTestId('grounded-badge')).toHaveTextContent(/Grounded in Approved Data/i);
    expect(panel).toHaveTextContent('Demo Walk Comfort 2'); // prompt line names the product

    await user.type(screen.getByTestId('coach-input'), 'Why is this better?');
    await user.click(screen.getByTestId('coach-send'));

    const answer = await screen.findByTestId('coach-answer');
    // The answer is grounded: it compares to the selected pair and cites approved facts.
    expect(answer).toHaveTextContent('Demo Walk Comfort 2');
    expect(answer).toHaveTextContent(/Demo Air Cushion Max|Plush cushioning/);
    expect(screen.queryByTestId('coach-fallback-note')).not.toBeInTheDocument();
  });

  it('answers a suggested question chip', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByTestId('ask-ai-coach'));
    await user.click(screen.getByRole('button', { name: 'How do I handle the price?' }));
    const answer = await screen.findByTestId('coach-answer');
    // Price intent: references the demo price delta.
    expect(answer).toHaveTextContent(/DEMO 25\.00/);
  });

  it('records thumbs feedback on an answer', async () => {
    const user = userEvent.setup();
    const got: string[] = [];
    setup(createMockCoachProvider(), (f) => got.push(f));
    await user.click(screen.getByTestId('ask-ai-coach'));
    await user.type(screen.getByTestId('coach-input'), 'How should I close?');
    await user.click(screen.getByTestId('coach-send'));
    await screen.findByTestId('coach-answer');
    await user.click(screen.getByLabelText('Mark answer helpful'));
    expect(got).toEqual(['up']);
    expect(screen.getByTestId('coach-feedback-ack')).toHaveTextContent(/Thanks/i);
  });

  it('falls back to approved guidance and labels it when the AI provider fails', async () => {
    const user = userEvent.setup();
    setup(createMockCoachProvider({ failMode: 'error' }));
    await user.click(screen.getByTestId('ask-ai-coach'));
    await user.type(screen.getByTestId('coach-input'), 'How should I close?');
    await user.click(screen.getByTestId('coach-send'));
    const answer = await screen.findByTestId('coach-answer');
    expect(screen.getByTestId('coach-fallback-note')).toHaveTextContent(/AI unavailable/i);
    // Fallback still serves the Phase 9 approved closing content.
    expect(answer).toHaveTextContent(/walk around in a pair/i);
  });
});
