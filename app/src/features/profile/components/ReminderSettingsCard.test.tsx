// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReminderSettingsCard } from './ReminderSettingsCard';
import { CustomReminder, ReminderSettings } from '@/types';

const settings = new ReminderSettings({
  enabled: true,
  channel: 'push',
  defaultTime: '08:00',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

const reminder = new CustomReminder({
  id: 'reminder-1',
  label: 'Registra tu cena',
  time: '20:00',
  daysOfWeek: ['monday', 'wednesday'],
  enabled: true,
  updatedAt: '2026-01-01T00:00:00.000Z',
});

describe('ReminderSettingsCard', () => {
  it('shows a loading state while reminders are being fetched', () => {
    render(
      <ReminderSettingsCard
        settings={null}
        customReminders={[]}
        isLoading
        isSavingSettings={false}
        onSaveSettings={vi.fn()}
        onCreateReminder={vi.fn()}
        onUpdateReminder={vi.fn()}
        onDeleteReminder={vi.fn()}
      />
    );

    expect(screen.queryByLabelText('Activar recordatorios')).not.toBeInTheDocument();
  });

  it('defaults to disabled reminders when no settings have been saved yet', () => {
    render(
      <ReminderSettingsCard
        settings={null}
        customReminders={[]}
        isLoading={false}
        isSavingSettings={false}
        onSaveSettings={vi.fn()}
        onCreateReminder={vi.fn()}
        onUpdateReminder={vi.fn()}
        onDeleteReminder={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Activar recordatorios')).not.toBeChecked();
  });

  it('reflects already-saved settings and lets the user save changes', async () => {
    const user = userEvent.setup();
    const onSaveSettings = vi.fn();

    render(
      <ReminderSettingsCard
        settings={settings}
        customReminders={[]}
        isLoading={false}
        isSavingSettings={false}
        onSaveSettings={onSaveSettings}
        onCreateReminder={vi.fn()}
        onUpdateReminder={vi.fn()}
        onDeleteReminder={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Activar recordatorios')).toBeChecked();

    await user.click(screen.getByLabelText('Activar recordatorios'));
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(onSaveSettings).toHaveBeenCalledWith({ enabled: false, channel: 'push', defaultTime: '08:00' });
  });

  it('shows an empty state in Spanish when there are no custom reminders', () => {
    render(
      <ReminderSettingsCard
        settings={settings}
        customReminders={[]}
        isLoading={false}
        isSavingSettings={false}
        onSaveSettings={vi.fn()}
        onCreateReminder={vi.fn()}
        onUpdateReminder={vi.fn()}
        onDeleteReminder={vi.fn()}
      />
    );

    expect(screen.getByText('Aún no tienes recordatorios personalizados.')).toBeInTheDocument();
  });

  it('lists existing custom reminders', () => {
    render(
      <ReminderSettingsCard
        settings={settings}
        customReminders={[reminder]}
        isLoading={false}
        isSavingSettings={false}
        onSaveSettings={vi.fn()}
        onCreateReminder={vi.fn()}
        onUpdateReminder={vi.fn()}
        onDeleteReminder={vi.fn()}
      />
    );

    expect(screen.getByText('Registra tu cena')).toBeInTheDocument();
    expect(screen.getByText('20:00 · Lunes, Miércoles')).toBeInTheDocument();
  });

  it('creates a new custom reminder via the dialog', async () => {
    const user = userEvent.setup();
    const onCreateReminder = vi.fn();

    render(
      <ReminderSettingsCard
        settings={settings}
        customReminders={[]}
        isLoading={false}
        isSavingSettings={false}
        onSaveSettings={vi.fn()}
        onCreateReminder={onCreateReminder}
        onUpdateReminder={vi.fn()}
        onDeleteReminder={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Nuevo' }));
    await user.type(screen.getByLabelText('Mensaje'), 'Registra tu almuerzo');
    await user.click(screen.getByRole('button', { name: 'Martes' }));
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(onCreateReminder).toHaveBeenCalledWith({
      label: 'Registra tu almuerzo',
      time: '20:00',
      daysOfWeek: ['tuesday'],
      enabled: true,
    });
  });

  it('deletes a custom reminder after confirming', async () => {
    const user = userEvent.setup();
    const onDeleteReminder = vi.fn();

    render(
      <ReminderSettingsCard
        settings={settings}
        customReminders={[reminder]}
        isLoading={false}
        isSavingSettings={false}
        onSaveSettings={vi.fn()}
        onCreateReminder={vi.fn()}
        onUpdateReminder={vi.fn()}
        onDeleteReminder={onDeleteReminder}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Eliminar Registra tu cena' }));
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Eliminar' }));

    expect(onDeleteReminder).toHaveBeenCalledWith('reminder-1');
  });
});
