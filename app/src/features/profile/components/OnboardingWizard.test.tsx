// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OnboardingWizard } from './OnboardingWizard';

describe('OnboardingWizard', () => {
  it('walks through all steps and submits the collected data on completion', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();

    render(<OnboardingWizard isSaving={false} onComplete={onComplete} />);

    // Step 1 — basic info
    expect(screen.getByText('Paso 1 de 5')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Edad'), '28');
    await user.click(screen.getByLabelText('Hombre'));
    await user.click(screen.getByRole('button', { name: /Siguiente/ }));

    // Step 2 — measurements
    await user.type(screen.getByLabelText('Peso (kg)'), '80');
    await user.type(screen.getByLabelText('Altura (cm)'), '180');
    await user.click(screen.getByRole('button', { name: /Siguiente/ }));

    // Step 3 — goal
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('🎯 Mantener'));
    await user.click(screen.getByRole('button', { name: /Siguiente/ }));

    // Step 4 — restrictions
    await user.type(screen.getByLabelText(/Alergias/), 'Sin lactosa');
    await user.click(screen.getByRole('button', { name: /Siguiente/ }));

    // Step 5 — training
    expect(screen.getByText('Paso 5 de 5')).toBeInTheDocument();
    await user.click(screen.getByLabelText('Lunes'));
    await user.click(screen.getByRole('button', { name: /Completar/ }));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        age: 28,
        gender: 'male',
        weight: 80,
        height: 180,
        goal: 'maintain',
        restrictions: 'Sin lactosa',
        trainingDays: ['monday'],
        activityLevel: null,
        calorieTarget: null,
        extraData: null,
      })
    );
  });

  it('disables going back on the first step and shows the saving state on the last', async () => {
    const user = userEvent.setup();

    render(<OnboardingWizard isSaving onComplete={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Atrás/ })).toBeDisabled();

    for (let i = 0; i < 4; i++) {
      await user.click(screen.getByRole('button', { name: /Siguiente/ }));
    }

    expect(screen.getByRole('button', { name: 'Guardando...' })).toBeDisabled();
  });
});
