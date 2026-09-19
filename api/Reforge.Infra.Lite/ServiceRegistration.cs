using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Reforge.Core.Shared.OutputPorts;
using Reforge.Core.Users.OutputPorts;
using Reforge.Infra;

namespace Reforge.Infra.Lite;

public static class ServiceRegistration
{
    public static IServiceCollection AddLiteInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // Singleton, not Scoped: with no database behind it, this dictionary *is* the storage —
        // it needs to survive across requests, which is what Postgres does for the real adapter.
        services.AddSingleton<IUserRepository, InMemoryUserRepository>();

        services.AddScoped<IClock, SystemClock>();

        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserProvider, HttpContextCurrentUserProvider>();

        return services;
    }
}
