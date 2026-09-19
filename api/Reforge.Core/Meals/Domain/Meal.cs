using Reforge.Domain;

namespace Reforge.Core.Meals.Domain;

// Ports the source recomp-coach-backend's meals table (see
// recomp-coach-backend/supabase/migrations/20260131182500_create_meals_related_tables.sql) field
// for field, minus closed_days/meal_library concerns which are later slices. Unlike UserProfile
// (1:1 with a User, keyed by UserId), a user has many meals — Id is a server-generated surrogate
// key, UserId is a plain foreign-key-shaped field. Time is a free-form display string (e.g.
// "14:30"), deliberately distinct from Timestamp (a real instant) and Date (the calendar day it
// belongs to, used for the daily-stats/day queries).
public sealed class Meal
{
    public Guid Id { get; }
    public UserId UserId { get; }
    public string MealText { get; }
    public string Category { get; }
    public string Time { get; }
    public int Calories { get; }
    public int Protein { get; }
    public int Carbs { get; }
    public int Fats { get; }
    public string? Feedback { get; }

    /// <summary>Free-form JSON escape hatch, same technique/rationale as
    /// UserProfile.ExtraData.</summary>
    public Dictionary<string, object?> ExtraData { get; }

    public DateTime Timestamp { get; }
    public DateOnly Date { get; }
    public DateTime CreatedAt { get; }

    public Meal(
        Guid id,
        UserId userId,
        string mealText,
        string category,
        string time,
        int calories,
        int protein,
        int carbs,
        int fats,
        DateTime timestamp,
        DateOnly date,
        DateTime createdAt,
        string? feedback = null,
        Dictionary<string, object?>? extraData = null)
    {
        Id = id;
        UserId = userId;
        MealText = mealText;
        Category = category;
        Time = time;
        Calories = calories;
        Protein = protein;
        Carbs = carbs;
        Fats = fats;
        Feedback = feedback;
        Timestamp = timestamp;
        Date = date;
        CreatedAt = createdAt;
        ExtraData = extraData ?? [];
    }
}
