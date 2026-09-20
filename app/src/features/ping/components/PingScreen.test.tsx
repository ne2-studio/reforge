// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PingScreen } from './PingScreen';
import { PingResult } from '@/types';

describe('PingScreen', () => {
  it('shows the loading state while the request is in flight', () => {
    render(<PingScreen result={null} isLoading error={null} onRetry={vi.fn()} onSignOut={vi.fn()} onGoToProfile={vi.fn()} onGoToMeals={vi.fn()} onGoToMealLibrary={vi.fn()} onGoToActivity={vi.fn()} onGoToWorkouts={vi.fn()} />);

    expect(screen.getByText('Consultando la API…')).toBeInTheDocument();
  });

  it('renders the synced user id and timestamp once the ping resolves', () => {
    const result = new PingResult({ sub: 'user-123', serverTimeUtc: '2026-01-01T12:00:00.000Z' });

    render(<PingScreen result={result} isLoading={false} error={null} onRetry={vi.fn()} onSignOut={vi.fn()} onGoToProfile={vi.fn()} onGoToMeals={vi.fn()} onGoToMealLibrary={vi.fn()} onGoToActivity={vi.fn()} onGoToWorkouts={vi.fn()} />);

    expect(screen.getByText('user-123')).toBeInTheDocument();
    expect(screen.getByText('2026-01-01T12:00:00.000Z')).toBeInTheDocument();
  });

  it('shows the error message and lets the user retry', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(
      <PingScreen
        result={null}
        isLoading={false}
        error="No se pudo contactar con la API"
        onRetry={onRetry}
        onSignOut={vi.fn()}
        onGoToProfile={vi.fn()}
        onGoToMeals={vi.fn()}
        onGoToMealLibrary={vi.fn()}
        onGoToActivity={vi.fn()}
        onGoToWorkouts={vi.fn()}
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo contactar con la API');

    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
