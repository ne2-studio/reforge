using Reforge.Domain;

namespace Reforge.Core.Measurements.Domain;

// Slice 5 (docs/plan/02-vertical-slices.md): a user's logged body measurements. Despite the
// source recomp-coach-backend's Postgres schema having weight, fat_percentage, waist, chest,
// arms, legs and an extra_data jsonb escape hatch, the reference frontend's ProgressTracker.tsx —
// the only consumer — reads/writes exactly Weight, Waist and Neck (used with the user's profile
// height/gender to compute body-fat % and lean mass entirely client-side, never persisted). So
// this is a fully closed shape — no ExtraData, no FatPercentage/Chest/Arms/Legs — same rationale
// as MealLibraryItem/Activity/Workout. Id is a server-generated surrogate key; UserId is a plain
// foreign-key-shaped field, a user has many measurements. Timestamp is server-set at save time
// (IClock.UtcNow()), mirroring Activity's Timestamp.
public sealed class Measurement
{
    public Guid Id { get; }
    public UserId UserId { get; }
    public double? Weight { get; }
    public double? Waist { get; }
    public double? Neck { get; }
    public DateTime Timestamp { get; }

    public Measurement(
        Guid id,
        UserId userId,
        DateTime timestamp,
        double? weight = null,
        double? waist = null,
        double? neck = null)
    {
        Id = id;
        UserId = userId;
        Weight = weight;
        Waist = waist;
        Neck = neck;
        Timestamp = timestamp;
    }
}
