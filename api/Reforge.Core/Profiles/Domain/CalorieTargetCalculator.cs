namespace Reforge.Core.Profiles.Domain;

// Mifflin-St Jeor BMR × activity multiplier ± goal adjustment. Used wherever a profile's
// CalorieTarget is unset — falls back to a flat default only when there isn't enough profile
// data (age/gender/height/weight) to compute a real estimate.
public static class CalorieTargetCalculator
{
    private const int DefaultCalorieTarget = 2000;
    private const int MinimumCalorieTarget = 1200;

    public static int Calculate(UserProfile profile)
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
            "lose-fat" => -500,
            "gain-muscle" => 300,
            "recomp" => -200,
            _ => 0, // maintain or unset
        };

        var calorieTarget = (int)Math.Round(tdee) + goalAdjustment;

        return Math.Max(calorieTarget, MinimumCalorieTarget);
    }
}
