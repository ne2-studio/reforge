using Reforge.Core.Shared.OutputPorts;

namespace Reforge.Infra;

public class SystemGuidIdGenerator : IIdGenerator
{
    public Guid NewId() => Guid.NewGuid();
}
