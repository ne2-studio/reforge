// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FloatingCoachButton } from './FloatingCoachButton';

describe('FloatingCoachButton', () => {
  it('calls onClick when pressed', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<FloatingCoachButton onClick={onClick} />);

    await user.click(screen.getByRole('button', { name: 'Habla con tu coach' }));

    expect(onClick).toHaveBeenCalledOnce();
  });
});
