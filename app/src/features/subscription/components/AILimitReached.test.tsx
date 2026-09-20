// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AILimitReached } from './AILimitReached';

describe('AILimitReached', () => {
  it('is hidden when closed', () => {
    render(<AILimitReached open={false} onOpenChange={vi.fn()} feature="mealAnalysis" onUpgrade={vi.fn()} />);

    expect(screen.queryByText('Límite de IA alcanzado')).not.toBeInTheDocument();
  });

  it('shows meal-analysis specific copy and calls onUpgrade', async () => {
    const user = userEvent.setup();
    const onUpgrade = vi.fn();
    render(<AILimitReached open onOpenChange={vi.fn()} feature="mealAnalysis" onUpgrade={onUpgrade} />);

    expect(
      screen.getByText('Has alcanzado tu límite mensual de análisis de comidas con IA.')
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Actualizar a Premium' }));
    expect(onUpgrade).toHaveBeenCalledTimes(1);
  });

  it('shows chat-messages specific copy', () => {
    render(<AILimitReached open onOpenChange={vi.fn()} feature="chatMessages" onUpgrade={vi.fn()} />);

    expect(screen.getByText('Has alcanzado tu límite mensual de mensajes al coach de IA.')).toBeInTheDocument();
  });
});
