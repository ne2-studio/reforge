using Microsoft.EntityFrameworkCore;
using Reforge.Core.Users.Domain;

namespace Reforge.Infra;

public class ReforgeDbContext(DbContextOptions<ReforgeDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ReforgeDbContext).Assembly);
    }
}
