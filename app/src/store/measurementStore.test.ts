import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMeasurementStore } from './measurementStore';

// Mocked before importing useCases so the module under test picks up the mock, not the real
// fetch-backed api.ts.
vi.mock('@/api', () => ({
  api: {
    measurements: {
      getMeasurements: vi.fn(),
      logMeasurement: vi.fn(),
    },
  },
}));

import { api } from '@/api';
import { loadMeasurements, logMeasurement } from '@/features/measurements/useCases';
import { Measurement, type LogMeasurementData } from '@/types';

const measurementDto = {
  id: 'measurement-1',
  weight: 82.5,
  waist: 90,
  neck: 40,
  timestamp: '2026-01-01T13:00:00.000Z',
};

describe('measurementStore + measurements useCases', () => {
  beforeEach(() => {
    useMeasurementStore.setState({ measurements: [], isLoading: false, error: null });
    vi.clearAllMocks();
  });

  it('loadMeasurements populates the store on success', async () => {
    vi.mocked(api.measurements.getMeasurements).mockResolvedValue([new Measurement(measurementDto)]);

    await loadMeasurements();

    const state = useMeasurementStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.measurements).toHaveLength(1);
    expect(state.measurements[0].weight).toBe(82.5);
  });

  it('loadMeasurements records an error message on failure', async () => {
    vi.mocked(api.measurements.getMeasurements).mockRejectedValue(new Error('network down'));

    await loadMeasurements();

    const state = useMeasurementStore.getState();
    expect(state.error).toBe('network down');
    expect(state.isLoading).toBe(false);
  });

  it('logMeasurement saves and prepends the measurement to the store', async () => {
    vi.mocked(api.measurements.logMeasurement).mockResolvedValue(new Measurement(measurementDto));
    const payload: LogMeasurementData = { weight: 82.5, waist: 90, neck: 40 };

    await logMeasurement(payload);

    expect(api.measurements.logMeasurement).toHaveBeenCalledWith(payload);
    const state = useMeasurementStore.getState();
    expect(state.measurements).toHaveLength(1);
    expect(state.isLoading).toBe(false);
  });

  it('logMeasurement records an error and rethrows on failure', async () => {
    vi.mocked(api.measurements.logMeasurement).mockRejectedValue(new Error('save failed'));

    await expect(logMeasurement({ weight: 82.5, waist: null, neck: null })).rejects.toThrow('save failed');

    expect(useMeasurementStore.getState().error).toBe('save failed');
  });

  it('reset clears the store back to its initial state', () => {
    useMeasurementStore.setState({
      measurements: [new Measurement(measurementDto)],
      isLoading: true,
      error: 'x',
    });

    useMeasurementStore.getState().reset();

    expect(useMeasurementStore.getState()).toMatchObject({
      measurements: [],
      isLoading: false,
      error: null,
    });
  });
});
