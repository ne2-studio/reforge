using Reforge.Core.Shared.OutputPorts;

namespace Reforge.Infra;

public class SystemClock : IClock
{
    public DateTime UtcNow() => DateTime.UtcNow;
}
