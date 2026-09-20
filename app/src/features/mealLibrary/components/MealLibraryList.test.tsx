// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MealLibraryList } from './MealLibraryList';
import { MealLibraryItem } from '@/types';

const chickenItem = new MealLibraryItem({
  id: 'library-1',
  title: 'Pollo con arroz',
  description: 'Pechuga de pollo a la plancha con arroz blanco',
  category: 'lunch',
  calories: 600,
  protein: 50,
  carbs: 60,
  fats: 15,
});

const oatmealItem = new MealLibraryItem({
  id: 'library-2',
  title: 'Avena con fruta',
  description: 'Avena con plátano y arándanos',
  category: 'breakfast',
  calories: 350,
  protein: 12,
  carbs: 55,
  fats: 8,
});

describe('MealLibraryList', () => {
  it('shows an empty-state message in Spanish when there are no items', () => {
    render(<MealLibraryList items={[]} isLoading={false} onDelete={vi.fn()} />);

    expect(screen.getByText('Aún no has guardado ninguna comida en tu biblioteca.')).toBeInTheDocument();
  });

  it('shows a loading message when loading and there are no items yet', () => {
    render(<MealLibraryList items={[]} isLoading onDelete={vi.fn()} />);

    expect(screen.getByText('Cargando biblioteca de comidas…')).toBeInTheDocument();
  });

  it('groups items by category with Spanish labels, ordered by the day', () => {
    render(<MealLibraryList items={[chickenItem, oatmealItem]} isLoading={false} onDelete={vi.fn()} />);

    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(headings).toEqual(['Desayuno', 'Comida']);
    expect(screen.getByText('Pollo con arroz')).toBeInTheDocument();
    expect(screen.getByText('Avena con fruta')).toBeInTheDocument();
  });

  it('deletes an item after confirming in the alert dialog', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<MealLibraryList items={[chickenItem]} isLoading={false} onDelete={onDelete} />);

    await user.click(screen.getByRole('button', { name: 'Eliminar Pollo con arroz' }));
    expect(screen.getByText('¿Eliminar de la biblioteca?')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Eliminar' }));

    expect(onDelete).toHaveBeenCalledWith('library-1');
  });

  it('does not delete when the confirmation is cancelled', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<MealLibraryList items={[chickenItem]} isLoading={false} onDelete={onDelete} />);

    await user.click(screen.getByRole('button', { name: 'Eliminar Pollo con arroz' }));
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onDelete).not.toHaveBeenCalled();
  });
});
