import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfileStore } from '@/store/profileStore';
import { useMealsStore } from '@/store/mealsStore';
import { useActivityStore } from '@/store/activityStore';
import { useClosedDaysStore } from '@/store/closedDaysStore';
import { loadProfile } from '@/features/profile/useCases';
import { loadMeals, todayDateString } from '@/features/meals/useCases';
import { loadActivities } from '@/features/activities/useCases';
import { loadWeeklyProgress } from '@/features/dayClose/useCases';
import { HomeScreen } from '../components/HomeScreen';

// Container for /home. Loads (read-only) the profile, meals, activities and weekly-progress
// stores on mount to feed the dashboard's goal/meals/activity/streak modules — see
// docs/architecture/frontend.md's `routes/` layer. Every store here is already shared with
// another route (profile, meals, activities, dayClose), so loading them again here is safe:
// each is idempotent and its own store is the single source of truth.
export function HomeRoute() {
  const navigate = useNavigate();
  const { profile } = useProfileStore();
  const { meals, isLoading: isLoadingMeals } = useMealsStore();
  const { activities, isLoading: isLoadingActivities } = useActivityStore();
  const { weeklyProgress, isLoading: isLoadingWeeklyProgress } = useClosedDaysStore();

  useEffect(() => {
    void loadProfile();
    void loadMeals();
    void loadActivities();
    void loadWeeklyProgress();
  }, []);

  const today = todayDateString();
  const todaysMeals = meals.filter((meal) => meal.date === today);

  return (
    <HomeScreen
      profile={profile}
      todaysMeals={todaysMeals}
      isLoadingMeals={isLoadingMeals}
      activities={activities}
      isLoadingActivities={isLoadingActivities}
      streak={weeklyProgress?.adherenceStreak ?? null}
      isLoadingStreak={isLoadingWeeklyProgress}
      onNavigateToMeals={() => navigate('/comidas')}
      onNavigateToActivity={() => navigate('/actividad')}
    />
  );
}
