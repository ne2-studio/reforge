// @vitest-environment jsdom
// http.ts reads `window.__ENV__` via runtimeConfig.ts's getEnv() at module load time, so this
// suite needs a DOM even though it's otherwise plain unit-level logic.
import { describe, expect, it, vi } from 'vitest';

vi.mock('../http', async () => {
  const actual = await vi.importActual<typeof import('../http')>('../http');
  return { ...actual, get: vi.fn(), post: vi.fn() };
});

import { get, post } from '../http';
import { measurementsApi } from './measurements';

const measurementDto = {
  id: 'measurement-1',
  weight: 82.5,
  waist: 90,
  neck: 40,
  timestamp: '2026-01-01T13:00:00.000Z',
};

describe('measurementsApi', () => {
  it('getMeasurements hydrates Measurement instances from GET /api/measurements', async () => {
    vi.mocked(get).mockResolvedValue([measurementDto]);

    const measurements = await measurementsApi.getMeasurements();

    expect(get).toHaveBeenCalledWith('/api/measurements');
    expect(measurements).toHaveLength(1);
    expect(measurements[0].weight).toBe(82.5);
    expect(measurements[0].waist).toBe(90);
    expect(measurements[0].neck).toBe(40);
  });

  it('logMeasurement posts to /api/measurements and hydrates the response', async () => {
    vi.mocked(post).mockResolvedValue(measurementDto);

    const measurement = await measurementsApi.logMeasurement({ weight: 82.5, waist: 90, neck: 40 });

    expect(post).toHaveBeenCalledWith('/api/measurements', { weight: 82.5, waist: 90, neck: 40 });
    expect(measurement.id).toBe('measurement-1');
  });
});
