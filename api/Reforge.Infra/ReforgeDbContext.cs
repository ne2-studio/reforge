using Microsoft.EntityFrameworkCore;
using Reforge.Core.Activities.Domain;
using Reforge.Core.MealLibrary.Domain;
using Reforge.Core.Meals.Domain;
using Reforge.Core.Profiles.Domain;
using Reforge.Core.Users.Domain;
using Reforge.Core.Workouts.Domain;

namespace Reforge.Infra;

public class ReforgeDbContext(DbContextOptions<ReforgeDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<UserProfile> UserProfiles => Set<UserProfile>();
    public DbSet<Meal> Meals => Set<Meal>();
    public DbSet<MealLibraryItem> MealLibraryItems => Set<MealLibraryItem>();
    public DbSet<Activity> Activities => Set<Activity>();
    public DbSet<Workout> Workouts => Set<Workout>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ReforgeDbContext).Assembly);
    }
}
