// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DayHistory } from './DayHistory';
import { ClosedDay, type ClosedDayDtoShape } from '@/types';

const closedDayDto: ClosedDayDtoShape = {
  date: '2026-01-01',
  closedAt: '2026-01-01T22:00:00.000Z',
  totalCalories: 2100,
  mealsCount: 4,
  isTrainingDay: true,
  analysis: 'Buen día, mantuviste el déficit calórico.',
};

const closedDay = new ClosedDay(closedDayDto);

describe('DayHistory', () => {
  it('shows an empty-state message when there is no history yet', () => {
    render(<DayHistory days={[]} isLoading={false} />);

    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === 'P' &&
          element.textContent === 'Sin historial aúnCierra tu primer día para empezar a construir tu historial'
      )
    ).toBeInTheDocument();
  });

  it('shows date, total calories, meal count, training day and analysis for each closed day', () => {
    render(<DayHistory days={[closedDay]} isLoading={false} />);

    expect(screen.getByText('2100 kcal')).toBeInTheDocument();
    expect(screen.getByText('4 comidas')).toBeInTheDocument();
    expect(screen.getByText('Día de entrenamiento')).toBeInTheDocument();
    expect(screen.getByText('Buen día, mantuviste el déficit calórico.')).toBeInTheDocument();
  });

  it('marks a rest day distinctly from a training day', () => {
    const restDay = new ClosedDay({ ...closedDayDto, isTrainingDay: false });
    render(<DayHistory days={[restDay]} isLoading={false} />);

    expect(screen.getByText('Día de descanso')).toBeInTheDocument();
  });
});
