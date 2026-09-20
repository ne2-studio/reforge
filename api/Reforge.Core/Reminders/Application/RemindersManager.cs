using Reforge.Core.Reminders.Domain;
using Reforge.Core.Reminders.OutputPorts;
using Reforge.Core.Shared;
using Reforge.Core.Shared.OutputPorts;

namespace Reforge.Core.Reminders.Application;

public class RemindersManager(
    ICurrentUserProvider currentUserProvider,
    IReminderSettingsRepository reminderSettingsRepository,
    ICustomReminderRepository customReminderRepository,
    IClock clock,
    IIdGenerator idGenerator) : IRemindersUseCase
{
    public async Task<Result<ReminderSettingsDto>> GetReminderSettingsAsync()
    {
        var userId = currentUserProvider.GetUserId();
        var settings = await reminderSettingsRepository.GetByUserIdAsync(userId);
        if (settings is null)
            return Result.Failure<ReminderSettingsDto>(ApplicationError.NotFound("Reminder settings not found"));

        return Result.Success(ToDto(settings));
    }

    public async Task<Result<ReminderSettingsDto>> UpdateReminderSettingsAsync(UpdateReminderSettingsRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Channel))
            return Result.Failure<ReminderSettingsDto>(ApplicationError.Validation("Channel is required"));

        if (string.IsNullOrWhiteSpace(request.DefaultTime))
            return Result.Failure<ReminderSettingsDto>(ApplicationError.Validation("Default time is required"));

        var userId = currentUserProvider.GetUserId();
        var settings = new ReminderSettings(
            userId,
            request.Enabled,
            request.Channel,
            request.DefaultTime,
            updatedAt: clock.UtcNow());

        await reminderSettingsRepository.UpsertAsync(settings);

        return Result.Success(ToDto(settings));
    }

    public async Task<Result<List<CustomReminderDto>>> GetCustomRemindersAsync()
    {
        var userId = currentUserProvider.GetUserId();
        var reminders = await customReminderRepository.GetByUserIdAsync(userId);
        return Result.Success(reminders.Select(ToDto).ToList());
    }

    public async Task<Result<CustomReminderDto>> CreateCustomReminderAsync(SaveCustomReminderRequestDto request)
    {
        var validationError = Validate(request);
        if (validationError is not null)
            return Result.Failure<CustomReminderDto>(validationError.Value);

        var userId = currentUserProvider.GetUserId();
        var reminder = new CustomReminder(
            idGenerator.NewId(),
            userId,
            request.Label,
            request.Time,
            request.DaysOfWeek,
            request.Enabled,
            updatedAt: clock.UtcNow());

        await customReminderRepository.AddAsync(reminder);

        return Result.Success(ToDto(reminder));
    }

    public async Task<Result<CustomReminderDto>> UpdateCustomReminderAsync(Guid id, SaveCustomReminderRequestDto request)
    {
        var validationError = Validate(request);
        if (validationError is not null)
            return Result.Failure<CustomReminderDto>(validationError.Value);

        var userId = currentUserProvider.GetUserId();
        var reminder = new CustomReminder(
            id,
            userId,
            request.Label,
            request.Time,
            request.DaysOfWeek,
            request.Enabled,
            updatedAt: clock.UtcNow());

        var updated = await customReminderRepository.UpdateAsync(reminder);
        return updated
            ? Result.Success(ToDto(reminder))
            : Result.Failure<CustomReminderDto>(ApplicationError.NotFound("Custom reminder not found"));
    }

    public async Task<Result> DeleteCustomReminderAsync(Guid id)
    {
        var userId = currentUserProvider.GetUserId();
        var deleted = await customReminderRepository.DeleteAsync(userId, id);
        return deleted
            ? Result.Success()
            : Result.Failure(ApplicationError.NotFound("Custom reminder not found"));
    }

    private static ApplicationError? Validate(SaveCustomReminderRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Label))
            return ApplicationError.Validation("Label is required");

        if (string.IsNullOrWhiteSpace(request.Time))
            return ApplicationError.Validation("Time is required");

        if (request.DaysOfWeek is null || request.DaysOfWeek.Count == 0)
            return ApplicationError.Validation("Select at least one day");

        return null;
    }

    private static ReminderSettingsDto ToDto(ReminderSettings settings) => new(
        settings.Enabled,
        settings.Channel,
        settings.DefaultTime,
        settings.UpdatedAt);

    private static CustomReminderDto ToDto(CustomReminder reminder) => new(
        reminder.Id,
        reminder.Label,
        reminder.Time,
        reminder.DaysOfWeek,
        reminder.Enabled,
        reminder.UpdatedAt);
}
