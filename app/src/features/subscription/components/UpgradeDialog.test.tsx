// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UpgradeDialog } from './UpgradeDialog';

describe('UpgradeDialog', () => {
  it('is hidden when closed', () => {
    render(<UpgradeDialog open={false} onOpenChange={vi.fn()} isUpgrading={false} onConfirm={vi.fn()} />);

    expect(screen.queryByText('Actualizar a Premium')).not.toBeInTheDocument();
  });

  it('shows the confirmation copy and calls onConfirm', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<UpgradeDialog open onOpenChange={vi.fn()} isUpgrading={false} onConfirm={onConfirm} />);

    expect(screen.getByRole('heading', { name: 'Actualizar a Premium' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Actualizar a Premium' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('disables both actions while upgrading', () => {
    render(<UpgradeDialog open onOpenChange={vi.fn()} isUpgrading onConfirm={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
  });

  it('calls onOpenChange(false) when the user cancels', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<UpgradeDialog open onOpenChange={onOpenChange} isUpgrading={false} onConfirm={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
