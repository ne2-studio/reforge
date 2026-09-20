using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Reforge.Core.Activities.OutputPorts;
using Reforge.Core.MealLibrary.OutputPorts;
using Reforge.Core.Meals.OutputPorts;
using Reforge.Core.Measurements.OutputPorts;
using Reforge.Core.Profiles.OutputPorts;
using Reforge.Core.Shared.OutputPorts;
using Reforge.Core.Users.OutputPorts;
using Reforge.Core.Workouts.OutputPorts;
using Reforge.Infra;

namespace Reforge.Infra.Lite;

public static class ServiceRegistration
{
    public static IServiceCollection AddLiteInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // Singleton, not Scoped: with no database behind it, this dictionary *is* the storage —
        // it needs to survive across requests, which is what Postgres does for the real adapter.
        services.AddSingleton<IUserRepository, InMemoryUserRepository>();
        services.AddSingleton<IProfileRepository, InMemoryProfileRepository>();
        services.AddSingleton<IMealRepository, InMemoryMealRepository>();
        services.AddSingleton<IMealLibraryRepository, InMemoryMealLibraryRepository>();
        services.AddSingleton<IActivityRepository, InMemoryActivityRepository>();
        services.AddSingleton<IWorkoutRepository, InMemoryWorkoutRepository>();
        services.AddSingleton<IMeasurementRepository, InMemoryMeasurementRepository>();

        services.AddScoped<IClock, SystemClock>();
        services.AddScoped<IIdGenerator, SystemGuidIdGenerator>();

        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserProvider, HttpContextCurrentUserProvider>();

        return services;
    }
}
