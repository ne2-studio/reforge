using FluentAssertions;
using Reforge.Core.Measurements.Domain;
using Reforge.Domain;
using Reforge.Infra.Persistence;

namespace Reforge.Infra.PersistenceTests;

/// <summary>
/// Same pattern as ActivityRepositoryTests: round-trip a real add+get, prove GetByUserIdAsync
/// orders by timestamp desc, and prove the repository is scoped to the correct userId — another
/// user's measurements are never returned. See README.md.
/// </summary>
[Collection(PersistenceTestCollection.Name)]
public class MeasurementRepositoryTests(PostgresFixture fixture) : PersistenceTestBase(fixture)
{
    [Fact]
    public async Task AddAsync_and_GetByUserIdAsync_round_trip_a_measurement()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new MeasurementRepository(dbContext);
        var userId = new UserId("reforge-measurements-user-1");
        var timestamp = new DateTime(2026, 3, 4, 13, 0, 0, DateTimeKind.Utc);
        var measurement = new Measurement(
            Guid.NewGuid(),
            userId,
            timestamp: timestamp,
            weight: 82.5,
            waist: 85,
            neck: null);

        await repository.AddAsync(measurement);
        var reloaded = await repository.GetByUserIdAsync(userId);

        reloaded.Should().ContainSingle();
        var stored = reloaded[0];
        stored.Id.Should().Be(measurement.Id);
        stored.UserId.Should().Be(userId);
        stored.Weight.Should().Be(82.5);
        stored.Waist.Should().Be(85);
        stored.Neck.Should().BeNull();
        stored.Timestamp.Should().BeCloseTo(timestamp, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public async Task GetByUserIdAsync_orders_the_callers_own_measurements_by_timestamp_descending()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new MeasurementRepository(dbContext);
        var userId = new UserId("reforge-measurements-user-2");
        var otherUserId = new UserId("reforge-measurements-user-other");

        var older = NewMeasurement(userId, new DateTime(2026, 3, 1, 8, 0, 0, DateTimeKind.Utc));
        var newer = NewMeasurement(userId, new DateTime(2026, 3, 2, 8, 0, 0, DateTimeKind.Utc));
        var othersMeasurement = NewMeasurement(otherUserId, new DateTime(2026, 3, 3, 8, 0, 0, DateTimeKind.Utc));
        await repository.AddAsync(older);
        await repository.AddAsync(newer);
        await repository.AddAsync(othersMeasurement);

        var reloaded = await repository.GetByUserIdAsync(userId);

        reloaded.Select(m => m.Id).Should().Equal(newer.Id, older.Id);
    }

    [Fact]
    public async Task GetByUserIdAsync_is_scoped_to_the_correct_userId_and_never_returns_another_users_measurements()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new MeasurementRepository(dbContext);
        var ownerId = new UserId("reforge-measurements-user-3");
        var otherId = new UserId("reforge-measurements-user-other-2");

        await repository.AddAsync(NewMeasurement(ownerId, DateTime.UtcNow));
        await repository.AddAsync(NewMeasurement(otherId, DateTime.UtcNow));

        var reloaded = await repository.GetByUserIdAsync(otherId);

        reloaded.Should().ContainSingle();
        reloaded[0].UserId.Should().Be(otherId);
    }

    private static Measurement NewMeasurement(UserId userId, DateTime timestamp) => new(
        Guid.NewGuid(),
        userId,
        timestamp: timestamp,
        weight: 80,
        waist: 85,
        neck: 38);
}
