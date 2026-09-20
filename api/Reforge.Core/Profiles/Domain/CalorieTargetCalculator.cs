using Reforge.Core.Activities.Domain;
using Reforge.Core.Workouts.Domain;

namespace Reforge.Core.Profiles.Domain;

// Mifflin-St Jeor BMR × activity multiplier ± goal adjustment ± today's training bonus. Used
// wherever a profile's CalorieTarget is unset — falls back to a flat default only when there
// isn't enough profile data (age/gender/height/weight) to compute a real estimate. A profile
// with an explicit CalorieTarget always wins as-is, today's workouts/activities included — a
// value the user typed in isn't ours to adjust.
public static class CalorieTargetCalculator
{
    private const int DefaultCalorieTarget = 2000;
    private const int MinimumCalorieTarget = 1200;
    private const double LoseFatDeficitShare = 0.15;

    // Same per-minute/per-step rates as the frontend's activities/calorieEstimate.ts (which
    // covers Activity's strength/cardio/neat, all duration- or steps-based). Workout's strength
    // type is the odd one out — it doesn't carry a duration (only total volume, see
    // Workout.cs) — so it gets a flat per-session estimate instead of a rate.
    private const double CardioCaloriesPerMinute = 8;
    private const double StrengthActivityCaloriesPerMinute = 6;
    private const double NeatCaloriesPerStep = 0.04;
    private const int StrengthWorkoutCalorieBonus = 200;

    public static int Calculate(
        UserProfile profile,
        IReadOnlyCollection<Workout> todaysWorkouts,
        IReadOnlyCollection<Activity> todaysActivities)
    {
        if (profile.CalorieTarget is int ct and not 0)
            return ct;

        if (profile.Age is not int age
            || profile.Gender is not string gender
            || profile.Height is not double height
            || profile.Weight is not double weight)
            return DefaultCalorieTarget;

        var genderConstant = gender switch
        {
            "male" => 5,
            "female" => -161,
            _ => -78, // midpoint, used when gender is unset or not male/female
        };

        var bmr = (10 * weight) + (6.25 * height) - (5 * age) + genderConstant;

        var activityMultiplier = profile.ActivityLevel switch
        {
            "sedentary" => 1.2,
            "light" => 1.375,
            "moderate" => 1.55,
            "active" => 1.725,
            "very_active" => 1.9,
            _ => 1.2, // assume sedentary when unset
        };

        var tdee = bmr * activityMultiplier;

        var goalAdjustment = profile.Goal switch
        {
            "lose-fat" => -(int)Math.Round(tdee * LoseFatDeficitShare),
            "gain-muscle" => 300,
            "recomp" => -200,
            _ => 0, // maintain or unset
        };

        var workoutBonus = todaysWorkouts.Sum(workout => workout.Type switch
        {
            "cardio" => (int)Math.Round((workout.Duration ?? 0) * CardioCaloriesPerMinute),
            "strength" => StrengthWorkoutCalorieBonus,
            _ => 0,
        });

        var activityBonus = todaysActivities.Sum(activity => activity.Type switch
        {
            "cardio" => (int)Math.Round((activity.Duration ?? 0) * CardioCaloriesPerMinute),
            "strength" => (int)Math.Round((activity.Duration ?? 0) * StrengthActivityCaloriesPerMinute),
            "neat" => (int)Math.Round((activity.Steps ?? 0) * NeatCaloriesPerStep),
            _ => 0,
        });

        var calorieTarget = (int)Math.Round(tdee) + goalAdjustment + workoutBonus + activityBonus;

        return Math.Max(calorieTarget, MinimumCalorieTarget);
    }
}
