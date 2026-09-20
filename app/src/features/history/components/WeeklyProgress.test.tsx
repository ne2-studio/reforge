// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WeeklyProgress } from './WeeklyProgress';
import { WeeklyProgress as WeeklyProgressData } from '@/types';

const weeklyProgress = new WeeklyProgressData({
  days: [
    {
      date: '2026-01-01',
      targetCalories: 2200,
      consumedCalories: 2000,
      deficit: -200,
      mealsCount: 3,
    },
    {
      date: '2026-01-02',
      targetCalories: 2200,
      consumedCalories: 2500,
      deficit: 300,
      mealsCount: 2,
    },
  ],
  totalDeficit: -1000,
  daysInDeficit: 5,
  daysInSurplus: 2,
  daysWithMeals: 7,
  adherenceStreak: 3,
  insights: ['Mantuviste el déficit 5 de 7 días.'],
});

describe('WeeklyProgress', () => {
  it('shows an empty-state message when there is no data yet', () => {
    render(<WeeklyProgress weeklyProgress={null} isLoading={false} />);

    expect(
      screen.getByText('Registra tus comidas durante la semana para ver tu progreso, patrones y recibir insights personalizados')
    ).toBeInTheDocument();
  });

  it('shows the summary card: total deficit, daily average, balance and adherence streak', () => {
    render(<WeeklyProgress weeklyProgress={weeklyProgress} isLoading={false} />);

    expect(screen.getByText('1000 kcal')).toBeInTheDocument();
    expect(screen.getByText('En déficit')).toBeInTheDocument();
    expect(screen.getAllByText('5')).not.toHaveLength(0);
    expect(screen.getAllByText('2').length).toBeGreaterThan(0);
    expect(screen.getByText('3 días')).toBeInTheDocument();
  });

  it('shows the insights list', () => {
    render(<WeeklyProgress weeklyProgress={weeklyProgress} isLoading={false} />);

    expect(screen.getByText('Mantuviste el déficit 5 de 7 días.')).toBeInTheDocument();
  });

  it('shows the per-day breakdown with target vs consumed calories and deficit/surplus', () => {
    render(<WeeklyProgress weeklyProgress={weeklyProgress} isLoading={false} />);

    expect(screen.getByText('2000 kcal')).toBeInTheDocument();
    expect(screen.getAllByText('2200 kcal')).toHaveLength(2);
    expect(screen.getByText('200 kcal')).toBeInTheDocument();
    expect(screen.getByText('300 kcal')).toBeInTheDocument();
    expect(screen.getByText('Déficit')).toBeInTheDocument();
    expect(screen.getByText('Superávit')).toBeInTheDocument();
  });
});
