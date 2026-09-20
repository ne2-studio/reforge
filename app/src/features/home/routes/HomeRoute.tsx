import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfileStore } from '@/store/profileStore';
import { useMealsStore } from '@/store/mealsStore';
import { useActivityStore } from '@/store/activityStore';
import { useWeeklyProgressStore } from '@/store/weeklyProgressStore';
import { loadProfile } from '@/features/profile/useCases';
import { loadMeals, loadDailyStats, todayDateString } from '@/features/meals/useCases';
import { loadActivities } from '@/features/activities/useCases';
import { loadWeeklyProgress } from '@/features/measurements/useCases';
import { HomeScreen } from '../components/HomeScreen';

// Container for /home. Loads (read-only) the profile, meals, daily-stats, activities and
// weekly-progress stores on mount to feed the dashboard's goal/resumen/meals/activity/streak
// modules — see docs/architecture/frontend.md's `routes/` layer. Every store here is already
// shared with another route (profile, meals, activities, history), so loading them again here
// is safe: each is idempotent and its own store is the single source of truth. dailyStats used
// to be loaded and rendered by MealsRoute (/comidas) — the "Resumen de hoy" card moved here.
export function HomeRoute() {
  const navigate = useNavigate();
  const { profile } = useProfileStore();
  const { meals, dailyStats, isLoading: isLoadingMeals } = useMealsStore();
  const { activities, isLoading: isLoadingActivities } = useActivityStore();
  const { weeklyProgress, isLoading: isLoadingWeeklyProgress } = useWeeklyProgressStore();

  useEffect(() => {
    void loadProfile();
    void loadMeals();
    void loadDailyStats(todayDateString());
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
      dailyStats={dailyStats}
      isLoadingDailyStats={isLoadingMeals}
      onNavigateToMeals={() => navigate('/comidas')}
      onNavigateToActivity={() => navigate('/actividad')}
    />
  );
}
