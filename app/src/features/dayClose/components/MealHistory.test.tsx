// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    render(
      <MealHistory
        meals={[]}
        isLoading={false}
        todayHasMeals={false}
        isTodayClosed={false}
        todayAnalysis={null}
        isClosingToday={false}
        onCloseDay={vi.fn()}
      />
    );

    expect(screen.getByText('Aún no has registrado comidas.')).toBeInTheDocument();
  });

  it('groups meals by calendar day and shows a per-day calorie total', () => {
    render(
      <MealHistory
        meals={[meal({ id: 'meal-1', date: '2026-01-01', calories: 500 }), meal({ id: 'meal-2', date: '2026-01-01', calories: 300 })]}
        isLoading={false}
        todayHasMeals={false}
        isTodayClosed={false}
        todayAnalysis={null}
        isClosingToday={false}
        onCloseDay={vi.fn()}
      />
    );

    expect(screen.getByText('800 kcal')).toBeInTheDocument();
    expect(screen.getAllByText('Pollo con arroz')).toHaveLength(2);
  });

  it('shows a disabled/hidden close-day prompt message when today has no meals yet', () => {
    render(
      <MealHistory
        meals={[]}
        isLoading={false}
        todayHasMeals={false}
        isTodayClosed={false}
        todayAnalysis={null}
        isClosingToday={false}
        onCloseDay={vi.fn()}
      />
    );

    expect(screen.getByText('Registra al menos una comida hoy para poder cerrar el día.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cerrar día' })).not.toBeInTheDocument();
  });

  it('calls onCloseDay when the close-day button is clicked', async () => {
    const user = userEvent.setup();
    const onCloseDay = vi.fn();
    render(
      <MealHistory
        meals={[meal()]}
        isLoading={false}
        todayHasMeals
        isTodayClosed={false}
        todayAnalysis={null}
        isClosingToday={false}
        onCloseDay={onCloseDay}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Cerrar día' }));
    expect(onCloseDay).toHaveBeenCalledTimes(1);
  });

  it('shows the analysis text instead of the button once today is closed', () => {
    render(
      <MealHistory
        meals={[meal()]}
        isLoading={false}
        todayHasMeals
        isTodayClosed
        todayAnalysis="¡Buen trabajo hoy!"
        isClosingToday={false}
        onCloseDay={vi.fn()}
      />
    );

    expect(screen.getByText('¡Buen trabajo hoy!')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cerrar día' })).not.toBeInTheDocument();
  });
});
