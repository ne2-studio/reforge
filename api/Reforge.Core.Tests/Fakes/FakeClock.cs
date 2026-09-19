using Reforge.Core.Shared.OutputPorts;

namespace Reforge.Core.Tests.Fakes;

public class FakeClock(DateTime now) : IClock
{
    public DateTime UtcNow() => now;
}
