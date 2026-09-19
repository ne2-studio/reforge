namespace Reforge.AcceptanceTests;

/// <summary>
/// Shares one ReforgeAcceptanceFixture (one running Postgres+fake-oidc+backend stack) across
/// every test class below — xunit builds it once per collection per test run, not once per
/// class, which matters here since starting three containers and waiting for the backend's
/// migrations to run is the expensive part of each of these tests.
/// </summary>
[CollectionDefinition(Name)]
public class AcceptanceTestCollection : ICollectionFixture<ReforgeAcceptanceFixture>
{
    public const string Name = "Reforge acceptance";
}
