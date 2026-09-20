using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Reforge.Core.Activities.OutputPorts;
using Reforge.Core.ClosedDays.OutputPorts;
using Reforge.Core.MealLibrary.OutputPorts;
using Reforge.Core.Meals.OutputPorts;
using Reforge.Core.Measurements.OutputPorts;
using Reforge.Core.Profiles.OutputPorts;
using Reforge.Core.Reminders.OutputPorts;
using Reforge.Core.Shared.OutputPorts;
using Reforge.Core.Users.OutputPorts;
using Reforge.Core.Workouts.OutputPorts;
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

        services.AddScoped<IClock, SystemClock>();
        services.AddScoped<IIdGenerator, SystemGuidIdGenerator>();

        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserProvider, HttpContextCurrentUserProvider>();

        return services;
    }
}
