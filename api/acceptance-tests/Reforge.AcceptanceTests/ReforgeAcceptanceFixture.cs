using DotNet.Testcontainers.Builders;
using DotNet.Testcontainers.Containers;
using DotNet.Testcontainers.Networks;

namespace Reforge.AcceptanceTests;

/// <summary>
/// Boots the same shape of stack docker-compose.yaml gives local dev — Postgres, fake-oidc, and
/// the backend image under test — on an isolated Docker network, entirely through their public
/// images/ports/env vars. Shared by every test class in the <see cref="AcceptanceTestCollection"/>
/// collection: one stack per test run, not per test, since the backend genuinely cannot start
/// without a reachable Postgres (it runs migrations before it starts serving — see Program.cs —
/// so there is no lighter-weight "smoke only" environment to fall back to).
///
/// This fixture never references anything under api/Reforge*/ — it only knows public image
/// names, ports, and environment variable contracts, exactly like an operator standing up this
/// stack from the outside would. See ../README.md for the full rule set.
/// </summary>
public sealed class ReforgeAcceptanceFixture : IAsyncLifetime
{
    private const string PostgresUser = "imagetest";
    private const string PostgresPassword = "imagetest";
    private const string PostgresDatabase = "reforge";
    public const string OidcClientId = "reforge-app";
    public const string OidcUserKey = "user";
    public const string OidcUserSub = "reforge-user";
    public const string OidcSecondUserKey = "user2";
    public const string OidcSecondUserSub = "reforge-user-2";
    public const string OidcRedirectUri = "https://acceptance-test.reforge.invalid/callback";

    public INetwork Network { get; private set; } = null!;
    public IContainer Postgres { get; private set; } = null!;
    public IContainer FakeOidc { get; private set; } = null!;
    public IContainer Backend { get; private set; } = null!;

    public HttpClient BackendClient { get; private set; } = null!;
    public HttpClient FakeOidcClient { get; private set; } = null!;
    public string DockerHost { get; } = Environment.GetEnvironmentVariable("TESTCONTAINERS_HOST_OVERRIDE") ?? "localhost";

    /// <summary>
    /// The full set of env vars the backend needs to reach the sibling containers on
    /// <see cref="Network"/> by their network alias — the issuer here is the container alias
    /// (`fake-oidc`), not `localhost`, since this isolated network shares no host-mapped ports
    /// with docker-compose.yaml's own dev stack.
    /// </summary>
    public Dictionary<string, string> BackendEnvironment => new()
    {
        ["ASPNETCORE_ENVIRONMENT"] = "Testing",
        ["ConnectionStrings__DefaultConnection"] =
            $"Host=postgres;Port=5432;Database={PostgresDatabase};Username={PostgresUser};Password={PostgresPassword}",
        ["Auth__JwksUri"] = "http://fake-oidc:5000/.well-known/jwks.json",
        ["Auth__ValidIssuer"] = "http://fake-oidc:5000",
        ["Auth__ValidAudiences__0"] = OidcClientId,
    };

    public async Task InitializeAsync()
    {
        var backendImage = Environment.GetEnvironmentVariable("BACKEND_IMAGE")
            ?? throw new InvalidOperationException(
                "BACKEND_IMAGE is required — point it at the image under test, " +
                "e.g. BACKEND_IMAGE=reforge-api:test");

        Network = new NetworkBuilder().Build();
        await Network.CreateAsync();

        Postgres = new ContainerBuilder("postgres:16")
            .WithNetwork(Network)
            .WithNetworkAliases("postgres")
            .WithEnvironment("POSTGRES_USER", PostgresUser)
            .WithEnvironment("POSTGRES_PASSWORD", PostgresPassword)
            .WithEnvironment("POSTGRES_DB", PostgresDatabase)
            .WithWaitStrategy(Wait.ForUnixContainer().UntilCommandIsCompleted(
                "pg_isready", "-U", PostgresUser, "-d", PostgresDatabase))
            .Build();

        FakeOidc = new ContainerBuilder("ghcr.io/ne2-studio/fake-oidc:latest")
            .WithNetwork(Network)
            .WithNetworkAliases("fake-oidc")
            .WithPortBinding(5000, true)
            .WithEnvironment("OIDC_ISSUER", "http://fake-oidc:5000")
            .WithEnvironment("OIDC_CLIENTS", $$"""[{"clientId":"{{OidcClientId}}","redirectUris":["{{OidcRedirectUri}}"]}]""")
            .WithEnvironment("OIDC_USERS", $$"""[{"key":"{{OidcUserKey}}","sub":"{{OidcUserSub}}","email":"user@acceptance-test.reforge.invalid","name":"Acceptance Test User"},{"key":"{{OidcSecondUserKey}}","sub":"{{OidcSecondUserSub}}","email":"user2@acceptance-test.reforge.invalid","name":"Second Acceptance Test User"}]""")
            .WithWaitStrategy(Wait.ForUnixContainer().UntilHttpRequestIsSucceeded(r => r
                .ForPort(5000)
                .ForPath("/health")))
            .Build();

        await Task.WhenAll(Postgres.StartAsync(), FakeOidc.StartAsync());

        var backendBuilder = new ContainerBuilder(backendImage)
            .WithNetwork(Network)
            .WithNetworkAliases("backend")
            .WithPortBinding(8080, true)
            .WithWaitStrategy(Wait.ForUnixContainer().UntilHttpRequestIsSucceeded(r => r
                .ForPort(8080)
                .ForPath("/health")));
        foreach (var (key, value) in BackendEnvironment)
        {
            backendBuilder = backendBuilder.WithEnvironment(key, value);
        }
        Backend = backendBuilder.Build();

        await Backend.StartAsync();

        BackendClient = new HttpClient
        {
            BaseAddress = new Uri($"http://{DockerHost}:{Backend.GetMappedPublicPort(8080)}")
        };
        FakeOidcClient = new HttpClient
        {
            BaseAddress = new Uri($"http://{DockerHost}:{FakeOidc.GetMappedPublicPort(5000)}")
        };
    }

    public FakeOidcTokenClient CreateOidcTokenClient() => new(FakeOidcClient.BaseAddress!);

    public async Task DisposeAsync()
    {
        BackendClient.Dispose();
        FakeOidcClient.Dispose();

        // Containers hold a reference to Network, so they must stop before it's disposed.
        await Backend.DisposeAsync();
        await Task.WhenAll(Postgres.DisposeAsync().AsTask(), FakeOidc.DisposeAsync().AsTask());
        await Network.DisposeAsync();
    }
}
