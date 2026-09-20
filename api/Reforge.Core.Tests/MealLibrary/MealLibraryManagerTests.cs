using Reforge.Domain;
using Reforge.Core.MealLibrary;
using Reforge.Core.MealLibrary.Application;
using Reforge.Core.MealLibrary.Domain;
using Reforge.Core.Shared;
using Reforge.Core.Tests.Fakes;

namespace Reforge.Core.Tests.MealLibrary;

public class MealLibraryManagerTests
{
    private static readonly UserId UserId = new("auth0|meal-library-user");
    private static readonly UserId OtherUserId = new("auth0|someone-else");

    [Fact]
    public async Task GetLibraryAsync_ReturnsOnlyTheCallersOwnItems()
    {
        var repository = new FakeMealLibraryRepository();
        var mine = NewItem(UserId);
        var theirs = NewItem(OtherUserId);
        repository.Seed(mine);
        repository.Seed(theirs);

        var manager = new MealLibraryManager(
            new FakeCurrentUserProvider(UserId),
            repository,
            new FakeIdGenerator(Guid.NewGuid()));

        var result = await manager.GetLibraryAsync();

        Assert.True(result.IsSuccess);
        Assert.Single(result.Value);
        Assert.Equal(mine.Id, result.Value[0].Id);
    }

    [Fact]
    public async Task SaveToLibraryAsync_CreatesUnderTheCallersUserId_AndReturnsTheSavedItem()
    {
        var repository = new FakeMealLibraryRepository();
        var id = Guid.NewGuid();

        var manager = new MealLibraryManager(
            new FakeCurrentUserProvider(UserId),
            repository,
            new FakeIdGenerator(id));

        var request = new SaveMealLibraryItemRequestDto(
            Title: "Chicken and rice",
            Description: "A simple bulking staple",
            Category: "lunch",
            Calories: 600,
            Protein: 50,
            Carbs: 60,
            Fats: 15);

        var result = await manager.SaveToLibraryAsync(request);

        Assert.True(result.IsSuccess);
        Assert.Equal(id, result.Value.Id);
        Assert.Equal("Chicken and rice", result.Value.Title);
        Assert.Equal("A simple bulking staple", result.Value.Description);
        Assert.Equal("lunch", result.Value.Category);
        Assert.Equal(600, result.Value.Calories);

        var stored = await repository.GetByUserIdAsync(UserId);
        Assert.Single(stored);
        Assert.Equal(UserId, stored[0].UserId);
    }

    [Fact]
    public async Task DeleteFromLibraryAsync_SucceedsForAnOwnedItem()
    {
        var repository = new FakeMealLibraryRepository();
        var item = NewItem(UserId);
        repository.Seed(item);

        var manager = new MealLibraryManager(
            new FakeCurrentUserProvider(UserId),
            repository,
            new FakeIdGenerator(Guid.NewGuid()));

        var result = await manager.DeleteFromLibraryAsync(item.Id);

        Assert.True(result.IsSuccess);
        Assert.Empty(await repository.GetByUserIdAsync(UserId));
    }

    [Fact]
    public async Task DeleteFromLibraryAsync_WhenTheItemBelongsToAnotherUser_ReturnsNotFound()
    {
        var repository = new FakeMealLibraryRepository();
        var theirs = NewItem(OtherUserId);
        repository.Seed(theirs);

        var manager = new MealLibraryManager(
            new FakeCurrentUserProvider(UserId),
            repository,
            new FakeIdGenerator(Guid.NewGuid()));

        var result = await manager.DeleteFromLibraryAsync(theirs.Id);

        Assert.True(result.IsFailure);
        Assert.Equal(ApplicationErrorCode.NotFound, result.Error.Code);
        // The other user's item must survive the attempt.
        Assert.Single(await repository.GetByUserIdAsync(OtherUserId));
    }

    [Fact]
    public async Task DeleteFromLibraryAsync_WhenTheItemDoesNotExist_ReturnsNotFound()
    {
        var manager = new MealLibraryManager(
            new FakeCurrentUserProvider(UserId),
            new FakeMealLibraryRepository(),
            new FakeIdGenerator(Guid.NewGuid()));

        var result = await manager.DeleteFromLibraryAsync(Guid.NewGuid());

        Assert.True(result.IsFailure);
        Assert.Equal(ApplicationErrorCode.NotFound, result.Error.Code);
    }

    private static MealLibraryItem NewItem(UserId userId) => new(
        Guid.NewGuid(),
        userId,
        "Test meal",
        "A test description",
        "lunch",
        calories: 500,
        protein: 30,
        carbs: 40,
        fats: 10);
}
