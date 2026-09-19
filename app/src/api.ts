export { API_BASE, API_UNAUTHORIZED_EVENT, ApiError, isApiErrorWithStatus, isUnauthorizedError, setAccessToken } from './api/http';

import { pingApi } from './api/resources/ping';

// Single fetch client for the backend, namespaced per resource — see
// docs/architecture/frontend.md. Only `ping` exists so far (walking skeleton); later slices
// add `profile`, `meals`, `workouts`, etc. here.
export const api = {
  ping: pingApi,
};
