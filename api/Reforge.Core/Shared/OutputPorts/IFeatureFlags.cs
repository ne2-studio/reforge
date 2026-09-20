namespace Reforge.Core.Shared.OutputPorts;

/// <summary>
/// Slice 9 (docs/plan/02-vertical-slices.md): the global Features:Subscriptions config toggle,
/// crossing the Reforge.Infra -> Reforge.Core boundary the same way OpenAiOptions/IAiChatBackend
/// does — Reforge.Core never sees the config type (Reforge.Infra.Common.FeaturesOptions) directly,
/// only this small behavioral port. Implemented in Reforge.Infra.Common (shared by both images,
/// same as SystemClock/HttpContextCurrentUserProvider — it's pure config reading, no Postgres
/// dependency).
/// </summary>
public interface IFeatureFlags
{
    /// <summary>Whether the subscriptions/usage-limits feature is turned on. When false,
    /// MealsManager/ChatManager must skip calling ISubscriptionsUseCase's usage-limit methods
    /// entirely (not call them and always get success) and SubscriptionsController must not even
    /// be registered (see Reforge.Api.Common.ReforgeApiHost) — today's unlimited behavior stays
    /// unchanged verbatim while this is false.</summary>
    bool SubscriptionsEnabled();
}
