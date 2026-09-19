interface StreakProps {
  meals: any[];
}

export function Streak({ meals }: StreakProps) {
  // Calculate streak based on consecutive days with meals
  const calculateStreak = (): number => {
    if (!meals || meals.length === 0) return 0;

    // Get unique dates from meals (only date part, not time)
    const uniqueDates = new Set<string>();
    meals.forEach((meal: any) => {
      const date = new Date(meal.timestamp).toISOString().split('T')[0];
      uniqueDates.add(date);
    });

    // Sort dates in descending order (most recent first)
    const sortedDates = Array.from(uniqueDates).sort((a, b) => b.localeCompare(a));
    
    if (sortedDates.length === 0) return 0;

    const today = new Date().toISOString().split('T')[0];
    const mostRecentDate = sortedDates[0];
    
    // Check if the most recent meal is from today or yesterday
    // If it's older than yesterday, streak is 0
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (mostRecentDate !== today && mostRecentDate !== yesterdayStr) {
      return 0; // Streak is broken if last meal was before yesterday
    }

    // Count consecutive days starting from the most recent date
    let streak = 0;
    let currentDate = new Date(mostRecentDate);

    for (const dateStr of sortedDates) {
      const expectedDate = currentDate.toISOString().split('T')[0];
      
      if (dateStr === expectedDate) {
        streak++;
        // Move to previous day
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        // Streak is broken
        break;
      }
    }

    return streak;
  };

  return (
    <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-2xl p-4 border-2 border-orange-500/40">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <div>
              <span className="text-lg">Racha actual</span>
              <p className="text-xs text-muted-foreground">Días consecutivos registrando</p>
            </div>
          </h3>
        </div>
        <div className="text-3xl text-orange-500">{calculateStreak()}</div>
      </div>
    </div>
  );
}
