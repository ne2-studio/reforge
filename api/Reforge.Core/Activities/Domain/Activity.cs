using Reforge.Domain;

namespace Reforge.Core.Activities.Domain;

// Slice 4 (docs/plan/02-vertical-slices.md): a user's logged activities (strength/cardio/neat).
// Fully closed shape — no ExtraData JSON escape hatch — same rationale as MealLibraryItem,
// narrower than the source recomp-coach-backend's extra_data-open activities table: only the
// fields the reforge-frontend reference's Activity type actually uses. Id is a server-generated
// surrogate key; UserId is a plain foreign-key-shaped field, a user has many activities.
// Timestamp is server-set at save time (IClock.UtcNow()), mirroring Meal's Timestamp/CreatedAt.
public sealed class Activity
{
    public Guid Id { get; }
    public UserId UserId { get; }
    public string Type { get; }
    public int? Duration { get; }
    public int? Steps { get; }
    public DateTime Timestamp { get; }

    public Activity(
        Guid id,
        UserId userId,
        string type,
        DateTime timestamp,
        int? duration = null,
        int? steps = null)
    {
        Id = id;
        UserId = userId;
        Type = type;
        Duration = duration;
        Steps = steps;
        Timestamp = timestamp;
    }
}
