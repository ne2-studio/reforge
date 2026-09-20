using Reforge.Domain;
using Reforge.Core.Measurements;
using Reforge.Core.Measurements.Application;
using Reforge.Core.Measurements.Domain;
using Reforge.Core.Shared;
using Reforge.Core.Tests.Fakes;

namespace Reforge.Core.Tests.Measurements;

public class MeasurementsManagerTests
{
    private static readonly UserId UserId = new("auth0|measurements-user");
    private static readonly UserId OtherUserId = new("auth0|someone-else");

    [Fact]
    public async Task GetMeasurementsAsync_ReturnsTheCallersOwnMeasurements_MostRecentFirst()
    {
        var repository = new FakeMeasurementRepository();
        var theirs = NewMeasurement(userId: OtherUserId, timestamp: new DateTime(2026, 1, 1, 8, 0, 0, DateTimeKind.Utc));
        var older = NewMeasurement(timestamp: new DateTime(2026, 1, 1, 8, 0, 0, DateTimeKind.Utc));
        var newer = NewMeasurement(timestamp: new DateTime(2026, 1, 2, 8, 0, 0, DateTimeKind.Utc));
        repository.Seed(theirs);
        repository.Seed(older);
        repository.Seed(newer);

        var manager = new MeasurementsManager(
            new FakeCurrentUserProvider(UserId),
            repository,
            new FakeClock(DateTime.UtcNow),
            new FakeIdGenerator(Guid.NewGuid()));

        var result = await manager.GetMeasurementsAsync();

        Assert.True(result.IsSuccess);
        Assert.Equal(2, result.Value.Count);
        Assert.Equal(newer.Id, result.Value[0].Id);
        Assert.Equal(older.Id, result.Value[1].Id);
    }

    [Fact]
    public async Task LogMeasurementAsync_SavesUnderTheCallersUserId_WithAServerSetTimestamp_AndReturnsTheSavedMeasurement()
    {
        var repository = new FakeMeasurementRepository();
        var now = new DateTime(2026, 3, 4, 12, 30, 0, DateTimeKind.Utc);
        var id = Guid.NewGuid();

        var manager = new MeasurementsManager(
            new FakeCurrentUserProvider(UserId),
            repository,
            new FakeClock(now),
            new FakeIdGenerator(id));

        var request = new LogMeasurementRequestDto(
            Weight: 82.5,
            Waist: null,
            Neck: 38);

        var result = await manager.LogMeasurementAsync(request);

        Assert.True(result.IsSuccess);
        Assert.Equal(id, result.Value.Id);
        Assert.Equal(82.5, result.Value.Weight);
        Assert.Null(result.Value.Waist);
        Assert.Equal(38, result.Value.Neck);
        Assert.Equal(now, result.Value.Timestamp);

        var stored = await repository.GetByUserIdAsync(UserId);
        Assert.Single(stored);
        Assert.Equal(UserId, stored[0].UserId);
    }

    [Fact]
    public async Task LogMeasurementAsync_RejectsARequestWhereWeightWaistAndNeckAreAllNull()
    {
        var repository = new FakeMeasurementRepository();

        var manager = new MeasurementsManager(
            new FakeCurrentUserProvider(UserId),
            repository,
            new FakeClock(DateTime.UtcNow),
            new FakeIdGenerator(Guid.NewGuid()));

        var request = new LogMeasurementRequestDto(Weight: null, Waist: null, Neck: null);

        var result = await manager.LogMeasurementAsync(request);

        Assert.True(result.IsFailure);
        Assert.Equal(ApplicationErrorCode.Validation, result.Error.Code);

        var stored = await repository.GetByUserIdAsync(UserId);
        Assert.Empty(stored);
    }

    private static Measurement NewMeasurement(
        UserId? userId = null,
        DateTime? timestamp = null,
        double? weight = 80,
        double? waist = 85,
        double? neck = 38) => new(
            Guid.NewGuid(),
            userId ?? UserId,
            timestamp: timestamp ?? DateTime.UtcNow,
            weight: weight,
            waist: waist,
            neck: neck);
}
