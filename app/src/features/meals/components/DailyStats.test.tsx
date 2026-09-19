// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DailyStats } from './DailyStats';
import { DailyStats as DailyStatsData } from '@/types';

const dailyStats = new DailyStatsData({
  consumed: { calories: 600, protein: 50, carbs: 60, fats: 15 },
  targets: { calories: 2200, protein: 140, carbs: 200, fats: 70 },
});

describe('DailyStats', () => {
  it('shows the loading skeleton when there is no data yet', () => {
    render(<DailyStats dailyStats={null} isLoading />);

    expect(screen.queryByText('Resumen de hoy')).not.toBeInTheDocument();
  });

  it('renders consumed-vs-target macro totals', () => {
    render(<DailyStats dailyStats={dailyStats} isLoading={false} />);

    expect(screen.getByText('Resumen de hoy')).toBeInTheDocument();
    expect(screen.getByText('600 / 2200')).toBeInTheDocument();
    expect(screen.getByText('50 / 140')).toBeInTheDocument();
    expect(screen.getByText('60 / 200')).toBeInTheDocument();
    expect(screen.getByText('15 / 70')).toBeInTheDocument();
  });

  it('renders zeroed totals when there is no daily-stats data (no profile saved yet)', () => {
    render(<DailyStats dailyStats={null} isLoading={false} />);

    expect(screen.getAllByText('0 / 0')).toHaveLength(4);
  });
});
