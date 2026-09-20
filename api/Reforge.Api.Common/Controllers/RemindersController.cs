using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Reforge.Core.Reminders;

namespace Reforge.Api.Common.Controllers;

/// <summary>
/// Slice 6 (docs/plan/02-vertical-slices.md): a user's reminder preferences — a single 1:1
/// ReminderSettings routed as GET/PUT /api/reminder-settings (PUT, not POST, since — unlike
/// Profile's POST-always-replaces convention — this is the first feature in this repo with an
/// explicit full-replace-by-id verb on custom-reminders below, so both settings and custom
/// reminders use the same PUT-replaces convention for consistency), plus many CustomReminders
/// with full CRUD routed as GET/POST /api/custom-reminders and PUT/DELETE
/// /api/custom-reminders/{id}. The caller's identity is never a controller parameter;
/// IRemindersUseCase resolves it itself via ICurrentUserProvider.
/// </summary>
[Authorize]
[ApiController]
[Route("api")]
public class RemindersController(IRemindersUseCase remindersUseCase) : ControllerBase
{
    [HttpGet("reminder-settings")]
    [ProducesResponseType(typeof(ReminderSettingsDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetReminderSettings()
    {
        var result = await remindersUseCase.GetReminderSettingsAsync();
        return result.ToActionResult();
    }

    [HttpPut("reminder-settings")]
    [ProducesResponseType(typeof(ReminderSettingsDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> PutReminderSettings([FromBody] UpdateReminderSettingsRequestDto request)
    {
        var result = await remindersUseCase.UpdateReminderSettingsAsync(request);
        return result.ToActionResult();
    }

    [HttpGet("custom-reminders")]
    [ProducesResponseType(typeof(List<CustomReminderDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCustomReminders()
    {
        var result = await remindersUseCase.GetCustomRemindersAsync();
        return result.ToActionResult();
    }

    [HttpPost("custom-reminders")]
    [ProducesResponseType(typeof(CustomReminderDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> PostCustomReminder([FromBody] SaveCustomReminderRequestDto request)
    {
        var result = await remindersUseCase.CreateCustomReminderAsync(request);
        return result.ToActionResult();
    }

    [HttpPut("custom-reminders/{id:guid}")]
    [ProducesResponseType(typeof(CustomReminderDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> PutCustomReminder([FromRoute] Guid id, [FromBody] SaveCustomReminderRequestDto request)
    {
        var result = await remindersUseCase.UpdateCustomReminderAsync(id, request);
        return result.ToActionResult();
    }

    [HttpDelete("custom-reminders/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteCustomReminder([FromRoute] Guid id)
    {
        var result = await remindersUseCase.DeleteCustomReminderAsync(id);
        return result.ToActionResult(Ok());
    }
}
