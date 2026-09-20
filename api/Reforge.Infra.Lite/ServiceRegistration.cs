using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Reforge.Core.Activities.OutputPorts;
using Reforge.Core.Chat.OutputPorts;
using Reforge.Core.MealLibrary.OutputPorts;
using Reforge.Core.Meals.OutputPorts;
using Reforge.Core.Measurements.OutputPorts;
using Reforge.Core.Profiles.OutputPorts;
using Reforge.Core.Reminders.OutputPorts;
using Reforge.Core.Shared.OutputPorts;
using Reforge.Core.Subscriptions.OutputPorts;
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
        services.AddSingleton<IReminderSettingsRepository, InMemoryReminderSettingsRepository>();
        services.AddSingleton<ICustomReminderRepository, InMemoryCustomReminderRepository>();
        services.AddSingleton<IChatMessageRepository, InMemoryChatMessageRepository>();
        services.AddSingleton<ISubscriptionRepository, InMemorySubscriptionRepository>();
        services.AddSingleton<ICheckoutSessionRepository, InMemoryCheckoutSessionRepository>();
        services.AddSingleton<IUsageRepository, InMemoryUsageRepository>();

        services.AddScoped<IClock, SystemClock>();
        services.AddScoped<IIdGenerator, SystemGuidIdGenerator>();

        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserProvider, HttpContextCurrentUserProvider>();

        // Slice 9 (docs/plan/02-vertical-slices.md): identical registration to
        // Reforge.Infra.ServiceRegistration — pure config reading, no Postgres dependency, so
        // there's nothing api-lite-specific to fake here.
        services.Configure<FeaturesOptions>(configuration.GetSection("Features"));
        services.AddScoped<IFeatureFlags, FeatureFlagsProvider>();

        // Slice 8 (docs/plan/00-overview.md, decision 5): fake AI backends, no network calls —
        // used by api-lite and every automated test. Singleton like the in-memory repositories
        // above (NextResult/NextAnalysis and Calls need to survive/be visible across requests).
        services.AddSingleton<IAiChatBackend, FakeAiChatBackend>();
        services.AddSingleton<IMealAnalysisBackend, FakeMealAnalysisBackend>();

        return services;
    }
}
