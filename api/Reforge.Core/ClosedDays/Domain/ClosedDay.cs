using Reforge.Domain;

namespace Reforge.Core.ClosedDays.Domain;

// Slice 7 (docs/plan/02-vertical-slices.md): a record of a day the user has "closed" (manually,
// via POST /api/close-day here — the source recomp-coach-backend only ever closed a day as a side
// effect of an AI coach chat command, deferred to a later slice). Unlike the source's closed_days
// table, this has no meals_snapshot column: meals are already persisted immutably via the Meals
// feature and there's no edit/delete endpoint for them, so a day-detail view can just re-query
// GET /meals client-side and filter by date instead of this feature duplicating that data. Id is
// a server-generated surrogate key; UserId is a plain foreign-key-shaped field — a user has many
// closed days, one per date, with uniqueness enforced by the repository/DB (a unique (UserId,
// Date) index), not by using (UserId, Date) as the primary key — same technique as
// Meal/Workout's surrogate keys.
public sealed class ClosedDay
{
    public Guid Id { get; }
    public UserId UserId { get; }
    public DateOnly Date { get; }
    public DateTime ClosedAt { get; }
    public int TotalCalories { get; }
    public int MealsCount { get; }
    public bool IsTrainingDay { get; }
    public string Analysis { get; }

    public ClosedDay(
        Guid id,
        UserId userId,
        DateOnly date,
        DateTime closedAt,
        int totalCalories,
        int mealsCount,
        bool isTrainingDay,
        string analysis)
    {
        Id = id;
        UserId = userId;
        Date = date;
        ClosedAt = closedAt;
        TotalCalories = totalCalories;
        MealsCount = mealsCount;
        IsTrainingDay = isTrainingDay;
        Analysis = analysis;
    }
}
