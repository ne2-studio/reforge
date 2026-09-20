using Reforge.Domain;
using Reforge.Core.Reminders;
using Reforge.Core.Reminders.Application;
using Reforge.Core.Reminders.Domain;
using Reforge.Core.Shared;
using Reforge.Core.Tests.Fakes;

namespace Reforge.Core.Tests.Reminders;

public class RemindersManagerTests
{
    private static readonly UserId UserId = new("auth0|reminders-user");
    private static readonly UserId OtherUserId = new("auth0|someone-else");

    private static RemindersManager NewManager(
        FakeReminderSettingsRepository? settingsRepository = null,
        FakeCustomReminderRepository? customReminderRepository = null,
        DateTime? now = null,
        Guid? id = null,
        UserId? userId = null) => new(
            new FakeCurrentUserProvider(userId ?? UserId),
            settingsRepository ?? new FakeReminderSettingsRepository(),
            customReminderRepository ?? new FakeCustomReminderRepository(),
            new FakeClock(now ?? DateTime.UtcNow),
            new FakeIdGenerator(id ?? Guid.NewGuid()));

    [Fact]
    public async Task GetReminderSettingsAsync_FailsWithNotFound_WhenTheCallerHasNeverSavedSettings()
    {
        var manager = NewManager();

        var result = await manager.GetReminderSettingsAsync();

        Assert.True(result.IsFailure);
        Assert.Equal(ApplicationErrorCode.NotFound, result.Error.Code);
    }

    [Fact]
    public async Task GetReminderSettingsAsync_ReturnsOnlyTheCallersOwnSettings()
    {
        var repository = new FakeReminderSettingsRepository();
        repository.Seed(new ReminderSettings(OtherUserId, true, "push", "08:00", DateTime.UtcNow));
        var mine = new ReminderSettings(UserId, true, "email", "07:30", new DateTime(2026, 3, 1, 0, 0, 0, DateTimeKind.Utc));
        repository.Seed(mine);

        var manager = NewManager(settingsRepository: repository);

        var result = await manager.GetReminderSettingsAsync();

        Assert.True(result.IsSuccess);
        Assert.True(result.Value.Enabled);
        Assert.Equal("email", result.Value.Channel);
        Assert.Equal("07:30", result.Value.DefaultTime);
    }

    [Fact]
    public async Task UpdateReminderSettingsAsync_SavesUnderTheCallersUserId_WithAServerSetUpdatedAt()
    {
        var repository = new FakeReminderSettingsRepository();
        var now = new DateTime(2026, 3, 4, 12, 30, 0, DateTimeKind.Utc);
        var manager = NewManager(settingsRepository: repository, now: now);

        var result = await manager.UpdateReminderSettingsAsync(
            new UpdateReminderSettingsRequestDto(Enabled: true, Channel: "push", DefaultTime: "08:00"));

        Assert.True(result.IsSuccess);
        Assert.True(result.Value.Enabled);
        Assert.Equal("push", result.Value.Channel);
        Assert.Equal("08:00", result.Value.DefaultTime);
        Assert.Equal(now, result.Value.UpdatedAt);

        var stored = await repository.GetByUserIdAsync(UserId);
        Assert.NotNull(stored);
        Assert.Equal(UserId, stored!.UserId);
    }

    [Fact]
    public async Task UpdateReminderSettingsAsync_RejectsAnEmptyChannel()
    {
        var manager = NewManager();

        var result = await manager.UpdateReminderSettingsAsync(
            new UpdateReminderSettingsRequestDto(Enabled: true, Channel: "  ", DefaultTime: "08:00"));

        Assert.True(result.IsFailure);
        Assert.Equal(ApplicationErrorCode.Validation, result.Error.Code);
    }

    [Fact]
    public async Task UpdateReminderSettingsAsync_RejectsAnEmptyDefaultTime()
    {
        var manager = NewManager();

        var result = await manager.UpdateReminderSettingsAsync(
            new UpdateReminderSettingsRequestDto(Enabled: true, Channel: "push", DefaultTime: ""));

        Assert.True(result.IsFailure);
        Assert.Equal(ApplicationErrorCode.Validation, result.Error.Code);
    }

    [Fact]
    public async Task GetCustomRemindersAsync_ReturnsOnlyTheCallersOwnReminders()
    {
        var repository = new FakeCustomReminderRepository();
        repository.Seed(NewCustomReminder(userId: OtherUserId));
        var mine = NewCustomReminder();
        repository.Seed(mine);

        var manager = NewManager(customReminderRepository: repository);

        var result = await manager.GetCustomRemindersAsync();

        Assert.True(result.IsSuccess);
        Assert.Single(result.Value);
        Assert.Equal(mine.Id, result.Value[0].Id);
    }

    [Fact]
    public async Task CreateCustomReminderAsync_SavesUnderTheCallersUserId_AndReturnsTheSavedReminder()
    {
        var repository = new FakeCustomReminderRepository();
        var now = new DateTime(2026, 3, 4, 12, 30, 0, DateTimeKind.Utc);
        var id = Guid.NewGuid();
        var manager = NewManager(customReminderRepository: repository, now: now, id: id);

        var request = new SaveCustomReminderRequestDto(
            Label: "Registra tu cena",
            Time: "20:00",
            DaysOfWeek: ["Mon", "Wed", "Fri"],
            Enabled: true);

        var result = await manager.CreateCustomReminderAsync(request);

        Assert.True(result.IsSuccess);
        Assert.Equal(id, result.Value.Id);
        Assert.Equal("Registra tu cena", result.Value.Label);
        Assert.Equal("20:00", result.Value.Time);
        Assert.Equal(["Mon", "Wed", "Fri"], result.Value.DaysOfWeek);
        Assert.True(result.Value.Enabled);
        Assert.Equal(now, result.Value.UpdatedAt);

        var stored = await repository.GetByUserIdAsync(UserId);
        Assert.Single(stored);
        Assert.Equal(UserId, stored[0].UserId);
    }

    [Theory]
    [InlineData("", "20:00")]
    [InlineData("Registra tu cena", "")]
    public async Task CreateCustomReminderAsync_RejectsAMissingLabelOrTime(string label, string time)
    {
        var manager = NewManager();

        var result = await manager.CreateCustomReminderAsync(
            new SaveCustomReminderRequestDto(label, time, ["Mon"], true));

        Assert.True(result.IsFailure);
        Assert.Equal(ApplicationErrorCode.Validation, result.Error.Code);
    }

    [Fact]
    public async Task CreateCustomReminderAsync_RejectsNoDaysOfWeekSelected()
    {
        var manager = NewManager();

        var result = await manager.CreateCustomReminderAsync(
            new SaveCustomReminderRequestDto("Registra tu cena", "20:00", [], true));

        Assert.True(result.IsFailure);
        Assert.Equal(ApplicationErrorCode.Validation, result.Error.Code);
    }

    [Fact]
    public async Task UpdateCustomReminderAsync_ReplacesOneOfTheCallersOwnReminders()
    {
        var repository = new FakeCustomReminderRepository();
        var existing = NewCustomReminder();
        repository.Seed(existing);
        var now = new DateTime(2026, 3, 5, 9, 0, 0, DateTimeKind.Utc);
        var manager = NewManager(customReminderRepository: repository, now: now);

        var request = new SaveCustomReminderRequestDto("Registra tu almuerzo", "13:00", ["Tue"], false);
        var result = await manager.UpdateCustomReminderAsync(existing.Id, request);

        Assert.True(result.IsSuccess);
        Assert.Equal("Registra tu almuerzo", result.Value.Label);
        Assert.Equal("13:00", result.Value.Time);
        Assert.Equal(["Tue"], result.Value.DaysOfWeek);
        Assert.False(result.Value.Enabled);
        Assert.Equal(now, result.Value.UpdatedAt);
    }

    [Fact]
    public async Task UpdateCustomReminderAsync_FailsWithNotFound_WhenTheReminderBelongsToAnotherUser()
    {
        var repository = new FakeCustomReminderRepository();
        var theirs = NewCustomReminder(userId: OtherUserId);
        repository.Seed(theirs);
        var manager = NewManager(customReminderRepository: repository);

        var request = new SaveCustomReminderRequestDto("Registra tu almuerzo", "13:00", ["Tue"], false);
        var result = await manager.UpdateCustomReminderAsync(theirs.Id, request);

        Assert.True(result.IsFailure);
        Assert.Equal(ApplicationErrorCode.NotFound, result.Error.Code);
    }

    [Fact]
    public async Task DeleteCustomReminderAsync_DeletesOneOfTheCallersOwnReminders()
    {
        var repository = new FakeCustomReminderRepository();
        var existing = NewCustomReminder();
        repository.Seed(existing);
        var manager = NewManager(customReminderRepository: repository);

        var result = await manager.DeleteCustomReminderAsync(existing.Id);

        Assert.True(result.IsSuccess);
        Assert.Empty(await repository.GetByUserIdAsync(UserId));
    }

    [Fact]
    public async Task DeleteCustomReminderAsync_FailsWithNotFound_WhenTheReminderBelongsToAnotherUser()
    {
        var repository = new FakeCustomReminderRepository();
        var theirs = NewCustomReminder(userId: OtherUserId);
        repository.Seed(theirs);
        var manager = NewManager(customReminderRepository: repository);

        var result = await manager.DeleteCustomReminderAsync(theirs.Id);

        Assert.True(result.IsFailure);
        Assert.Equal(ApplicationErrorCode.NotFound, result.Error.Code);
        Assert.Single(await repository.GetByUserIdAsync(OtherUserId));
    }

    private static CustomReminder NewCustomReminder(
        UserId? userId = null,
        string label = "Registra tu cena",
        string time = "20:00",
        bool enabled = true) => new(
            Guid.NewGuid(),
            userId ?? UserId,
            label,
            time,
            ["Mon", "Wed", "Fri"],
            enabled,
            DateTime.UtcNow);
}
