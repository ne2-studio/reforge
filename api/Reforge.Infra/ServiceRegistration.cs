using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Reforge.Core.Shared.OutputPorts;
using Reforge.Core.Users.OutputPorts;
using Reforge.Infra.Persistence;

namespace Reforge.Infra;

public static class ServiceRegistration
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ReforgeDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        services.AddScoped<IUserRepository, UserRepository>();

        services.AddScoped<IClock, SystemClock>();

        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserProvider, HttpContextCurrentUserProvider>();

        return services;
    }
}
