using Reforge.Domain;

namespace Reforge.Core.Profiles.Domain;

// Named UserProfile (not Profile) to avoid colliding with the wider ".NET Profile" concept — see
// docs/plan/02-vertical-slices.md, Slice 1. 1:1 with Reforge.Core.Users.Domain.User: keyed by the
// same UserId, no separate surrogate key. Every field but UserId/UpdatedAt is nullable — profile
// completion happens incrementally during onboarding, not all at once (see
// recomp-coach-backend's user_profiles schema, the source of truth for field parity). Unlike that
// source, this has no name/email — those live on the OIDC-synced User, not here.
public sealed class UserProfile
{
    public UserId UserId { get; }
    public int? Age { get; }
    public string? Gender { get; }
    public double? Height { get; }
    public double? Weight { get; }
    public string? ActivityLevel { get; }
    public string? Goal { get; }
    public List<string> TrainingDays { get; }
    public string? TrainingType { get; }
    public string? TrainingTime { get; }
    public string? Restrictions { get; }
    public int? CalorieTarget { get; }

    /// <summary>Free-form JSON escape hatch for fields not yet promoted to a first-class column —
    /// mirrors the source schema's extra_data jsonb column.</summary>
    public Dictionary<string, object?> ExtraData { get; }

    public DateTime UpdatedAt { get; }

    public UserProfile(
        UserId userId,
        DateTime updatedAt,
        int? age = null,
        string? gender = null,
        double? height = null,
        double? weight = null,
        string? activityLevel = null,
        string? goal = null,
        List<string>? trainingDays = null,
        string? trainingType = null,
        string? trainingTime = null,
        string? restrictions = null,
        int? calorieTarget = null,
        Dictionary<string, object?>? extraData = null)
    {
        UserId = userId;
        UpdatedAt = updatedAt;
        Age = age;
        Gender = gender;
        Height = height;
        Weight = weight;
        ActivityLevel = activityLevel;
        Goal = goal;
        TrainingDays = trainingDays ?? [];
        TrainingType = trainingType;
        TrainingTime = trainingTime;
        Restrictions = restrictions;
        CalorieTarget = calorieTarget;
        ExtraData = extraData ?? [];
    }
}
