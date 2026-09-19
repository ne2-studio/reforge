import { get } from '../http';
import { PingResult } from '../../types';

export const pingApi = {
  // GET /ping — behind JWT-bearer auth on the backend (docs/plan/01-walking-skeleton.md).
  // Proves OIDC + backend auth wiring end to end; not cached/shared across routes, so
  // PingRoute calls this directly rather than going through a store (see the Route
  // exception in docs/architecture/frontend.md).
  async ping(): Promise<PingResult> {
    const data = await get<{ sub: string; serverTimeUtc: string }>('/api/ping');
    return new PingResult(data);
  },
};
