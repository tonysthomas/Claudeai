import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { CustomerNeedSelector } from '../../src/features/needs/CustomerNeedSelector';
import { CANONICAL_NEEDS } from '../../src/lib/customerNeeds';

function Harness({ onSelect }: { onSelect?: (code: string) => void }) {
  const [code, setCode] = useState<string | null>(null);
  return (
    <CustomerNeedSelector
      needs={CANONICAL_NEEDS}
      selectedCode={code}
      onSelect={(c) => {
        setCode(c);
        onSelect?.(c);
      }}
    />
  );
}

describe('CustomerNeedSelector', () => {
  it('renders all nine customer needs', () => {
    render(<Harness />);
    const group = screen.getByRole('group', { name: 'Customer needs' });
    expect(group.querySelectorAll('button')).toHaveLength(9);
    expect(screen.getByRole('button', { name: 'Maximum cushioning' })).toBeInTheDocument();
  });

  it('selects a need, confirms it, and reports the code', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Harness onSelect={onSelect} />);
    await user.click(screen.getByRole('button', { name: 'Walking' }));
    expect(onSelect).toHaveBeenCalledWith('walking');
    expect(screen.getByRole('button', { name: 'Walking' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Selected: Walking');
  });
});
