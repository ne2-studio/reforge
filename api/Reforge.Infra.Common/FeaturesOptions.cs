namespace Reforge.Infra;

// Bound from the "Features" configuration section (see appsettings.json in both Reforge.Api and
// Reforge.Api.Lite) — every global feature toggle lives here. Slice 9 adds the first one,
// Subscriptions, defaulting to false so the app's existing unlimited AI behavior stays unchanged
// until the toggle is explicitly turned on.
public class FeaturesOptions
{
    public bool Subscriptions { get; init; }
}
