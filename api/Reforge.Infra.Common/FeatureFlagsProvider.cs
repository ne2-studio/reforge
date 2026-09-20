using Microsoft.Extensions.Options;
using Reforge.Core.Shared.OutputPorts;

namespace Reforge.Infra;

/// <summary>
/// Crosses the Reforge.Infra -> Reforge.Core boundary the same way OpenAiOptions/IAiChatBackend
/// does: FeaturesOptions (the config-shaped type) never leaks into Reforge.Core, only this small
/// behavioral port. Shared between reforge-api and reforge-api-lite (see ServiceRegistration in
/// both Reforge.Infra and Reforge.Infra.Lite) — pure config reading, no Postgres dependency, same
/// reasoning as SystemClock/HttpContextCurrentUserProvider living here.
/// </summary>
public class FeatureFlagsProvider(IOptions<FeaturesOptions> options) : IFeatureFlags
{
    public bool SubscriptionsEnabled() => options.Value.Subscriptions;
}
