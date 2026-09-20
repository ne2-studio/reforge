using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Reforge.Core.Subscriptions;

namespace Reforge.Api.Common.Controllers;

/// <summary>
/// Slice 9 (docs/plan/02-vertical-slices.md): subscriptions and billing — a fully faked Stripe
/// flow, no Stripe SDK, no network calls. Only registered at all when Features:Subscriptions is
/// true (see ReforgeApiHost's ConfigureApplicationPartManager call) — every route here 404s while
/// the flag is off. The caller's identity is never a controller parameter; ISubscriptionsUseCase
/// resolves it itself via ICurrentUserProvider.
/// </summary>
[Authorize]
[ApiController]
[Route("api")]
public class SubscriptionsController(ISubscriptionsUseCase subscriptionsUseCase) : ControllerBase
{
    [HttpGet("subscription")]
    [ProducesResponseType(typeof(SubscriptionSummaryDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSubscription()
    {
        var result = await subscriptionsUseCase.GetSubscriptionAsync();
        return result.ToActionResult();
    }

    [HttpPost("subscription/checkout")]
    [ProducesResponseType(typeof(CheckoutSessionResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> PostCheckout()
    {
        var result = await subscriptionsUseCase.StartCheckoutAsync();
        return result.ToActionResult();
    }

    [HttpPost("subscription/checkout/{sessionId:guid}/confirm")]
    [ProducesResponseType(typeof(SubscriptionSummaryDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> PostConfirmCheckout([FromRoute] Guid sessionId)
    {
        var result = await subscriptionsUseCase.ConfirmCheckoutAsync(sessionId);
        return result.ToActionResult();
    }

    [HttpPost("subscription/portal")]
    [ProducesResponseType(typeof(BillingPortalResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> PostPortal()
    {
        var result = await subscriptionsUseCase.GetBillingPortalAsync();
        return result.ToActionResult();
    }

    [HttpPost("subscription/cancel")]
    [ProducesResponseType(typeof(SubscriptionSummaryDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> PostCancel()
    {
        var result = await subscriptionsUseCase.CancelAsync();
        return result.ToActionResult();
    }
}
