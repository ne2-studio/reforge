using Reforge.Domain;

namespace Reforge.Core.Subscriptions.Domain;

// Slice 9 (docs/plan/02-vertical-slices.md): a fully faked Stripe Checkout Session — no Stripe
// SDK, no network call, no webhook signature verification. StartCheckoutAsync creates one as
// Pending; ConfirmCheckoutAsync (standing in for Stripe's checkout.session.completed webhook)
// marks it Completed and activates the caller's Subscription. Id is the session id handed back to
// the caller as the "session" query param on the fake checkout URL — a user can have many
// checkout sessions over time (one per checkout attempt), so this is Add-then-replace like
// CustomReminder, not upsert-by-user like Subscription/ReminderSettings.
public sealed class CheckoutSession
{
    public Guid Id { get; }
    public UserId UserId { get; }
    public string Status { get; }
    public DateTime CreatedAt { get; }

    public CheckoutSession(Guid id, UserId userId, string status, DateTime createdAt)
    {
        Id = id;
        UserId = userId;
        Status = status;
        CreatedAt = createdAt;
    }
}

public static class CheckoutSessionStatuses
{
    public const string Pending = "Pending";
    public const string Completed = "Completed";
}
