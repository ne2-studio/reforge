using Reforge.Core.Shared.OutputPorts;

namespace Reforge.Core.Tests.Fakes;

public class FakeIdGenerator(Guid id) : IIdGenerator
{
    public Guid NewId() => id;
}
