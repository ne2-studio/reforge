import { get, post } from '../http';
import { Measurement, type MeasurementDtoShape, type LogMeasurementData } from '../../types';

export const measurementsApi = {
  // GET /api/measurements — the caller's own measurements, most recent first.
  async getMeasurements(): Promise<Measurement[]> {
    const data = await get<MeasurementDtoShape[]>('/api/measurements');
    return data.map((measurement) => new Measurement(measurement));
  },

  // POST /api/measurements — logs a new measurement. Returns the saved measurement, timestamp
  // server-set.
  async logMeasurement(data: LogMeasurementData): Promise<Measurement> {
    const saved = await post<MeasurementDtoShape>('/api/measurements', data);
    return new Measurement(saved);
  },
};
