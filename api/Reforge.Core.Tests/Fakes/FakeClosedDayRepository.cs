using Reforge.Domain;
using Reforge.Core.ClosedDays.Domain;
using Reforge.Core.ClosedDays.OutputPorts;

namespace Reforge.Core.Tests.Fakes;

public class FakeClosedDayRepository : IClosedDayRepository
{
    private readonly List<ClosedDay> _closedDays = [];

    public Task<List<ClosedDay>> GetByUserIdAsync(UserId userId) =>
        Task.FromResult(_closedDays
            .Where(d => d.UserId == userId)
            .OrderByDescending(d => d.Date)
            .ToList());

    public Task<ClosedDay?> GetByUserIdAndDateAsync(UserId userId, DateOnly date) =>
        Task.FromResult(_closedDays.FirstOrDefault(d => d.UserId == userId && d.Date == date));

    public Task AddAsync(ClosedDay closedDay)
    {
        _closedDays.Add(closedDay);
        return Task.CompletedTask;
    }

    public void Seed(ClosedDay closedDay) => _closedDays.Add(closedDay);
}
