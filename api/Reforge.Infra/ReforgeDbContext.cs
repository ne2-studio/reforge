using Microsoft.EntityFrameworkCore;
using Reforge.Core.MealLibrary.Domain;
using Reforge.Core.Meals.Domain;
using Reforge.Core.Profiles.Domain;
using Reforge.Core.Users.Domain;

namespace Reforge.Infra;

public class ReforgeDbContext(DbContextOptions<ReforgeDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<UserProfile> UserProfiles => Set<UserProfile>();
    public DbSet<Meal> Meals => Set<Meal>();
    public DbSet<MealLibraryItem> MealLibraryItems => Set<MealLibraryItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ReforgeDbContext).Assembly);
    }
}
