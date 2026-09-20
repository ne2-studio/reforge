using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Reforge.Core.Activities.OutputPorts;
using Reforge.Core.Chat.OutputPorts;
using Reforge.Core.ClosedDays.OutputPorts;
using Reforge.Core.MealLibrary.OutputPorts;
using Reforge.Core.Meals.OutputPorts;
using Reforge.Core.Measurements.OutputPorts;
using Reforge.Core.Profiles.OutputPorts;
using Reforge.Core.Reminders.OutputPorts;
using Reforge.Core.Shared.OutputPorts;
using Reforge.Core.Subscriptions.OutputPorts;
using Reforge.Core.Users.OutputPorts;
using Reforge.Core.Workouts.OutputPorts;
using Reforge.Infra.Chat;
using Reforge.Infra.Meals;
using Reforge.Infra.OpenAi;
using Reforge.Infra.Persistence;

namespace Reforge.Infra;

public static class ServiceRegistration
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ReforgeDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IProfileRepository, ProfileRepository>();
        services.AddScoped<IMealRepository, MealRepository>();
        services.AddScoped<IMealLibraryRepository, MealLibraryRepository>();
        services.AddScoped<IActivityRepository, ActivityRepository>();
        services.AddScoped<IWorkoutRepository, WorkoutRepository>();
        services.AddScoped<IMeasurementRepository, MeasurementRepository>();
        services.AddScoped<IReminderSettingsRepository, ReminderSettingsRepository>();
        services.AddScoped<ICustomReminderRepository, CustomReminderRepository>();
        services.AddScoped<IClosedDayRepository, ClosedDayRepository>();
        services.AddScoped<IChatMessageRepository, ChatMessageRepository>();
        services.AddScoped<ISubscriptionRepository, SubscriptionRepository>();
        services.AddScoped<ICheckoutSessionRepository, CheckoutSessionRepository>();
        services.AddScoped<IUsageRepository, UsageRepository>();

        services.AddScoped<IClock, SystemClock>();
        services.AddScoped<IIdGenerator, SystemGuidIdGenerator>();

        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserProvider, HttpContextCurrentUserProvider>();

        // Slice 9 (docs/plan/02-vertical-slices.md): the Features:Subscriptions global toggle —
        // pure config reading, so it lives in Reforge.Infra.Common and is registered identically
        // in both images (see Reforge.Infra.Lite.ServiceRegistration).
        services.Configure<FeaturesOptions>(configuration.GetSection("Features"));
        services.AddScoped<IFeatureFlags, FeatureFlagsProvider>();

        // Slice 8 (docs/plan/02-vertical-slices.md): real OpenAI-backed adapters. See
        // Reforge.Infra.Lite.ServiceRegistration for the fakes used by api-lite/automated tests —
        // the real OpenAI API is never called from those (docs/plan/00-overview.md, decision 5).
        services.Configure<OpenAiOptions>(configuration.GetSection("OpenAi"));
        services.AddHttpClient<IAiChatBackend, OpenAiChatBackend>();
        services.AddHttpClient<IMealAnalysisBackend, OpenAiMealAnalysisBackend>();

        return services;
    }
}
