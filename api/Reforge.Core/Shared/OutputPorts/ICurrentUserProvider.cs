using Reforge.Domain;

namespace Reforge.Core.Shared.OutputPorts;

public interface ICurrentUserProvider
{
    UserId GetUserId();
}
