// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActivityTracker } from './ActivityTracker';
import { Activity } from '@/types';

const strengthActivity = new Activity({
  id: 'activity-1',
  type: 'strength',
  duration: 45,
  steps: null,
  timestamp: '2026-01-01T13:00:00.000Z',
});

const neatActivity = new Activity({
  id: 'activity-2',
  type: 'neat',
  duration: null,
  steps: 8000,
  timestamp: '2026-01-02T13:00:00.000Z',
});

describe('ActivityTracker', () => {
  it('shows an empty-state message in Spanish when there are no activities', () => {
    render(<ActivityTracker activities={[]} isLoading={false} isSaving={false} onLog={vi.fn()} />);

    expect(screen.getByText('Aún no has registrado ninguna actividad')).toBeInTheDocument();
  });

  it('disables save until the duration field is filled for the default (strength) type', async () => {
    const user = userEvent.setup();
    render(<ActivityTracker activities={[]} isLoading={false} isSaving={false} onLog={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Registrar actividad' }));
    const saveButton = screen.getByRole('button', { name: 'Guardar actividad' });
    expect(saveButton).toBeDisabled();

    await user.type(screen.getByLabelText('Duración (minutos)'), '45');
    expect(saveButton).not.toBeDisabled();
  });

  it('logs a strength activity with duration', async () => {
    const user = userEvent.setup();
    const onLog = vi.fn();
    render(<ActivityTracker activities={[]} isLoading={false} isSaving={false} onLog={onLog} />);

    await user.click(screen.getByRole('button', { name: 'Registrar actividad' }));
    await user.type(screen.getByLabelText('Duración (minutos)'), '45');
    await user.click(screen.getByRole('button', { name: 'Guardar actividad' }));

    expect(onLog).toHaveBeenCalledWith({ type: 'strength', duration: 45, steps: null });
  });

  it('switches to the steps field when NEAT is selected and logs steps', async () => {
    const user = userEvent.setup();
    const onLog = vi.fn();
    render(<ActivityTracker activities={[]} isLoading={false} isSaving={false} onLog={onLog} />);

    await user.click(screen.getByRole('button', { name: 'Registrar actividad' }));
    await user.click(screen.getByRole('button', { name: 'NEAT' }));

    expect(screen.queryByLabelText('Duración (minutos)')).not.toBeInTheDocument();
    await user.type(screen.getByLabelText('Número de pasos'), '8000');
    await user.click(screen.getByRole('button', { name: 'Guardar actividad' }));

    expect(onLog).toHaveBeenCalledWith({ type: 'neat', duration: null, steps: 8000 });
  });

  it('shows the saving state and disables the save button while saving', async () => {
    const user = userEvent.setup();
    render(<ActivityTracker activities={[]} isLoading={false} isSaving onLog={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Registrar actividad' }));
    expect(screen.getByRole('button', { name: /Guardando/ })).toBeDisabled();
  });

  it('shows a history list with the type-specific field and an estimated calorie count', () => {
    render(
      <ActivityTracker
        activities={[strengthActivity, neatActivity]}
        isLoading={false}
        isSaving={false}
        onLog={vi.fn()}
      />
    );

    expect(screen.getByText('Entreno de fuerza')).toBeInTheDocument();
    expect(screen.getByText('45 min')).toBeInTheDocument();
    expect(screen.getByText('270 kcal')).toBeInTheDocument();

    expect(screen.getByText('NEAT')).toBeInTheDocument();
    expect(screen.getByText('8,000 pasos')).toBeInTheDocument();
    expect(screen.getByText('320 kcal')).toBeInTheDocument();
  });
});
