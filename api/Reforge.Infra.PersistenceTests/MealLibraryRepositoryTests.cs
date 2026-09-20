using FluentAssertions;
using Reforge.Core.MealLibrary.Domain;
using Reforge.Domain;
using Reforge.Infra.Persistence;

namespace Reforge.Infra.PersistenceTests;

/// <summary>
/// Same pattern as MealRepositoryTests: round-trip a real add+get, and prove DeleteAsync is
/// scoped to the caller's own userId — deleting another user's item must neither remove it nor
/// report success. See README.md.
/// </summary>
[Collection(PersistenceTestCollection.Name)]
public class MealLibraryRepositoryTests(PostgresFixture fixture) : PersistenceTestBase(fixture)
{
    [Fact]
    public async Task AddAsync_and_GetByUserIdAsync_round_trip_a_meal_library_item()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new MealLibraryRepository(dbContext);
        var userId = new UserId("reforge-meal-library-user-1");
        var item = new MealLibraryItem(
            Guid.NewGuid(),
            userId,
            "Chicken and rice",
            "A simple bulking staple",
            "lunch",
            calories: 600,
            protein: 50,
            carbs: 60,
            fats: 15);

        await repository.AddAsync(item);
        var reloaded = await repository.GetByUserIdAsync(userId);

        reloaded.Should().ContainSingle();
        var stored = reloaded[0];
        stored.Id.Should().Be(item.Id);
        stored.UserId.Should().Be(userId);
        stored.Title.Should().Be("Chicken and rice");
        stored.Description.Should().Be("A simple bulking staple");
        stored.Category.Should().Be("lunch");
        stored.Calories.Should().Be(600);
        stored.Protein.Should().Be(50);
        stored.Carbs.Should().Be(60);
        stored.Fats.Should().Be(15);
    }

    [Fact]
    public async Task DeleteAsync_scoped_to_the_correct_userId_does_not_remove_another_users_item()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new MealLibraryRepository(dbContext);
        var ownerId = new UserId("reforge-meal-library-user-2");
        var otherId = new UserId("reforge-meal-library-user-other");

        var item = new MealLibraryItem(
            Guid.NewGuid(), ownerId, "Test meal", "A test description", "lunch",
            calories: 400, protein: 30, carbs: 40, fats: 10);
        await repository.AddAsync(item);

        var deleted = await repository.DeleteAsync(otherId, item.Id);

        deleted.Should().BeFalse();
        var stillThere = await repository.GetByUserIdAsync(ownerId);
        stillThere.Should().ContainSingle(m => m.Id == item.Id);
    }

    [Fact]
    public async Task DeleteAsync_for_the_owning_user_removes_the_item()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new MealLibraryRepository(dbContext);
        var userId = new UserId("reforge-meal-library-user-3");

        var item = new MealLibraryItem(
            Guid.NewGuid(), userId, "Test meal", "A test description", "lunch",
            calories: 400, protein: 30, carbs: 40, fats: 10);
        await repository.AddAsync(item);

        var deleted = await repository.DeleteAsync(userId, item.Id);

        deleted.Should().BeTrue();
        (await repository.GetByUserIdAsync(userId)).Should().BeEmpty();
    }
}
