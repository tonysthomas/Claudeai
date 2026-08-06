import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { SearchBar } from '../../src/features/products/SearchBar';

// A small controlled wrapper to exercise typing + clear like the real page.
function Harness() {
  const [value, setValue] = useState('');
  return <SearchBar value={value} onChange={setValue} onClear={() => setValue('')} />;
}

describe('SearchBar', () => {
  it('accepts typed input', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByRole('searchbox');
    await user.type(input, 'walk');
    expect(input).toHaveValue('walk');
  });

  it('shows a clear button only when there is text, and clears on click', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByRole('searchbox');
    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
    await user.type(input, 'SHOE-WALK-001');
    await user.click(screen.getByLabelText('Clear search'));
    expect(input).toHaveValue('');
  });

  it('calls onChange as the user types', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} onClear={vi.fn()} />);
    await user.type(screen.getByRole('searchbox'), 'a');
    expect(onChange).toHaveBeenCalledWith('a');
  });
});
