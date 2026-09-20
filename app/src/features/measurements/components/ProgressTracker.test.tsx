// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProgressTracker } from './ProgressTracker';
import { Measurement, UserProfile } from '@/types';

const measurement = new Measurement({
  id: 'measurement-1',
  weight: 82.5,
  waist: 90,
  neck: 40,
  timestamp: '2026-01-01T13:00:00.000Z',
});

const profile = new UserProfile({
  age: 28,
  gender: 'male',
  height: 181,
  weight: 82.5,
  activityLevel: null,
  goal: null,
  trainingDays: null,
  trainingType: null,
  trainingTime: null,
  restrictions: null,
  calorieTarget: null,
  extraData: null,
  updatedAt: '2026-01-01T08:00:00.000Z',
});

describe('ProgressTracker', () => {
  it('shows an empty-state message in Spanish when there are no measurements', () => {
    render(
      <ProgressTracker measurements={[]} profile={null} isLoading={false} isSaving={false} onLog={vi.fn()} />
    );

    expect(screen.getByText((_, element) => element?.textContent === 'Aún no tienes medidas¡Empieza a trackear tu progreso! 💪')).toBeInTheDocument();
  });

  it('disables save until at least one field is filled', async () => {
    const user = userEvent.setup();
    render(
      <ProgressTracker measurements={[]} profile={null} isLoading={false} isSaving={false} onLog={vi.fn()} />
    );

    await user.click(screen.getByRole('button', { name: 'Nueva medida' }));
    const saveButton = screen.getByRole('button', { name: 'Guardar' });
    expect(saveButton).toBeDisabled();

    await user.type(screen.getByLabelText('Peso (kg)'), '82.5');
    expect(saveButton).not.toBeDisabled();
  });

  it('logs a measurement with only the filled fields, nulling the rest', async () => {
    const user = userEvent.setup();
    const onLog = vi.fn();
    render(
      <ProgressTracker measurements={[]} profile={null} isLoading={false} isSaving={false} onLog={onLog} />
    );

    await user.click(screen.getByRole('button', { name: 'Nueva medida' }));
    await user.type(screen.getByLabelText('Peso (kg)'), '82.5');
    await user.type(screen.getByLabelText('Cintura (cm)'), '90');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(onLog).toHaveBeenCalledWith({ weight: 82.5, waist: 90, neck: null });
  });

  it('shows the saving state and disables the save button while saving', async () => {
    const user = userEvent.setup();
    render(<ProgressTracker measurements={[]} profile={null} isLoading={false} isSaving onLog={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Nueva medida' }));
    expect(screen.getByRole('button', { name: /Guardando/ })).toBeDisabled();
  });

  it('shows stat cards for the latest measurement without a profile', () => {
    render(
      <ProgressTracker
        measurements={[measurement]}
        profile={null}
        isLoading={false}
        isSaving={false}
        onLog={vi.fn()}
      />
    );

    expect(screen.getByText('82.5 kg')).toBeInTheDocument();
    expect(screen.getByText('90 cm')).toBeInTheDocument();
    expect(screen.getByText('40 cm')).toBeInTheDocument();
    expect(screen.queryByText('Grasa')).not.toBeInTheDocument();
  });

  it('shows the body-fat and lean-mass estimate once a profile with height/gender is available', () => {
    render(
      <ProgressTracker
        measurements={[measurement]}
        profile={profile}
        isLoading={false}
        isSaving={false}
        onLog={vi.fn()}
      />
    );

    expect(screen.getByText('Grasa')).toBeInTheDocument();
    expect(screen.getByText('Músculo')).toBeInTheDocument();
    expect(screen.getByText('18.2%')).toBeInTheDocument();
  });
});
