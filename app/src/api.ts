export { API_BASE, API_UNAUTHORIZED_EVENT, ApiError, isApiErrorWithStatus, isUnauthorizedError, setAccessToken } from './api/http';

import { pingApi } from './api/resources/ping';
import { profileApi } from './api/resources/profile';
import { mealsApi } from './api/resources/meals';

// Single fetch client for the backend, namespaced per resource — see
// docs/architecture/frontend.md. Later slices add `workouts`, etc. here.
export const api = {
  ping: pingApi,
  profile: profileApi,
  meals: mealsApi,
};
