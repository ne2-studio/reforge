// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MealLogger } from './MealLogger';
import { MealLibraryItem } from '@/types';

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

  it('does not show the "cargar de biblioteca" picker or the "guardar en biblioteca" button when no library wiring is provided', () => {
    render(<MealLogger isSaving={false} onSave={vi.fn()} />);

    expect(screen.queryByLabelText('Cargar de biblioteca')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Guardar en biblioteca/ })).not.toBeInTheDocument();
  });

  it('pre-fills the manual form from a selected library item', async () => {
    const user = userEvent.setup();
    const libraryItems = [
      new MealLibraryItem({
        id: 'library-1',
        title: 'Pollo con arroz',
        description: 'Pechuga de pollo a la plancha con arroz blanco',
        category: 'lunch',
        calories: 600,
        protein: 50,
        carbs: 60,
        fats: 15,
      }),
    ];

    render(<MealLogger isSaving={false} onSave={vi.fn()} libraryItems={libraryItems} />);

    await user.click(screen.getByLabelText('Cargar de biblioteca'));
    await user.click(screen.getByRole('option', { name: 'Pollo con arroz' }));

    expect(screen.getByLabelText('Descripción')).toHaveValue('Pechuga de pollo a la plancha con arroz blanco');
    expect(screen.getByLabelText('Calorías (kcal)')).toHaveValue(600);
    expect(screen.getByLabelText('Proteína (g)')).toHaveValue(50);
    expect(screen.getByLabelText('Carbohidratos (g)')).toHaveValue(60);
    expect(screen.getByLabelText('Grasas (g)')).toHaveValue(15);
  });

  it('does not show the "Analizar y guardar" button behavior when onAnalyze is not provided', async () => {
    const user = userEvent.setup();
    render(<MealLogger isSaving={false} onSave={vi.fn()} />);

    await user.click(screen.getByRole('tab', { name: 'Analizar con IA' }));
    await user.type(screen.getByLabelText('Descripción'), 'Pollo con arroz');

    // No onAnalyze wired — clicking must not throw, and there's nothing to assert was called.
    await user.click(screen.getByRole('button', { name: /Analizar y guardar/ }));
  });

  it('submits the free-text AI-analysis form (no macro inputs) and resets it', async () => {
    const user = userEvent.setup();
    const onAnalyze = vi.fn();
    render(<MealLogger isSaving={false} onSave={vi.fn()} onAnalyze={onAnalyze} />);

    await user.click(screen.getByRole('tab', { name: 'Analizar con IA' }));

    expect(screen.queryByLabelText('Calorías (kcal)')).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('Descripción'), '2 huevos revueltos con aguacate');
    await user.click(screen.getByRole('button', { name: /Analizar y guardar/ }));

    expect(onAnalyze).toHaveBeenCalledWith(
      expect.objectContaining({ mealText: '2 huevos revueltos con aguacate' })
    );
    expect(screen.getByLabelText('Descripción')).toHaveValue('');
  });

  it('disables the "Analizar y guardar" button until a meal description is entered', async () => {
    const user = userEvent.setup();
    render(<MealLogger isSaving={false} onSave={vi.fn()} onAnalyze={vi.fn()} />);

    await user.click(screen.getByRole('tab', { name: 'Analizar con IA' }));

    expect(screen.getByRole('button', { name: /Analizar y guardar/ })).toBeDisabled();
  });

  it('shows the analyzing state and disables the button while analyzing', async () => {
    const user = userEvent.setup();
    render(<MealLogger isSaving={false} onSave={vi.fn()} onAnalyze={vi.fn()} isAnalyzing />);

    await user.click(screen.getByRole('tab', { name: 'Analizar con IA' }));

    expect(screen.getByRole('button', { name: /Analizando/ })).toBeDisabled();
  });

  it('opens the "guardar en biblioteca" dialog pre-filled from the current form and submits it', async () => {
    const user = userEvent.setup();
    const onSaveToLibrary = vi.fn();
    render(<MealLogger isSaving={false} onSave={vi.fn()} onSaveToLibrary={onSaveToLibrary} />);

    await user.type(screen.getByLabelText('Descripción'), 'Pollo con arroz');
    await user.type(screen.getByLabelText('Calorías (kcal)'), '600');
    await user.type(screen.getByLabelText('Proteína (g)'), '50');
    await user.type(screen.getByLabelText('Carbohidratos (g)'), '60');
    await user.type(screen.getByLabelText('Grasas (g)'), '15');

    await user.click(screen.getByRole('button', { name: /Guardar en biblioteca/ }));

    const dialogDescription = screen.getByLabelText('Descripción', { selector: '#libraryDescription' });
    expect(dialogDescription).toHaveValue('Pollo con arroz');

    await user.type(screen.getByLabelText('Título'), 'Mi comida favorita');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(onSaveToLibrary).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Mi comida favorita',
        description: 'Pollo con arroz',
        calories: 600,
        protein: 50,
        carbs: 60,
        fats: 15,
      })
    );
  });
});
