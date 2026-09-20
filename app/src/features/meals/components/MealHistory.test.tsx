// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MealHistory } from './MealHistory';
import { Meal, type MealDtoShape } from '@/types';

function meal(overrides: Partial<MealDtoShape> = {}) {
  return new Meal({
    id: 'meal-1',
    mealText: 'Pollo con arroz',
    category: 'lunch',
    time: '13:30',
    calories: 500,
    protein: 40,
    carbs: 50,
    fats: 10,
    feedback: null,
    extraData: null,
    timestamp: '2026-01-01T13:30:00.000Z',
    date: '2026-01-01',
    ...overrides,
  });
}

describe('MealHistory', () => {
  it('shows an empty-state message when there are no meals', () => {
    render(<MealHistory meals={[]} isLoading={false} />);

    expect(screen.getByText('Aún no has registrado comidas.')).toBeInTheDocument();
  });

  it('groups meals by calendar day and shows a per-day calorie total', () => {
    render(
      <MealHistory
        meals={[meal({ id: 'meal-1', date: '2026-01-01', calories: 500 }), meal({ id: 'meal-2', date: '2026-01-01', calories: 300 })]}
        isLoading={false}
      />
    );

    expect(screen.getByText('800 kcal')).toBeInTheDocument();
    expect(screen.getAllByText('Pollo con arroz')).toHaveLength(2);
  });
});
