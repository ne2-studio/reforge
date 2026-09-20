using Reforge.Core.Workouts.Domain;

namespace Reforge.Core.Profiles.Domain;

// Mifflin-St Jeor BMR × activity multiplier ± goal adjustment ± today's training bonus. Used
// wherever a profile's CalorieTarget is unset — falls back to a flat default only when there
// isn't enough profile data (age/gender/height/weight) to compute a real estimate. A profile
// with an explicit CalorieTarget always wins as-is, todaysWorkouts included — a value the user
// typed in isn't ours to adjust.
public static class CalorieTargetCalculator
{
    private const int DefaultCalorieTarget = 2000;
    private const int MinimumCalorieTarget = 1200;
    private const double LoseFatDeficitShare = 0.15;

    // Same per-minute cardio rate as the frontend's activities/calorieEstimate.ts. Strength
    // workouts don't carry a duration (only total volume, see Workout.cs), so they get a flat
    // per-session estimate instead of a rate.
    private const double CardioCaloriesPerMinute = 8;
    private const int StrengthWorkoutCalorieBonus = 200;

    public static int Calculate(UserProfile profile, IReadOnlyCollection<Workout> todaysWorkouts)
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

        var trainingBonus = todaysWorkouts.Sum(workout => workout.Type switch
        {
            "cardio" => (int)Math.Round((workout.Duration ?? 0) * CardioCaloriesPerMinute),
            "strength" => StrengthWorkoutCalorieBonus,
            _ => 0,
        });

        var calorieTarget = (int)Math.Round(tdee) + goalAdjustment + trainingBonus;

        return Math.Max(calorieTarget, MinimumCalorieTarget);
    }
}
