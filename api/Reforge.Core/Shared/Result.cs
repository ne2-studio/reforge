namespace Reforge.Core.Shared;

// The one outcome vocabulary for the whole core — every fallible operation (use cases and
// output ports alike) returns Result/Result<T> instead of throwing for expected failures.
// Mirrors el-baul's Ne2Studio.Common.Result, inlined here rather than pulled from a shared
// library since Reforge has no equivalent cross-repo package yet.
public readonly record struct Result
{
    private readonly ApplicationError _error;

    private Result(bool isSuccess, ApplicationError error)
    {
        IsSuccess = isSuccess;
        _error = error;
    }

    public bool IsSuccess { get; }
    public bool IsFailure => !IsSuccess;

    public ApplicationError Error =>
        IsFailure ? _error : throw new InvalidOperationException("There is no error for a successful result.");

    public static Result Success() => new(true, default);

    public static Result<T> Success<T>(T value) => Result<T>.Success(value);

    public static Result Failure(ApplicationError error) => new(false, error);

    public static Result<T> Failure<T>(ApplicationError error) => Result<T>.Failure(error);

    public Result<T> Bind<T>(Func<Result<T>> next) => IsSuccess ? next() : Result.Failure<T>(_error);
}

public readonly record struct Result<T>
{
    private readonly T? _value;
    private readonly ApplicationError _error;

    private Result(bool isSuccess, T? value, ApplicationError error)
    {
        IsSuccess = isSuccess;
        _value = value;
        _error = error;
    }

    public bool IsSuccess { get; }
    public bool IsFailure => !IsSuccess;

    public T Value =>
        IsSuccess ? _value! : throw new InvalidOperationException("There is no value for a failed result.");

    public ApplicationError Error =>
        IsFailure ? _error : throw new InvalidOperationException("There is no error for a successful result.");

    public static Result<T> Success(T value) => new(true, value, default);

    public static Result<T> Failure(ApplicationError error) => new(false, default, error);

    public static implicit operator Result<T>(T value) => Success(value);

    public Result<TOut> Bind<TOut>(Func<T, Result<TOut>> next) => IsSuccess ? next(Value) : Result.Failure<TOut>(Error);

    public Result<TOut> Map<TOut>(Func<T, TOut> map) => IsSuccess ? Result.Success(map(Value)) : Result.Failure<TOut>(Error);
}
