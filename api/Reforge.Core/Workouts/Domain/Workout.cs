using Reforge.Domain;

namespace Reforge.Core.Workouts.Domain;

// Slice 4 (docs/plan/02-vertical-slices.md): a user's logged workouts (strength/cardio). Fully
// closed shape — no ExtraData JSON escape hatch — same rationale as MealLibraryItem/Activity,
// narrower than the source recomp-coach-backend's extra_data-open workouts table: only the fields
// the reforge-frontend reference's Workout type actually uses. Id is a server-generated surrogate
// key; UserId is a plain foreign-key-shaped field, a user has many workouts. Timestamp is
// server-set at save time (IClock.UtcNow()), mirroring Meal's Timestamp/CreatedAt.
public sealed class Workout
{
    public Guid Id { get; }
    public UserId UserId { get; }
    public string Type { get; }
    public double? Volume { get; }
    public int? Duration { get; }
    public DateTime Timestamp { get; }

    public Workout(
        Guid id,
        UserId userId,
        string type,
        DateTime timestamp,
        double? volume = null,
        int? duration = null)
    {
        Id = id;
        UserId = userId;
        Type = type;
        Volume = volume;
        Duration = duration;
        Timestamp = timestamp;
    }
}
