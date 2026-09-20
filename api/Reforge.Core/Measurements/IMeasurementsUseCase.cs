using Reforge.Core.Shared;

namespace Reforge.Core.Measurements;

/// <summary>
/// Slice 5 (docs/plan/02-vertical-slices.md): a user's logged body measurements — create + list
/// only, no update/delete (the source backend's deleteUserMeasurements is tied to account
/// deletion, out of scope here). Both verbs resolve the caller's identity themselves via
/// ICurrentUserProvider; it is never a parameter here.
/// </summary>
public interface IMeasurementsUseCase
{
    /// <summary>The caller's own measurements, most recent first (mirrors the source backend's
    /// GET /measurements, which orders by timestamp desc).</summary>
    Task<Result<List<MeasurementDto>>> GetMeasurementsAsync();

    /// <summary>Logs a new measurement for the caller and returns it. The timestamp is always
    /// server-set — the request never carries one. Rejects a request where weight, waist and
    /// neck are all null, mirroring the source frontend's own saveMeasurement guard ("Ingresa al
    /// menos una medida").</summary>
    Task<Result<MeasurementDto>> LogMeasurementAsync(LogMeasurementRequestDto request);
}

public record MeasurementDto(
    Guid Id,
    double? Weight,
    double? Waist,
    double? Neck,
    DateTime Timestamp);

public record LogMeasurementRequestDto(
    double? Weight,
    double? Waist,
    double? Neck);
