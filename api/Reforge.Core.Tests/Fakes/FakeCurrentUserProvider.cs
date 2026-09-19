using Reforge.Domain;
using Reforge.Core.Shared.OutputPorts;

namespace Reforge.Core.Tests.Fakes;

public class FakeCurrentUserProvider(UserId userId) : ICurrentUserProvider
{
    public UserId GetUserId() => userId;
}
