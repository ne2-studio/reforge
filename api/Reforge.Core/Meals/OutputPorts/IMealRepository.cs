using Reforge.Domain;
using Reforge.Core.Meals.Domain;

namespace Reforge.Core.Meals.OutputPorts;

public interface IMealRepository
{
    /// <summary>The caller's own meals, most recent first (by Timestamp descending).</summary>
    Task<List<Meal>> GetByUserIdAsync(UserId userId);

    /// <summary>The caller's own meals for a single calendar date — backs GET
    /// /daily-stats/:date.</summary>
    Task<List<Meal>> GetByUserIdAndDateAsync(UserId userId, DateOnly date);

    Task AddAsync(Meal meal);
}
