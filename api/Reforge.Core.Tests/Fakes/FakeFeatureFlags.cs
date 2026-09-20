using Reforge.Core.Shared.OutputPorts;

namespace Reforge.Core.Tests.Fakes;

public class FakeFeatureFlags(bool subscriptionsEnabled = false) : IFeatureFlags
{
    public bool SubscriptionsEnabledValue { get; set; } = subscriptionsEnabled;

    public bool SubscriptionsEnabled() => SubscriptionsEnabledValue;
}
