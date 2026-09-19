using FluentAssertions;
using Reforge.Core.Users.Domain;
using Reforge.Domain;
using Reforge.Infra.Persistence;

namespace Reforge.Infra.PersistenceTests;

/// <summary>
/// UserRepository issues raw SQL with an `ON CONFLICT ("Id") DO NOTHING` upsert and an
/// `ExecuteUpdateAsync` translated column-only update — neither has real conflict/translation
/// semantics against Reforge.Infra.Lite's InMemoryUserRepository (a plain dictionary), so a
/// regression here would pass unnoticed against the in-memory fake. See README.md.
/// </summary>
[Collection(PersistenceTestCollection.Name)]
public class UserRepositoryTests(PostgresFixture fixture) : PersistenceTestBase(fixture)
{
    [Fact]
    public async Task UpsertAsync_and_GetByIdAsync_round_trip_a_user()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new UserRepository(dbContext);
        var createdAt = DateTime.UtcNow;
        var user = new User(new UserId("reforge-user-1"), createdAt);

        await repository.UpsertAsync(user);
        var reloaded = await repository.GetByIdAsync(user.Id);

        reloaded.Should().NotBeNull();
        reloaded!.Id.Should().Be(user.Id);
        reloaded.CreatedAt.Should().BeCloseTo(createdAt, TimeSpan.FromSeconds(1));
        reloaded.LastAccessAt.Should().BeNull();
    }

    [Fact]
    public async Task UpsertAsync_does_nothing_on_conflict_for_an_already_known_id()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new UserRepository(dbContext);
        var original = new User(new UserId("reforge-user-2"), DateTime.UtcNow);
        await repository.UpsertAsync(original);

        // A second UpsertAsync for the same id with a different CreatedAt must be a no-op —
        // an in-memory fake backed by a plain Dictionary has no real ON CONFLICT semantics to
        // get wrong, so it can't catch a regression here.
        await repository.UpsertAsync(new User(original.Id, DateTime.UtcNow.AddDays(1)));

        var reloaded = await repository.GetByIdAsync(original.Id);
        reloaded!.CreatedAt.Should().BeCloseTo(original.CreatedAt, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public async Task UpdateLastAccessAsync_updates_only_the_LastAccessAt_column()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new UserRepository(dbContext);
        var createdAt = DateTime.UtcNow;
        var user = new User(new UserId("reforge-user-3"), createdAt);
        await repository.UpsertAsync(user);

        var accessedAt = createdAt.AddMinutes(5);
        await repository.UpdateLastAccessAsync(user.Id, accessedAt);

        var reloaded = await repository.GetByIdAsync(user.Id);
        reloaded!.LastAccessAt.Should().BeCloseTo(accessedAt, TimeSpan.FromSeconds(1));
        reloaded.CreatedAt.Should().BeCloseTo(createdAt, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public async Task GetByIdAsync_returns_null_for_an_unknown_id()
    {
        await using var dbContext = Fixture.CreateDbContext();
        var repository = new UserRepository(dbContext);

        var reloaded = await repository.GetByIdAsync(new UserId("does-not-exist"));

        reloaded.Should().BeNull();
    }
}
