// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UsageLimits } from './UsageLimits';

describe('UsageLimits', () => {
  it('shows both usage counters as count / limit', () => {
    render(<UsageLimits mealAnalysis={{ count: 3, limit: 10 }} chatMessages={{ count: 5, limit: 10 }} />);

    expect(screen.getByText('3 / 10')).toBeInTheDocument();
    expect(screen.getByText('5 / 10')).toBeInTheDocument();
    expect(screen.getByText('Análisis de comidas con IA')).toBeInTheDocument();
    expect(screen.getByText('Mensajes al coach de IA')).toBeInTheDocument();
  });

  it('shows a fully-used limit', () => {
    render(<UsageLimits mealAnalysis={{ count: 10, limit: 10 }} chatMessages={{ count: 0, limit: 10 }} />);

    expect(screen.getByText('10 / 10')).toBeInTheDocument();
    expect(screen.getByText('0 / 10')).toBeInTheDocument();
  });
});
