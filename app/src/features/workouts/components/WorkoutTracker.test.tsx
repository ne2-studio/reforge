// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkoutTracker } from './WorkoutTracker';
import { Workout } from '@/types';

const strengthWorkout = new Workout({
  id: 'workout-1',
  type: 'strength',
  volume: 2500,
  duration: null,
  timestamp: '2026-01-01T13:00:00.000Z',
});

const cardioWorkout = new Workout({
  id: 'workout-2',
  type: 'cardio',
  volume: null,
  duration: 30,
  timestamp: '2026-01-02T13:00:00.000Z',
});

describe('WorkoutTracker', () => {
  it('shows an empty-state message in Spanish when there are no workouts', () => {
    render(<WorkoutTracker workouts={[]} isLoading={false} isSaving={false} onLog={vi.fn()} />);

    expect(screen.getByText('Aún no has registrado ningún entreno')).toBeInTheDocument();
  });

  it('disables save until the volume field is filled for the default (strength) type', async () => {
    const user = userEvent.setup();
    render(<WorkoutTracker workouts={[]} isLoading={false} isSaving={false} onLog={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Nuevo entreno' }));
    const saveButton = screen.getByRole('button', { name: 'Guardar entreno' });
    expect(saveButton).toBeDisabled();

    await user.type(screen.getByLabelText('Volumen total levantado (kg)'), '2500');
    expect(saveButton).not.toBeDisabled();
  });

  it('logs a strength workout with volume', async () => {
    const user = userEvent.setup();
    const onLog = vi.fn();
    render(<WorkoutTracker workouts={[]} isLoading={false} isSaving={false} onLog={onLog} />);

    await user.click(screen.getByRole('button', { name: 'Nuevo entreno' }));
    await user.type(screen.getByLabelText('Volumen total levantado (kg)'), '2500');
    await user.click(screen.getByRole('button', { name: 'Guardar entreno' }));

    expect(onLog).toHaveBeenCalledWith({ type: 'strength', volume: 2500, duration: null });
  });

  it('switches to the duration field when cardio is selected and logs duration', async () => {
    const user = userEvent.setup();
    const onLog = vi.fn();
    render(<WorkoutTracker workouts={[]} isLoading={false} isSaving={false} onLog={onLog} />);

    await user.click(screen.getByRole('button', { name: 'Nuevo entreno' }));
    await user.click(screen.getByRole('button', { name: 'Cardio' }));

    expect(screen.queryByLabelText('Volumen total levantado (kg)')).not.toBeInTheDocument();
    await user.type(screen.getByLabelText('Duración (minutos)'), '30');
    await user.click(screen.getByRole('button', { name: 'Guardar entreno' }));

    expect(onLog).toHaveBeenCalledWith({ type: 'cardio', volume: null, duration: 30 });
  });

  it('shows the saving state and disables the save button while saving', async () => {
    const user = userEvent.setup();
    render(<WorkoutTracker workouts={[]} isLoading={false} isSaving onLog={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Nuevo entreno' }));
    expect(screen.getByRole('button', { name: /Guardando/ })).toBeDisabled();
  });

  it('shows stat cards and history for logged workouts', () => {
    render(
      <WorkoutTracker workouts={[strengthWorkout, cardioWorkout]} isLoading={false} isSaving={false} onLog={vi.fn()} />
    );

    expect(screen.getByText('Volumen de fuerza')).toBeInTheDocument();
    expect(screen.getByText('Duración de cardio')).toBeInTheDocument();
    expect(screen.getByText('2,500')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('2,500 kg')).toBeInTheDocument();
    expect(screen.getByText('30 min')).toBeInTheDocument();
  });
});
