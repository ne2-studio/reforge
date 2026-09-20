using Reforge.Core.Measurements.Domain;
using Reforge.Core.Measurements.OutputPorts;
using Reforge.Core.Shared;
using Reforge.Core.Shared.OutputPorts;

namespace Reforge.Core.Measurements.Application;

public class MeasurementsManager(
    ICurrentUserProvider currentUserProvider,
    IMeasurementRepository measurementRepository,
    IClock clock,
    IIdGenerator idGenerator) : IMeasurementsUseCase
{
    public async Task<Result<List<MeasurementDto>>> GetMeasurementsAsync()
    {
        var userId = currentUserProvider.GetUserId();
        var measurements = await measurementRepository.GetByUserIdAsync(userId);
        return Result.Success(measurements.Select(ToDto).ToList());
    }

    public async Task<Result<MeasurementDto>> LogMeasurementAsync(LogMeasurementRequestDto request)
    {
        if (request.Weight is null && request.Waist is null && request.Neck is null)
            return Result.Failure<MeasurementDto>(
                ApplicationError.Validation("Ingresa al menos una medida"));

        var userId = currentUserProvider.GetUserId();
        var measurement = new Measurement(
            idGenerator.NewId(),
            userId,
            timestamp: clock.UtcNow(),
            weight: request.Weight,
            waist: request.Waist,
            neck: request.Neck);

        await measurementRepository.AddAsync(measurement);

        return Result.Success(ToDto(measurement));
    }

    private static MeasurementDto ToDto(Measurement measurement) => new(
        measurement.Id,
        measurement.Weight,
        measurement.Waist,
        measurement.Neck,
        measurement.Timestamp);
}
