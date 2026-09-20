namespace Reforge.Api.Common.Models;

/// <summary>GET /api/features' response shape — whether Features:Subscriptions is currently
/// turned on. Always available regardless of that toggle's value.</summary>
public record FeaturesResponse(bool Subscriptions);
