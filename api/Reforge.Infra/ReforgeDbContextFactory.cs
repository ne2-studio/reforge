using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Reforge.Infra;

/// <summary>
/// Lets `dotnet ef migrations add` build the model and generate a migration without a running
/// Program.cs host (which would otherwise need Auth:JwksUri and friends configured) or a live
/// Postgres instance — a placeholder connection string is enough since `migrations add` never
/// actually connects, only `database update` does.
/// </summary>
public class ReforgeDbContextFactory : IDesignTimeDbContextFactory<ReforgeDbContext>
{
    public ReforgeDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<ReforgeDbContext>();
        optionsBuilder.UseNpgsql("Host=localhost;Port=5432;Database=reforge;Username=placeholder;Password=placeholder");

        return new ReforgeDbContext(optionsBuilder.Options);
    }
}
