// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MealLogger } from './MealLogger';

describe('MealLogger', () => {
  it('disables the save button until the required fields are filled', async () => {
    const user = userEvent.setup();
    render(<MealLogger isSaving={false} onSave={vi.fn()} />);

    const saveButton = screen.getByRole('button', { name: /Guardar comida/ });
    expect(saveButton).toBeDisabled();

    await user.type(screen.getByLabelText('Descripción'), 'Pollo con arroz');
    await user.type(screen.getByLabelText('Calorías (kcal)'), '600');
    await user.type(screen.getByLabelText('Proteína (g)'), '50');
    await user.type(screen.getByLabelText('Carbohidratos (g)'), '60');
    await user.type(screen.getByLabelText('Grasas (g)'), '15');

    expect(saveButton).not.toBeDisabled();
  });

  it('submits the manually-entered macro values and resets the form', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<MealLogger isSaving={false} onSave={onSave} />);

    await user.type(screen.getByLabelText('Descripción'), 'Pollo con arroz');
    await user.type(screen.getByLabelText('Calorías (kcal)'), '600');
    await user.type(screen.getByLabelText('Proteína (g)'), '50');
    await user.type(screen.getByLabelText('Carbohidratos (g)'), '60');
    await user.type(screen.getByLabelText('Grasas (g)'), '15');

    await user.click(screen.getByRole('button', { name: /Guardar comida/ }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        mealText: 'Pollo con arroz',
        calories: 600,
        protein: 50,
        carbs: 60,
        fats: 15,
      })
    );
    expect(screen.getByLabelText('Descripción')).toHaveValue('');
  });

  it('shows the saving state and disables the save button while saving', () => {
    render(<MealLogger isSaving onSave={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Guardando/ })).toBeDisabled();
  });
});
