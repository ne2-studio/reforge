using FluentAssertions;
using Reforge.Core.Reminders.Domain;
using Reforge.Domain;
using Reforge.Infra.Persistence;

namespace Reforge.Infra.PersistenceTests;

/// <summary>
/// The riskiest part of this repository is the DaysOfWeek jsonb column
/// (CustomReminderConfiguration serializes/deserializes it via System.Text.Json with a hand-
/// written ValueComparer) — it has no real translation semantics against
/// Reforge.Infra.Lite's InMemoryCustomReminderRepository (a plain list), so a regression there
/// would pass unnoticed against the in-memory fake. Also proves UpdateAsync/DeleteAsync are
/// scoped to the caller's own userId, same pattern as MealLibraryRepositoryTests. See README.md.
/// </summary>
[Collection(PersistenceTestCollection.Name)]
public class CustomReminderRepositoryTests(PostgresFixture fixture) : PersistenceTestBase(fixture)
{
    [Fact]
    public async Task AddAsync_and_GetByUserIdAsync_round_trip_a_custom_reminder_including_days_of_week()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new CustomReminderRepository(dbContext);
        var userId = new UserId("reforge-custom-reminder-user-1");
        var reminder = new CustomReminder(
            Guid.NewGuid(),
            userId,
            label: "Registra tu cena",
            time: "20:00",
            daysOfWeek: ["monday", "wednesday", "friday"],
            enabled: true,
            updatedAt: DateTime.UtcNow);

        await repository.AddAsync(reminder);
        var reloaded = await repository.GetByUserIdAsync(userId);

        reloaded.Should().ContainSingle();
        var stored = reloaded[0];
        stored.Id.Should().Be(reminder.Id);
        stored.UserId.Should().Be(userId);
        stored.Label.Should().Be("Registra tu cena");
        stored.Time.Should().Be("20:00");
        stored.DaysOfWeek.Should().Equal("monday", "wednesday", "friday");
        stored.Enabled.Should().BeTrue();
    }

    [Fact]
    public async Task UpdateAsync_scoped_to_the_correct_userId_does_not_update_another_users_reminder()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new CustomReminderRepository(dbContext);
        var ownerId = new UserId("reforge-custom-reminder-user-2");
        var otherId = new UserId("reforge-custom-reminder-user-other");

        var reminder = new CustomReminder(
            Guid.NewGuid(), ownerId, "Registra tu cena", "20:00", ["monday"], enabled: true, updatedAt: DateTime.UtcNow);
        await repository.AddAsync(reminder);

        var updated = await repository.UpdateAsync(new CustomReminder(
            reminder.Id, otherId, "Hacked", "00:00", ["sunday"], enabled: false, updatedAt: DateTime.UtcNow));

        updated.Should().BeFalse();
        var stillThere = await repository.GetByUserIdAsync(ownerId);
        stillThere.Should().ContainSingle(r => r.Label == "Registra tu cena");
    }

    [Fact]
    public async Task UpdateAsync_for_the_owning_user_fully_replaces_the_reminder()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new CustomReminderRepository(dbContext);
        var userId = new UserId("reforge-custom-reminder-user-3");

        var reminder = new CustomReminder(
            Guid.NewGuid(), userId, "Registra tu cena", "20:00", ["monday"], enabled: true, updatedAt: DateTime.UtcNow);
        await repository.AddAsync(reminder);

        var updated = await repository.UpdateAsync(new CustomReminder(
            reminder.Id, userId, "Registra tu almuerzo", "13:00", ["tuesday", "thursday"], enabled: false, updatedAt: DateTime.UtcNow));

        updated.Should().BeTrue();
        var reloaded = await repository.GetByUserIdAsync(userId);
        reloaded.Should().ContainSingle();
        reloaded[0].Label.Should().Be("Registra tu almuerzo");
        reloaded[0].Time.Should().Be("13:00");
        reloaded[0].DaysOfWeek.Should().Equal("tuesday", "thursday");
        reloaded[0].Enabled.Should().BeFalse();
    }

    [Fact]
    public async Task DeleteAsync_scoped_to_the_correct_userId_does_not_remove_another_users_reminder()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new CustomReminderRepository(dbContext);
        var ownerId = new UserId("reforge-custom-reminder-user-4");
        var otherId = new UserId("reforge-custom-reminder-user-other-2");

        var reminder = new CustomReminder(
            Guid.NewGuid(), ownerId, "Registra tu cena", "20:00", ["monday"], enabled: true, updatedAt: DateTime.UtcNow);
        await repository.AddAsync(reminder);

        var deleted = await repository.DeleteAsync(otherId, reminder.Id);

        deleted.Should().BeFalse();
        var stillThere = await repository.GetByUserIdAsync(ownerId);
        stillThere.Should().ContainSingle(r => r.Id == reminder.Id);
    }

    [Fact]
    public async Task DeleteAsync_for_the_owning_user_removes_the_reminder()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new CustomReminderRepository(dbContext);
        var userId = new UserId("reforge-custom-reminder-user-5");

        var reminder = new CustomReminder(
            Guid.NewGuid(), userId, "Registra tu cena", "20:00", ["monday"], enabled: true, updatedAt: DateTime.UtcNow);
        await repository.AddAsync(reminder);

        var deleted = await repository.DeleteAsync(userId, reminder.Id);

        deleted.Should().BeTrue();
        (await repository.GetByUserIdAsync(userId)).Should().BeEmpty();
    }
}
