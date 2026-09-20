export { API_BASE, API_UNAUTHORIZED_EVENT, ApiError, isApiErrorWithStatus, isUnauthorizedError, setAccessToken } from './api/http';

import { pingApi } from './api/resources/ping';
import { profileApi } from './api/resources/profile';
import { mealsApi } from './api/resources/meals';
import { mealLibraryApi } from './api/resources/mealLibrary';
import { activitiesApi } from './api/resources/activities';
import { workoutsApi } from './api/resources/workouts';
import { measurementsApi } from './api/resources/measurements';
import { remindersApi } from './api/resources/reminders';
import { weeklyProgressApi } from './api/resources/weeklyProgress';
import { coachApi } from './api/resources/coach';
import { featuresApi } from './api/resources/features';
import { subscriptionApi } from './api/resources/subscription';

// Single fetch client for the backend, namespaced per resource — see
// docs/architecture/frontend.md.
export const api = {
  ping: pingApi,
  profile: profileApi,
  meals: mealsApi,
  mealLibrary: mealLibraryApi,
  activities: activitiesApi,
  workouts: workoutsApi,
  measurements: measurementsApi,
  reminders: remindersApi,
  weeklyProgress: weeklyProgressApi,
  coach: coachApi,
  features: featuresApi,
  subscription: subscriptionApi,
};
