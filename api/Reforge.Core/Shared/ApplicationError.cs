namespace Reforge.Core.Shared;

// Mirrors el-baul's Ne2Studio.Common.ApplicationError. The mapping to HTTP status codes
// (Reforge.Api.Common.ErrorMapping) is driven by Code, never by Message text — see
// docs/API-CONVENTIONS.md.
public enum ApplicationErrorCode
{
    Validation,
    NotFound,
    Forbidden,
    ExternalDependencyUnavailable
}

public readonly record struct ApplicationError(ApplicationErrorCode Code, string Message)
{
    public static ApplicationError Validation(string message) =>
        new(ApplicationErrorCode.Validation, message);

    public static ApplicationError NotFound(string message) =>
        new(ApplicationErrorCode.NotFound, message);

    public static ApplicationError Forbidden(string message) =>
        new(ApplicationErrorCode.Forbidden, message);

    public static ApplicationError ExternalDependencyUnavailable(string message) =>
        new(ApplicationErrorCode.ExternalDependencyUnavailable, message);

    public override string ToString() => Message;
}
