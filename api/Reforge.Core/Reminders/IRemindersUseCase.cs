using Reforge.Core.Shared;

namespace Reforge.Core.Reminders;

/// <summary>
/// Slice 6 (docs/plan/02-vertical-slices.md): a user's reminder preferences — a single 1:1
/// ReminderSettings plus many CustomReminders. All verbs resolve the caller's identity themselves
/// via ICurrentUserProvider; it is never a parameter here.
/// </summary>
public interface IRemindersUseCase
{
    /// <summary>Fails with NotFound if the caller has never saved reminder settings yet — mirrors
    /// IProfileUseCase.GetProfileAsync (a normal state before the user has visited the reminders
    /// section, not a server error).</summary>
    Task<Result<ReminderSettingsDto>> GetReminderSettingsAsync();

    /// <summary>Inserts or fully replaces the caller's reminder settings and returns the saved
    /// result.</summary>
    Task<Result<ReminderSettingsDto>> UpdateReminderSettingsAsync(UpdateReminderSettingsRequestDto request);

    /// <summary>The caller's own custom reminders.</summary>
    Task<Result<List<CustomReminderDto>>> GetCustomRemindersAsync();

    /// <summary>Creates a new custom reminder for the caller and returns it.</summary>
    Task<Result<CustomReminderDto>> CreateCustomReminderAsync(SaveCustomReminderRequestDto request);

    /// <summary>Fully replaces one of the caller's own custom reminders. Fails with NotFound if
    /// it doesn't exist for the caller — including when it belongs to a different user, so its
    /// existence isn't disclosed (see docs/API-CONVENTIONS.md).</summary>
    Task<Result<CustomReminderDto>> UpdateCustomReminderAsync(Guid id, SaveCustomReminderRequestDto request);

    /// <summary>Deletes one of the caller's own custom reminders. Same NotFound semantics as
    /// UpdateCustomReminderAsync.</summary>
    Task<Result> DeleteCustomReminderAsync(Guid id);
}

public record ReminderSettingsDto(
    bool Enabled,
    string Channel,
    string DefaultTime,
    DateTime UpdatedAt);

public record UpdateReminderSettingsRequestDto(
    bool Enabled,
    string Channel,
    string DefaultTime);

public record CustomReminderDto(
    Guid Id,
    string Label,
    string Time,
    List<string> DaysOfWeek,
    bool Enabled,
    DateTime UpdatedAt);

public record SaveCustomReminderRequestDto(
    string Label,
    string Time,
    List<string> DaysOfWeek,
    bool Enabled);
