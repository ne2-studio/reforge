// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileEditor } from './ProfileEditor';
import { UserProfile } from '@/types';

const profile = new UserProfile({
  age: 30,
  gender: 'male',
  height: 180,
  weight: 80,
  activityLevel: 'moderate',
  goal: 'maintain',
  trainingDays: ['monday', 'wednesday'],
  trainingType: 'strength',
  trainingTime: 'evening',
  restrictions: 'Sin gluten',
  calorieTarget: 2500,
  extraData: {},
  updatedAt: '2026-01-01T00:00:00.000Z',
});

const reminderProps = {
  reminderSettings: null,
  customReminders: [],
  isLoadingReminders: false,
  isSavingReminderSettings: false,
  onSaveReminderSettings: vi.fn(),
  onCreateReminder: vi.fn(),
  onUpdateReminder: vi.fn(),
  onDeleteReminder: vi.fn(),
};

describe('ProfileEditor', () => {
  it('renders a read-only summary of the saved profile', () => {
    render(<ProfileEditor profile={profile} isSaving={false} onSave={vi.fn()} {...reminderProps} />);

    expect(screen.getByText('30 años')).toBeInTheDocument();
    expect(screen.getByText('Hombre')).toBeInTheDocument();
    expect(screen.getByText('Mantener')).toBeInTheDocument();
    expect(screen.getByText('Sin gluten')).toBeInTheDocument();
    expect(screen.getByText('Lunes')).toBeInTheDocument();
  });

  it('lets the user edit and save, preserving fields not shown in the form', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(<ProfileEditor profile={profile} isSaving={false} onSave={onSave} {...reminderProps} />);

    await user.click(screen.getByRole('button', { name: 'Editar' }));

    const ageInput = screen.getByLabelText('Edad');
    await user.clear(ageInput);
    await user.type(ageInput, '31');

    // Scoped to the profile edit card — the Recordatorios section (ReminderSettingsCard)
    // renders its own, separate "Guardar" button below it.
    const editCard = screen.getByRole('heading', { name: 'Editar perfil' }).closest('[data-slot="card"]') as HTMLElement;
    await user.click(within(editCard).getByRole('button', { name: /Guardar/ }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        age: 31,
        gender: 'male',
        activityLevel: 'moderate',
        goal: 'maintain',
        trainingType: 'strength',
        trainingTime: 'evening',
        calorieTarget: 2500,
      })
    );
  });

  it('cancel discards edits without saving', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(<ProfileEditor profile={profile} isSaving={false} onSave={onSave} {...reminderProps} />);

    await user.click(screen.getByRole('button', { name: 'Editar' }));
    await user.clear(screen.getByLabelText('Edad'));
    await user.type(screen.getByLabelText('Edad'), '99');
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText('30 años')).toBeInTheDocument();
  });

  it('renders the Recordatorios section and forwards a settings save', async () => {
    const user = userEvent.setup();
    const onSaveReminderSettings = vi.fn();

    render(
      <ProfileEditor
        profile={profile}
        isSaving={false}
        onSave={vi.fn()}
        {...reminderProps}
        onSaveReminderSettings={onSaveReminderSettings}
      />
    );

    expect(screen.getByRole('heading', { name: 'Recordatorios' })).toBeInTheDocument();

    await user.click(screen.getByLabelText('Activar recordatorios'));
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(onSaveReminderSettings).toHaveBeenCalledWith({ enabled: true, channel: 'push', defaultTime: '08:00' });
  });
});
